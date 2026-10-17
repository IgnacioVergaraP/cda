-- Muestras para el gimnasio del CSV compartido. Requiere la migración 003.
-- Los recursos son de demostración; no representan un inventario verificado.
-- Puede repetirse: conserva los registros de muestra ya existentes y sus ediciones.
BEGIN;

DO $seed$
DECLARE
    v_gimnasio uuid := 'e4ea530f-1687-4a02-8a3e-724b08d00253';
    v_muestra record;
    v_recurso uuid;
    v_ejercicio uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.gimnasios WHERE id = v_gimnasio) THEN
        RAISE EXCEPTION 'No existe el gimnasio indicado para las muestras.';
    END IF;

    FOR v_muestra IN
        SELECT * FROM (VALUES
            ('sentadilla-corporal', 'Sentadilla con peso corporal', 'libre',
             ARRAY['piernas', 'core']::text[], 'Zona funcional', 'infraestructura',
             'Movimiento de flexión y extensión de piernas utilizando el peso corporal.'),
            ('puente-gluteos', 'Puente de glúteos en suelo', 'libre',
             ARRAY['piernas', 'core']::text[], 'Colchoneta', 'equipamiento',
             'Elevación de cadera realizada en el suelo sobre una colchoneta.'),
            ('caminata-trotadora', 'Caminata en trotadora', 'cardio',
             ARRAY['piernas']::text[], 'Trotadora', 'maquina',
             'Actividad cardiovascular de caminata en cinta.'),
            ('pedaleo-bicicleta', 'Pedaleo en bicicleta estática', 'cardio',
             ARRAY['piernas']::text[], 'Bicicleta estática', 'maquina',
             'Actividad cardiovascular de pedaleo en bicicleta fija.')
        ) AS muestras(slug, nombre, categoria, grupos, recurso, tipo_recurso, descripcion)
    LOOP
        -- Identificadores estables para evitar duplicados al repetir el script.
        v_recurso := md5(v_gimnasio::text || ':muestra-recurso:' || v_muestra.slug)::uuid;
        v_ejercicio := md5(v_gimnasio::text || ':muestra-ejercicio:' || v_muestra.slug)::uuid;

        INSERT INTO public.recursos_gimnasio (
            id, gimnasio_id, nombre, tipo, numero_maquina, descripcion
        ) VALUES (
            v_recurso, v_gimnasio, v_muestra.recurso, v_muestra.tipo_recurso,
            NULL, 'Recurso de muestra para explorar el catálogo.'
        ) ON CONFLICT (id) DO NOTHING;

        INSERT INTO public.ejercicios_catalogo (
            id, gimnasio_id, nombre, categoria, grupos_musculares, descripcion
        ) VALUES (
            v_ejercicio, v_gimnasio, v_muestra.nombre, v_muestra.categoria,
            v_muestra.grupos, v_muestra.descripcion
        ) ON CONFLICT (id) DO NOTHING;

        -- Si el administrador ya cambió los recursos, conservar sus asociaciones.
        INSERT INTO public.ejercicio_recursos (ejercicio_id, recurso_id, gimnasio_id)
        SELECT v_ejercicio, v_recurso, v_gimnasio
        WHERE NOT EXISTS (
            SELECT 1 FROM public.ejercicio_recursos WHERE ejercicio_id = v_ejercicio
        )
        ON CONFLICT (ejercicio_id, recurso_id) DO NOTHING;
    END LOOP;
END;
$seed$;

COMMIT;
