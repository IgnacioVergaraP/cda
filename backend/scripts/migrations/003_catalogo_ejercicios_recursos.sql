-- Etapa 1: catálogo y recursos. Conserva los registros actuales de máquinas, rutinas y progreso.
-- Ejecutar una vez en el SQL Editor de Supabase antes de desplegar el backend.
BEGIN;

CREATE TABLE public.recursos_gimnasio (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gimnasio_id uuid NOT NULL REFERENCES public.gimnasios(id) ON DELETE RESTRICT,
    nombre text NOT NULL CHECK (length(trim(nombre)) BETWEEN 1 AND 100),
    tipo text NOT NULL CHECK (tipo IN ('maquina', 'equipamiento', 'infraestructura')),
    numero_maquina text CHECK (numero_maquina IS NULL OR length(trim(numero_maquina)) BETWEEN 1 AND 30),
    descripcion text NOT NULL DEFAULT '',
    maquina_origen_id uuid UNIQUE REFERENCES public.maquinas(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (id, gimnasio_id)
);
CREATE UNIQUE INDEX recursos_numero_gimnasio_idx
    ON public.recursos_gimnasio (gimnasio_id, lower(trim(numero_maquina)))
    WHERE numero_maquina IS NOT NULL;
CREATE INDEX recursos_gimnasio_tipo_idx ON public.recursos_gimnasio (gimnasio_id, tipo, nombre);

CREATE TABLE public.ejercicios_catalogo (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    gimnasio_id uuid NOT NULL REFERENCES public.gimnasios(id) ON DELETE RESTRICT,
    nombre text NOT NULL CHECK (length(trim(nombre)) BETWEEN 1 AND 100),
    categoria text NOT NULL CHECK (categoria IN ('maquina', 'libre', 'cardio')),
    grupos_musculares text[] NOT NULL DEFAULT '{}',
    descripcion text NOT NULL DEFAULT '',
    video_url text NOT NULL DEFAULT '',
    imagen_url text NOT NULL DEFAULT '',
    maquina_origen_id uuid UNIQUE REFERENCES public.maquinas(id) ON DELETE RESTRICT,
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (id, gimnasio_id)
);
CREATE INDEX ejercicios_catalogo_filtros_idx ON public.ejercicios_catalogo (gimnasio_id, categoria, nombre);

CREATE TABLE public.ejercicio_recursos (
    ejercicio_id uuid NOT NULL,
    recurso_id uuid NOT NULL,
    gimnasio_id uuid NOT NULL,
    PRIMARY KEY (ejercicio_id, recurso_id),
    FOREIGN KEY (ejercicio_id, gimnasio_id)
        REFERENCES public.ejercicios_catalogo(id, gimnasio_id) ON DELETE CASCADE,
    FOREIGN KEY (recurso_id, gimnasio_id)
        REFERENCES public.recursos_gimnasio(id, gimnasio_id) ON DELETE RESTRICT
);
CREATE INDEX ejercicio_recursos_recurso_idx ON public.ejercicio_recursos (recurso_id);

-- El catálogo anterior mezclaba equipos y ejercicios. Se conservan sus datos y
-- referencias, sin deducir categorías ni inventar números. El administrador puede
-- revisar la clasificación y agregar ejercicios libres, cardio y otros recursos.
INSERT INTO public.recursos_gimnasio (
    id, gimnasio_id, nombre, tipo, descripcion, maquina_origen_id
)
SELECT id, gimnasio_id, nombre, 'maquina', coalesce(descripcion, ''), id
FROM public.maquinas;

INSERT INTO public.ejercicios_catalogo (
    id, gimnasio_id, nombre, categoria, grupos_musculares,
    descripcion, video_url, imagen_url, maquina_origen_id
)
SELECT id, gimnasio_id, nombre, 'maquina', coalesce(grupos_musculares, '{}'::text[]),
       coalesce(descripcion, ''), coalesce(video_url, ''), coalesce(imagen_url, ''), id
FROM public.maquinas;

INSERT INTO public.ejercicio_recursos (ejercicio_id, recurso_id, gimnasio_id)
SELECT id, id, gimnasio_id FROM public.maquinas;

-- Compatibilidad de transición: las altas del flujo anterior (por ejemplo, una
-- solicitud aprobada) también aparecen en el nuevo catálogo, sin sobrescribirlo.
CREATE FUNCTION public.incorporar_maquina_al_catalogo() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $compat$
BEGIN
    INSERT INTO public.recursos_gimnasio (id, gimnasio_id, nombre, tipo, descripcion, maquina_origen_id)
    VALUES (NEW.id, NEW.gimnasio_id, NEW.nombre, 'maquina', coalesce(NEW.descripcion, ''), NEW.id)
    ON CONFLICT (maquina_origen_id) DO NOTHING;
    INSERT INTO public.ejercicios_catalogo (
        id, gimnasio_id, nombre, categoria, grupos_musculares, descripcion, video_url, imagen_url, maquina_origen_id
    ) VALUES (
        NEW.id, NEW.gimnasio_id, NEW.nombre, 'maquina', coalesce(NEW.grupos_musculares, '{}'::text[]),
        coalesce(NEW.descripcion, ''), coalesce(NEW.video_url, ''), coalesce(NEW.imagen_url, ''), NEW.id
    ) ON CONFLICT (maquina_origen_id) DO NOTHING;
    INSERT INTO public.ejercicio_recursos (ejercicio_id, recurso_id, gimnasio_id)
    SELECT e.id, r.id, NEW.gimnasio_id
    FROM public.ejercicios_catalogo e
    JOIN public.recursos_gimnasio r ON r.maquina_origen_id = e.maquina_origen_id
    WHERE e.maquina_origen_id = NEW.id
    ON CONFLICT (ejercicio_id, recurso_id) DO NOTHING;
    RETURN NEW;
END;
$compat$;
CREATE TRIGGER maquina_incorporar_catalogo
    AFTER INSERT ON public.maquinas
    FOR EACH ROW EXECUTE FUNCTION public.incorporar_maquina_al_catalogo();

-- El backend aplica autenticación y permisos utilizando su service_role.
ALTER TABLE public.recursos_gimnasio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicios_catalogo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ejercicio_recursos ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.recursos_gimnasio, public.ejercicios_catalogo,
    public.ejercicio_recursos TO service_role;

-- Impide que un cambio de tipo deje un ejercicio en máquina sin ninguna máquina.
CREATE FUNCTION public.validar_tipo_recurso_catalogo() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $tipo$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.ejercicio_recursos er
        JOIN public.ejercicios_catalogo e ON e.id = er.ejercicio_id AND e.gimnasio_id = er.gimnasio_id
        WHERE er.recurso_id = OLD.id AND e.categoria = 'maquina'
          AND NOT EXISTS (
              SELECT 1 FROM public.ejercicio_recursos otro
              JOIN public.recursos_gimnasio r ON r.id = otro.recurso_id AND r.gimnasio_id = otro.gimnasio_id
              WHERE otro.ejercicio_id = e.id AND r.id <> OLD.id AND r.tipo = 'maquina'
          )
    ) THEN
        RAISE EXCEPTION 'El recurso es la única máquina asociada a un ejercicio.' USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$tipo$;
