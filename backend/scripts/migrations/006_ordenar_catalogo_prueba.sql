-- Limpieza del gimnasio de prueba del CSV compartido. Requiere 003, 004 y 005.
-- Propuesta de equipos para esos ejemplos; no es un inventario físico verificado.
-- Press de banca y peso muerto rumano se interpretan como variantes con barra.
-- No modifica public.maquinas, rutinas, progreso ni números de equipo.
-- Reutiliza los recursos copiados y conserva sus identificadores y asociaciones extra.
-- Si un recurso por renombrar ya tiene usos registrados, se detiene sin aplicar cambios.
-- La creación y el uso de tablas auxiliares están dentro de una sola sentencia atómica.
DO $ordenar$
DECLARE
    v_gimnasio uuid := 'e4ea530f-1687-4a02-8a3e-724b08d00253';
    v_conflictos text;
BEGIN
    DROP TABLE IF EXISTS pg_temp.catalogo_vinculos_006;
    DROP TABLE IF EXISTS pg_temp.catalogo_orden_006;

    CREATE TEMP TABLE catalogo_orden_006 (
        clave text PRIMARY KEY,
        origen uuid NOT NULL UNIQUE,
        nombre_original text NOT NULL,
        categoria text NOT NULL,
        nombre_recurso text NOT NULL,
        tipo_recurso text NOT NULL,
        descripcion_recurso text NOT NULL
    ) ON COMMIT DROP;

    INSERT INTO pg_temp.catalogo_orden_006 VALUES
        ('banca', 'c3b87537-8da2-4d18-9994-063016c972e2',
         'Press de banca', 'libre', 'Banco plano', 'equipamiento',
         'Banco plano para ejercicios de peso libre.'),
        ('inclinado', '0d1fbc31-8504-445f-982b-a3b2334ad119',
         'Press inclinado con mancuernas', 'libre', 'Banco inclinado', 'equipamiento',
         'Banco inclinado para ejercicios de peso libre.'),
        ('remo', 'fcbe4be9-d1c5-46a5-a584-4af7e4ddfb5d',
         'Remo con barra', 'libre', 'Barra olímpica', 'equipamiento',
         'Barra compartida por los ejercicios con peso libre del catálogo de prueba.'),
        ('jalon', '38f5517c-1d73-4380-8ade-d909401c8348',
         'Jalón al pecho en polea', 'maquina', 'Polea alta', 'maquina',
         'Máquina de polea alta para ejercicios de tracción.'),
        ('sentadilla', 'b3713618-8e99-4596-859a-b3e025743b1c',
         'Sentadilla con barra', 'libre', 'Rack de sentadillas', 'equipamiento',
         'Soporte para colocar la barra en los ejercicios de sentadilla.'),
        ('prensa', '3e53a542-bf2a-4a0c-afe2-052f4c284624',
         'Prensa de piernas 45°', 'maquina', 'Prensa de piernas 45°', 'maquina',
         'Máquina de prensa inclinada para ejercicios de piernas.'),
        ('rumano', 'f25e1828-925f-4f86-a794-58a9ef07d9d5',
         'Peso muerto rumano', 'libre', 'Discos', 'equipamiento',
         'Discos de carga compartidos por los ejercicios con barra del catálogo de prueba.'),
        ('militar', 'f7b5f997-18da-4953-9801-52e8e0a48833',
         'Press militar con barra', 'libre', 'Zona de peso libre', 'infraestructura',
         'Espacio para realizar ejercicios de pie con barras o mancuernas.'),
        ('curl', 'ce6c160a-096c-4ca3-b10c-4712a2e0b8b4',
         'Curl de bíceps con mancuernas', 'libre', 'Mancuernas', 'equipamiento',
         'Conjunto de mancuernas compartido por los ejercicios del catálogo de prueba.'),
        ('plancha', '7626b7ae-6bb6-4aff-959e-a928c00f8cbe',
         'Plancha abdominal', 'libre', 'Zona de suelo', 'infraestructura',
         'Espacio para realizar ejercicios de core y estabilidad en el suelo.');

    CREATE TEMP TABLE catalogo_vinculos_006 (
        ejercicio text NOT NULL REFERENCES pg_temp.catalogo_orden_006(clave),
        recurso text NOT NULL REFERENCES pg_temp.catalogo_orden_006(clave),
        PRIMARY KEY (ejercicio, recurso)
    ) ON COMMIT DROP;

    INSERT INTO pg_temp.catalogo_vinculos_006 VALUES
        ('banca', 'banca'), ('banca', 'remo'), ('banca', 'rumano'),
        ('inclinado', 'inclinado'), ('inclinado', 'curl'),
        ('remo', 'remo'), ('remo', 'rumano'), ('remo', 'militar'),
        ('jalon', 'jalon'),
        ('sentadilla', 'sentadilla'), ('sentadilla', 'remo'), ('sentadilla', 'rumano'),
        ('prensa', 'prensa'),
        ('rumano', 'rumano'), ('rumano', 'remo'), ('rumano', 'militar'),
        ('militar', 'militar'), ('militar', 'remo'), ('militar', 'rumano'),
        ('curl', 'curl'), ('curl', 'militar'),
        ('plancha', 'plancha');


    IF NOT EXISTS (SELECT 1 FROM public.gimnasios WHERE id = v_gimnasio) THEN
        RAISE EXCEPTION 'No existe el gimnasio de prueba del CSV.';
    END IF;

    -- Bloquear los ejercicios antes de comprobar y modificar sus recursos.
    PERFORM 1 FROM public.ejercicios_catalogo e
    JOIN pg_temp.catalogo_orden_006 m ON m.origen = e.maquina_origen_id
    WHERE e.gimnasio_id = v_gimnasio ORDER BY e.id FOR UPDATE OF e;
    PERFORM 1 FROM public.recursos_gimnasio r
    JOIN pg_temp.catalogo_orden_006 m ON m.origen = r.maquina_origen_id
    WHERE r.gimnasio_id = v_gimnasio ORDER BY r.id FOR UPDATE OF r;

    SELECT string_agg(m.nombre_original, ', ' ORDER BY m.clave) INTO v_conflictos
    FROM pg_temp.catalogo_orden_006 m
    WHERE NOT EXISTS (
        SELECT 1 FROM public.maquinas original
        JOIN public.ejercicios_catalogo e ON e.maquina_origen_id = original.id
        JOIN public.recursos_gimnasio r ON r.maquina_origen_id = original.id
        WHERE original.id = m.origen AND original.gimnasio_id = v_gimnasio
          AND e.gimnasio_id = v_gimnasio AND r.gimnasio_id = v_gimnasio
    );
    IF v_conflictos IS NOT NULL THEN
        RAISE EXCEPTION 'Faltan registros originales o sus copias: %. No se aplicaron cambios.', v_conflictos;
    END IF;

    -- No sobrescribir nombres o clasificaciones personalizados sin revisarlos.
    SELECT string_agg(r.nombre, ', ' ORDER BY r.id) INTO v_conflictos
    FROM public.recursos_gimnasio r
    JOIN pg_temp.catalogo_orden_006 m ON m.origen = r.maquina_origen_id
    WHERE r.gimnasio_id = v_gimnasio
      AND (r.nombre NOT IN (m.nombre_original, m.nombre_recurso)
           OR r.tipo NOT IN ('maquina', m.tipo_recurso));
    IF v_conflictos IS NOT NULL THEN
        RAISE EXCEPTION 'Estos recursos ya tienen cambios personalizados: %. Revisa el mapeo antes de continuar.', v_conflictos;
    END IF;

    SELECT string_agg(m.nombre_recurso, ', ' ORDER BY m.clave) INTO v_conflictos
    FROM pg_temp.catalogo_orden_006 m
    WHERE EXISTS (
        SELECT 1 FROM public.recursos_gimnasio r
        WHERE r.gimnasio_id = v_gimnasio
          AND lower(trim(r.nombre)) = lower(trim(m.nombre_recurso))
          AND r.maquina_origen_id IS DISTINCT FROM m.origen
    );
    IF v_conflictos IS NOT NULL THEN
        RAISE EXCEPTION 'Ya existen otros recursos con estos nombres: %. Revisa cuáles se deben reutilizar para no duplicar equipos.', v_conflictos;
    END IF;

    SELECT string_agg(e.nombre, ', ' ORDER BY e.id) INTO v_conflictos
    FROM public.ejercicios_catalogo e
    JOIN pg_temp.catalogo_orden_006 m ON m.origen = e.maquina_origen_id
    WHERE e.gimnasio_id = v_gimnasio AND e.categoria NOT IN ('maquina', m.categoria);
    IF v_conflictos IS NOT NULL THEN
        RAISE EXCEPTION 'Estos ejercicios tienen otra categoría: %. Revisa el mapeo antes de continuar.', v_conflictos;
    END IF;

    -- Un uso previo del recurso copiado no demuestra qué equipo físico se utilizó.
    SELECT string_agg(r.nombre, ', ' ORDER BY r.id) INTO v_conflictos
    FROM public.recursos_gimnasio r
    JOIN pg_temp.catalogo_orden_006 m ON m.origen = r.maquina_origen_id
    WHERE r.gimnasio_id = v_gimnasio
      AND (r.nombre IS DISTINCT FROM m.nombre_recurso OR r.tipo IS DISTINCT FROM m.tipo_recurso)
      AND EXISTS (SELECT 1 FROM public.progreso_recursos p WHERE p.recurso_id = r.id);
    IF v_conflictos IS NOT NULL THEN
        RAISE EXCEPTION 'Estos recursos ya tienen usos registrados: %. No se renombraron ni se reinterpretó el historial.', v_conflictos;
    END IF;

    -- Primero reclasificar los movimientos, para respetar el trigger de la etapa 1.
    UPDATE public.ejercicios_catalogo e SET categoria = m.categoria
    FROM pg_temp.catalogo_orden_006 m
    WHERE e.maquina_origen_id = m.origen AND e.gimnasio_id = v_gimnasio
      AND e.categoria IS DISTINCT FROM m.categoria;

    UPDATE public.recursos_gimnasio r SET
        nombre = m.nombre_recurso,
        tipo = m.tipo_recurso,
        -- Sustituir solo la descripción copiada; conservar notas editadas por el usuario.
        descripcion = CASE WHEN r.descripcion = coalesce(original.descripcion, '')
                           THEN m.descripcion_recurso ELSE r.descripcion END
    FROM pg_temp.catalogo_orden_006 m
    JOIN public.maquinas original ON original.id = m.origen
    WHERE r.maquina_origen_id = m.origen AND r.gimnasio_id = v_gimnasio;

    -- Cada vínculo original sigue siendo válido. Solo se añaden recursos compartidos.
    INSERT INTO public.ejercicio_recursos (ejercicio_id, recurso_id, gimnasio_id)
    SELECT e.id, r.id, v_gimnasio
    FROM pg_temp.catalogo_vinculos_006 v
    JOIN pg_temp.catalogo_orden_006 me ON me.clave = v.ejercicio
    JOIN pg_temp.catalogo_orden_006 mr ON mr.clave = v.recurso
    JOIN public.ejercicios_catalogo e ON e.maquina_origen_id = me.origen AND e.gimnasio_id = v_gimnasio
    JOIN public.recursos_gimnasio r ON r.maquina_origen_id = mr.origen AND r.gimnasio_id = v_gimnasio
    ON CONFLICT (ejercicio_id, recurso_id) DO NOTHING;
