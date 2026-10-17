-- Etapa 3. Ejecutar una vez después de 004, antes de desplegar el código.
-- Basado en las columnas y restricciones compartidas de progreso_registros.
-- Conserva los textos y registros anteriores. No inventa usos históricos de recursos.
BEGIN;

ALTER TABLE public.progreso_registros
    ADD COLUMN ejercicio_catalogo_id uuid REFERENCES public.ejercicios_catalogo(id) ON DELETE RESTRICT,
    ADD COLUMN modalidad text NOT NULL DEFAULT 'fuerza' CHECK (modalidad IN ('fuerza', 'cardio')),
    ADD COLUMN peso_valor numeric CHECK (peso_valor BETWEEN 0 AND 10000),
    ADD COLUMN peso_unidad text CHECK (peso_unidad IN ('kg', 'lb', 'otro')),
    ADD COLUMN peso_kg numeric CHECK (peso_kg BETWEEN 0 AND 10000),
    ADD COLUMN repeticiones_valor integer CHECK (repeticiones_valor BETWEEN 1 AND 10000),
    ADD COLUMN duracion_segundos integer CHECK (duracion_segundos BETWEEN 1 AND 604800),
    ADD COLUMN distancia_metros numeric CHECK (distancia_metros BETWEEN 0.01 AND 1000000),
    ADD CONSTRAINT progreso_id_gimnasio_unique UNIQUE (id, gimnasio_id),
    ADD CONSTRAINT progreso_metricas_modalidad_check CHECK (
        (modalidad = 'fuerza' AND duracion_segundos IS NULL AND distancia_metros IS NULL)
        OR (modalidad = 'cardio' AND peso_valor IS NULL AND peso_unidad IS NULL
            AND peso_kg IS NULL AND repeticiones_valor IS NULL
            AND (duracion_segundos IS NOT NULL OR distancia_metros IS NOT NULL))
    );

CREATE INDEX progreso_catalogo_alumno_fecha_idx
    ON public.progreso_registros (alumno_id, ejercicio_catalogo_id, fecha);

-- Correspondencias explícitas: no se adivinan ejercicios libres por su nombre.
UPDATE public.progreso_registros p
SET ejercicio_catalogo_id = e.id
FROM public.ejercicios_catalogo e
WHERE p.ejercicio_tipo = 'maquina'
  AND p.maquina_id = e.maquina_origen_id
  AND p.gimnasio_id = e.gimnasio_id;

CREATE TABLE public.progreso_recursos (
    registro_id uuid NOT NULL,
    recurso_id uuid NOT NULL,
    gimnasio_id uuid NOT NULL,
    PRIMARY KEY (registro_id, recurso_id),
    FOREIGN KEY (registro_id, gimnasio_id)
        REFERENCES public.progreso_registros(id, gimnasio_id) ON DELETE CASCADE,
    FOREIGN KEY (recurso_id, gimnasio_id)
        REFERENCES public.recursos_gimnasio(id, gimnasio_id) ON DELETE RESTRICT
);
CREATE INDEX progreso_recursos_recurso_idx ON public.progreso_recursos (recurso_id);
ALTER TABLE public.progreso_recursos ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progreso_recursos TO service_role;

CREATE FUNCTION public.validar_entrenamiento_gimnasio() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $validar$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = NEW.alumno_id AND p.gimnasio_id = NEW.gimnasio_id
    ) THEN
        RAISE EXCEPTION 'El usuario y el registro deben pertenecer al mismo gimnasio.' USING ERRCODE = '23514';
    END IF;
    IF NEW.ejercicio_catalogo_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.ejercicios_catalogo e
        WHERE e.id = NEW.ejercicio_catalogo_id AND e.gimnasio_id = NEW.gimnasio_id
    ) THEN
        RAISE EXCEPTION 'El ejercicio no pertenece al gimnasio.' USING ERRCODE = '23514';
    END IF;
    IF NEW.rutina_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.rutinas r WHERE r.id = NEW.rutina_id
        AND r.gimnasio_id = NEW.gimnasio_id AND r.alumno_id = NEW.alumno_id AND NOT r.es_publica
    ) THEN
        RAISE EXCEPTION 'La rutina no pertenece al usuario.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$validar$;
CREATE TRIGGER progreso_validar_gimnasio
    BEFORE INSERT OR UPDATE OF alumno_id, gimnasio_id, ejercicio_catalogo_id, rutina_id
    ON public.progreso_registros
    FOR EACH ROW EXECUTE FUNCTION public.validar_entrenamiento_gimnasio();

-- Guarda el entrenamiento y los recursos efectivamente seleccionados de forma atómica.
-- Los campos de autoría proceden del backend autenticado; la RPC solo permite service_role.
CREATE FUNCTION public.registrar_entrenamiento_catalogo(p_registro jsonb, p_recurso_ids uuid[])
RETURNS uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $registrar$
DECLARE
    v_registro public.progreso_registros%ROWTYPE;
    v_ejercicio public.ejercicios_catalogo%ROWTYPE;
    v_id uuid;
    v_cantidad integer;
    v_numero integer;
    v_inicio timestamptz;