CREATE TRIGGER recurso_preservar_categoria
    BEFORE UPDATE OF tipo ON public.recursos_gimnasio
    FOR EACH ROW WHEN (OLD.tipo = 'maquina' AND NEW.tipo <> 'maquina')
    EXECUTE FUNCTION public.validar_tipo_recurso_catalogo();

-- Guarda el ejercicio y todas sus asociaciones en una sola transacción.
CREATE FUNCTION public.guardar_ejercicio_catalogo(
    p_gimnasio_id uuid,
    p_ejercicio_id uuid,
    p_datos jsonb,
    p_recurso_ids uuid[]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $func$
DECLARE
    v_id uuid;
    v_recursos integer;
BEGIN
    IF p_recurso_ids IS NULL OR cardinality(p_recurso_ids) NOT BETWEEN 1 AND 30 THEN
        RAISE EXCEPTION 'Asocia entre 1 y 30 recursos.' USING ERRCODE = '22023';
    END IF;

    PERFORM 1 FROM public.recursos_gimnasio
    WHERE gimnasio_id = p_gimnasio_id AND id = ANY(p_recurso_ids)
    FOR SHARE;

    SELECT count(*) INTO v_recursos
    FROM public.recursos_gimnasio
    WHERE gimnasio_id = p_gimnasio_id AND id = ANY(p_recurso_ids);
    IF v_recursos <> cardinality(p_recurso_ids) THEN
        RAISE EXCEPTION 'Los recursos deben pertenecer al gimnasio y no repetirse.' USING ERRCODE = '22023';
    END IF;
    IF p_datos->>'categoria' = 'maquina' AND NOT EXISTS (
        SELECT 1 FROM public.recursos_gimnasio
        WHERE gimnasio_id = p_gimnasio_id AND id = ANY(p_recurso_ids) AND tipo = 'maquina'
    ) THEN
        RAISE EXCEPTION 'El ejercicio requiere una máquina asociada.' USING ERRCODE = '22023';
    END IF;

    IF p_ejercicio_id IS NULL THEN
        INSERT INTO public.ejercicios_catalogo (
            gimnasio_id, nombre, categoria, grupos_musculares, descripcion, video_url, imagen_url
        ) VALUES (
            p_gimnasio_id, p_datos->>'nombre', p_datos->>'categoria',
            ARRAY(SELECT jsonb_array_elements_text(p_datos->'grupos_musculares')),
            p_datos->>'descripcion', p_datos->>'video_url', p_datos->>'imagen_url'
        ) RETURNING id INTO v_id;
    ELSE
        UPDATE public.ejercicios_catalogo SET
            nombre = p_datos->>'nombre', categoria = p_datos->>'categoria',
            grupos_musculares = ARRAY(SELECT jsonb_array_elements_text(p_datos->'grupos_musculares')),
            descripcion = p_datos->>'descripcion', video_url = p_datos->>'video_url',
            imagen_url = p_datos->>'imagen_url'
        WHERE id = p_ejercicio_id AND gimnasio_id = p_gimnasio_id
        RETURNING id INTO v_id;
        IF v_id IS NULL THEN
            RAISE EXCEPTION 'El ejercicio no existe en el gimnasio.' USING ERRCODE = 'P0002';
        END IF;
        DELETE FROM public.ejercicio_recursos WHERE ejercicio_id = v_id AND gimnasio_id = p_gimnasio_id;
    END IF;

    INSERT INTO public.ejercicio_recursos (ejercicio_id, recurso_id, gimnasio_id)
    SELECT v_id, recurso_id, p_gimnasio_id FROM unnest(p_recurso_ids) AS recurso_id;
    RETURN v_id;
END;
$func$;
REVOKE ALL ON FUNCTION public.guardar_ejercicio_catalogo(uuid, uuid, jsonb, uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.guardar_ejercicio_catalogo(uuid, uuid, jsonb, uuid[]) TO service_role;

COMMIT;