END;
$ordenar$;


-- Resultado para revisar en Supabase.
SELECT e.nombre AS ejercicio, e.categoria,
       string_agg(r.nombre, ', ' ORDER BY r.nombre) AS recursos
FROM public.ejercicios_catalogo e
JOIN public.ejercicio_recursos er ON er.ejercicio_id = e.id AND er.gimnasio_id = e.gimnasio_id
JOIN public.recursos_gimnasio r ON r.id = er.recurso_id AND r.gimnasio_id = er.gimnasio_id
WHERE e.gimnasio_id = 'e4ea530f-1687-4a02-8a3e-724b08d00253'
  AND e.maquina_origen_id IN (
    'c3b87537-8da2-4d18-9994-063016c972e2',
    '0d1fbc31-8504-445f-982b-a3b2334ad119',
    'fcbe4be9-d1c5-46a5-a584-4af7e4ddfb5d',
    '38f5517c-1d73-4380-8ade-d909401c8348',
    'b3713618-8e99-4596-859a-b3e025743b1c',
    '3e53a542-bf2a-4a0c-afe2-052f4c284624',
    'f25e1828-925f-4f86-a794-58a9ef07d9d5',
    'f7b5f997-18da-4953-9801-52e8e0a48833',
    'ce6c160a-096c-4ca3-b10c-4712a2e0b8b4',
    '7626b7ae-6bb6-4aff-959e-a928c00f8cbe'
  )
GROUP BY e.id, e.nombre, e.categoria ORDER BY e.nombre;