BEGIN
    v_registro := jsonb_populate_record(NULL::public.progreso_registros, p_registro);
    SELECT * INTO v_ejercicio FROM public.ejercicios_catalogo
    WHERE id = v_registro.ejercicio_catalogo_id AND gimnasio_id = v_registro.gimnasio_id
    FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'El ejercicio no está disponible.' USING ERRCODE = '22023';
    END IF;
    IF v_registro.modalidad IS DISTINCT FROM
        (CASE WHEN v_ejercicio.categoria = 'cardio' THEN 'cardio' ELSE 'fuerza' END) THEN
        RAISE EXCEPTION 'Las métricas no corresponden al ejercicio.' USING ERRCODE = '22023';
    END IF;
    IF p_recurso_ids IS NULL OR cardinality(p_recurso_ids) NOT BETWEEN 1 AND 30 THEN
        RAISE EXCEPTION 'Selecciona los recursos utilizados.' USING ERRCODE = '22023';
    END IF;
    PERFORM 1 FROM public.recursos_gimnasio
    WHERE id = ANY(p_recurso_ids) AND gimnasio_id = v_registro.gimnasio_id FOR SHARE;
    SELECT count(*) INTO v_cantidad FROM public.ejercicio_recursos er
    WHERE er.ejercicio_id = v_ejercicio.id AND er.gimnasio_id = v_registro.gimnasio_id
      AND er.recurso_id = ANY(p_recurso_ids);
    IF v_cantidad <> cardinality(p_recurso_ids) THEN
        RAISE EXCEPTION 'Los recursos deben estar asociados al ejercicio y no repetirse.' USING ERRCODE = '22023';
    END IF;
    IF v_ejercicio.categoria = 'maquina' AND NOT EXISTS (
        SELECT 1 FROM public.recursos_gimnasio r
        WHERE r.id = ANY(p_recurso_ids) AND r.gimnasio_id = v_registro.gimnasio_id AND r.tipo = 'maquina'
    ) THEN
        RAISE EXCEPTION 'Selecciona la máquina utilizada.' USING ERRCODE = '22023';
    END IF;
    IF v_registro.rutina_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.rutina_ejercicios re
        WHERE re.rutina_id = v_registro.rutina_id AND re.ejercicio_catalogo_id = v_ejercicio.id
    ) THEN
        RAISE EXCEPTION 'El ejercicio no pertenece a la rutina.' USING ERRCODE = '22023';
    END IF;
    v_registro.fecha := coalesce(v_registro.fecha, now());
    v_inicio := date_trunc('day', v_registro.fecha AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
    PERFORM pg_advisory_xact_lock(hashtextextended(
        v_registro.alumno_id::text || ':' || v_ejercicio.id::text || ':' ||
        (v_registro.fecha AT TIME ZONE 'UTC')::date::text, 0
    ));
    SELECT coalesce(max(numero_serie), 0) + 1 INTO v_numero FROM public.progreso_registros
    WHERE alumno_id = v_registro.alumno_id AND ejercicio_catalogo_id = v_ejercicio.id
      AND fecha >= v_inicio AND fecha < v_inicio + interval '1 day';

    INSERT INTO public.progreso_registros (
        alumno_id, gimnasio_id, fecha, ejercicio_catalogo_id, modalidad,
        ejercicio_tipo, maquina_id, nombre_libre, rutina_id, numero_serie,
        peso, repeticiones, peso_valor, peso_unidad, peso_kg,
        repeticiones_valor, duracion_segundos, distancia_metros
    ) VALUES (
        v_registro.alumno_id, v_registro.gimnasio_id, v_registro.fecha, v_ejercicio.id, v_registro.modalidad,
        CASE WHEN v_ejercicio.maquina_origen_id IS NULL THEN 'libre' ELSE 'maquina' END,
        v_ejercicio.maquina_origen_id,
        CASE WHEN v_ejercicio.maquina_origen_id IS NULL THEN v_ejercicio.nombre ELSE NULL END,
        v_registro.rutina_id, v_numero,
        v_registro.peso, v_registro.repeticiones, v_registro.peso_valor, v_registro.peso_unidad,
        v_registro.peso_kg, v_registro.repeticiones_valor, v_registro.duracion_segundos, v_registro.distancia_metros
    ) RETURNING id INTO v_id;
    INSERT INTO public.progreso_recursos (registro_id, recurso_id, gimnasio_id)
    SELECT v_id, id, v_registro.gimnasio_id FROM unnest(p_recurso_ids) AS id;
    RETURN v_id;
END;
$registrar$;
REVOKE ALL ON FUNCTION public.registrar_entrenamiento_catalogo(jsonb, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_entrenamiento_catalogo(jsonb, uuid[]) TO service_role;

COMMIT;
