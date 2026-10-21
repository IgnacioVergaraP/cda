-- Club Deportivo Alemán: datos ficticios para probar la aplicación.
-- Ejecutar SOLO en Supabase CDA, después de 001 y 002.
-- Repetible: no duplica registros ni reemplaza contraseñas existentes.
-- Las imágenes musculares las resuelve el frontend desde grupos_musculares.
BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $demo$
DECLARE
    g uuid;
    u uuid;
    prof uuid;
    prof_nombre text;
    e uuid;
    recurso uuid;
    rutina uuid;
    registro uuid;
    fila record;
    alumno record;
    ejercicio public.ejercicios_catalogo%ROWTYPE;
    v_slug text;
    posicion integer;
    dia integer;
BEGIN
    SELECT id INTO STRICT g FROM public.gimnasios WHERE slug = 'cda' AND activo;
    UPDATE public.gimnasios
    SET nombre = 'Club Deportivo Alemán', color_primario = '#FFD200',
        logo_url = '/assets/brand/logotipo-cda.svg'
    WHERE id = g;

    -- 1. Cuentas y perfiles. El trigger crea los perfiles nuevos.
    FOR fila IN SELECT * FROM (VALUES
        ('admin@cda.com', 'admin123', 'Administrador Demo', 'gimnasio'),
        ('profesor@cda.com', 'profe123', 'Profesor Demo', 'profesor'),
        ('alumno@cda.com', 'alumno123', 'Alumno Demo', 'alumno'),
        ('ana@cda.com', 'alumno123', 'Ana Demo', 'alumno'),
        ('diego@cda.com', 'alumno123', 'Diego Demo', 'alumno'),
        ('sofia@cda.com', 'alumno123', 'Sofía Demo', 'alumno')
    ) AS cuentas(email, clave, nombre, rol)
    LOOP
        SELECT id INTO u FROM auth.users WHERE lower(email) = fila.email;
        IF u IS NULL THEN
            u := gen_random_uuid();
            INSERT INTO auth.users (
                instance_id, id, aud, role, email, encrypted_password,
                email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
                created_at, updated_at, confirmation_token, recovery_token,
                email_change, email_change_token_new, email_change_token_current,
                reauthentication_token, phone_change, phone_change_token,
                email_change_confirm_status, is_sso_user, is_anonymous
            ) VALUES (
                '00000000-0000-0000-0000-000000000000'::uuid,
                u, 'authenticated', 'authenticated', fila.email,
                extensions.crypt(fila.clave, extensions.gen_salt('bf', 10)), now(),
                jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email'),
                    'rol', fila.rol, 'gimnasio_id', g::text),
                jsonb_build_object('nombre', fila.nombre, 'email_verified', true),
                now(), now(), '', '', '', '', '', '', '', '', 0, false, false
            );
            INSERT INTO auth.identities (
                id, provider_id, user_id, identity_data, provider, created_at, updated_at
            ) VALUES (
                gen_random_uuid(), u::text, u,
                jsonb_build_object('sub', u::text, 'email', fila.email,
                    'email_verified', true, 'phone_verified', false),
                'email', now(), now()
            );
            IF fila.rol = 'alumno' THEN
                UPDATE public.profiles SET altura = 170, peso_actual = 72,
                    peso_objetivo = 70, notas_profesor = 'Perfil ficticio de demostración.'
                WHERE id = u;
            ELSIF fila.rol = 'profesor' THEN
                UPDATE public.profiles SET bio = 'Profesor de demostración de la aplicación.',
                    especialidades = ARRAY['musculación', 'acondicionamiento'], anios_experiencia = 5
                WHERE id = u;
            END IF;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = u AND gimnasio_id = g AND rol = fila.rol
        ) THEN
            RAISE EXCEPTION 'Revisar el perfil y gimnasio de %. No se cambió su contraseña.', fila.email;
        END IF;
    END LOOP;
    SELECT id, nombre INTO STRICT prof, prof_nombre
    FROM public.profiles WHERE email = 'profesor@cda.com' AND gimnasio_id = g AND activo;

    -- 2. Catálogo. Las máquinas generan recursos y ejercicios mediante el trigger.
    FOR fila IN SELECT * FROM (VALUES
        ('press-pecho', 'Press de pecho', 'maquina', ARRAY['pecho','triceps','hombros'], 'Press de pecho'),
        ('jalon-dorsal', 'Jalón dorsal', 'maquina', ARRAY['espalda','biceps'], 'Polea dorsal'),
        ('prensa', 'Prensa de piernas', 'maquina', ARRAY['cuadriceps','gluteo'], 'Prensa de piernas'),
        ('curl-femoral', 'Curl femoral', 'maquina', ARRAY['isquiotibiales'], 'Curl femoral'),
        ('abductores', 'Abducción de cadera', 'maquina', ARRAY['abductores','gluteo'], 'Máquina de abductores'),
        ('gemelos', 'Elevación de talones', 'maquina', ARRAY['pantorrillas'], 'Máquina de gemelos'),
        ('curl-biceps', 'Curl de bíceps con mancuernas', 'libre', ARRAY['biceps','antebrazos'], 'Mancuernas'),
        ('extension-triceps', 'Extensión de tríceps con mancuerna', 'libre', ARRAY['triceps'], 'Mancuernas'),
        ('press-hombros', 'Press de hombros con mancuernas', 'libre', ARRAY['hombros','triceps'], 'Mancuernas'),
        ('encogimientos', 'Encogimientos con mancuernas', 'libre', ARRAY['trapecio'], 'Mancuernas'),
        ('puente-gluteos', 'Puente de glúteos', 'libre', ARRAY['gluteo','isquiotibiales'], 'Colchoneta'),
        ('plancha', 'Plancha abdominal', 'libre', ARRAY['abdomen'], 'Colchoneta'),
        ('plancha-lateral', 'Plancha lateral', 'libre', ARRAY['oblicuos','abdomen'], 'Colchoneta'),
        ('curl-muneca', 'Curl de muñeca', 'libre', ARRAY['antebrazos'], 'Mancuernas'),
        ('trotadora', 'Caminata en trotadora', 'cardio', ARRAY['cuadriceps','pantorrillas'], 'Trotadora'),
        ('bicicleta', 'Bicicleta estática', 'cardio', ARRAY['cuadriceps','gluteo'], 'Bicicleta estática')
    ) AS catalogo(slug, nombre, categoria, grupos, recurso)
    LOOP
        e := md5(g::text || ':demo:ejercicio:' || fila.slug)::uuid;
        IF fila.categoria = 'maquina' THEN
            INSERT INTO public.maquinas (id, nombre, grupos_musculares, descripcion, gimnasio_id)
            VALUES (e, fila.nombre, fila.grupos, 'Máquina ficticia de demostración.', g)
            ON CONFLICT (id) DO NOTHING;
            recurso := e;
        ELSE
            recurso := md5(g::text || ':demo:recurso:' || fila.recurso)::uuid;
            INSERT INTO public.recursos_gimnasio (id, gimnasio_id, nombre, tipo, descripcion, es_cardio)
            VALUES (recurso, g, fila.recurso,
                CASE WHEN fila.categoria = 'cardio' THEN 'maquina' ELSE 'equipamiento' END,
                'Recurso ficticio de demostración.', fila.categoria = 'cardio')
            ON CONFLICT (id) DO NOTHING;
            INSERT INTO public.ejercicios_catalogo (
                id, gimnasio_id, nombre, categoria, grupos_musculares, descripcion
            ) VALUES (e, g, fila.nombre, fila.categoria, fila.grupos,
                'Ejercicio de ejemplo para probar el catálogo y las rutinas.')
            ON CONFLICT (id) DO NOTHING;
        END IF;
        INSERT INTO public.ejercicio_recursos (ejercicio_id, recurso_id, gimnasio_id)
        SELECT e, recurso, g WHERE NOT EXISTS (
            SELECT 1 FROM public.ejercicio_recursos WHERE ejercicio_id = e
        ) ON CONFLICT (ejercicio_id, recurso_id) DO NOTHING;
    END LOOP;

    -- 3. Cuatro rutinas asignadas y tres públicas para Explorar.
    -- Son datos de interfaz, no prescripciones personales de entrenamiento.
    FOR fila IN SELECT * FROM (VALUES
        ('alumno-base', 'Demo · Cuerpo completo', 'alumno@cda.com', false,
            ARRAY['pecho','espalda','cuadriceps','abdomen'],
            ARRAY['press-pecho','jalon-dorsal','prensa','plancha','trotadora']),
        ('ana-base', 'Demo · Piernas y glúteos', 'ana@cda.com', false,
            ARRAY['cuadriceps','gluteo','isquiotibiales'],
            ARRAY['prensa','curl-femoral','abductores','puente-gluteos','bicicleta']),
        ('diego-base', 'Demo · Tren superior', 'diego@cda.com', false,
            ARRAY['pecho','espalda','hombros','biceps','triceps'],
            ARRAY['press-pecho','jalon-dorsal','press-hombros','curl-biceps','extension-triceps']),
        ('sofia-base', 'Demo · Core y movilidad', 'sofia@cda.com', false,
            ARRAY['abdomen','oblicuos','gluteo'],
            ARRAY['plancha','plancha-lateral','puente-gluteos','trotadora']),
        ('publica-completa', 'Demo · Circuito de cuerpo completo', NULL, true,
            ARRAY['pecho','espalda','cuadriceps','abdomen'],
            ARRAY['press-pecho','jalon-dorsal','prensa','plancha','bicicleta']),
        ('publica-superior', 'Demo · Fuerza de tren superior', NULL, true,
            ARRAY['pecho','espalda','hombros','biceps'],
            ARRAY['press-pecho','jalon-dorsal','press-hombros','curl-biceps','encogimientos']),
        ('publica-piernas', 'Demo · Piernas y core', NULL, true,
            ARRAY['cuadriceps','isquiotibiales','gluteo','abdomen'],
            ARRAY['prensa','curl-femoral','gemelos','puente-gluteos','plancha-lateral'])
    ) AS rutinas_demo(slug, titulo, email, publica, grupos, ejercicios)
    LOOP
        u := NULL;
        IF NOT fila.publica THEN
            SELECT id INTO STRICT u FROM public.profiles WHERE email = fila.email AND gimnasio_id = g;
        END IF;
        rutina := md5(g::text || ':demo:rutina:' || fila.slug)::uuid;
        INSERT INTO public.rutinas (
            id, alumno_id, titulo, grupos_musculares, profesor_id, profesor_nombre,
            gimnasio_id, es_publica, disciplina, objetivo, nivel, equipamiento, descripcion
        ) VALUES (
            rutina, u, fila.titulo, fila.grupos, prof, prof_nombre, g, fila.publica,
            'musculacion', 'Datos ficticios para explorar las funciones de la aplicación.',
            'principiante', 'Máquinas, mancuernas y colchoneta', 'Rutina de demostración.'
        ) ON CONFLICT (id) DO NOTHING;
        -- Conserva los ejercicios si ya se editó esta rutina desde la aplicación.
        IF EXISTS (SELECT 1 FROM public.rutina_ejercicios WHERE rutina_id = rutina) THEN CONTINUE; END IF;
        posicion := 0;
        FOREACH v_slug IN ARRAY fila.ejercicios LOOP
            posicion := posicion + 1;
            SELECT * INTO STRICT ejercicio FROM public.ejercicios_catalogo
            WHERE id = md5(g::text || ':demo:ejercicio:' || v_slug)::uuid AND gimnasio_id = g;
            INSERT INTO public.rutina_ejercicios (
                id, rutina_id, posicion, tipo, maquina_id, nombre_libre, descripcion_libre,
                series, repeticiones, peso_sugerido, ejercicio_catalogo_id, prescripcion_cardio
            ) VALUES (
                md5(rutina::text || ':' || posicion::text)::uuid, rutina, posicion,
                CASE WHEN ejercicio.maquina_origen_id IS NULL THEN 'libre' ELSE 'maquina' END,
                ejercicio.maquina_origen_id,
                CASE WHEN ejercicio.maquina_origen_id IS NULL THEN ejercicio.nombre ELSE NULL END,
                CASE WHEN ejercicio.maquina_origen_id IS NULL THEN ejercicio.descripcion ELSE NULL END,
                CASE WHEN ejercicio.categoria = 'cardio' THEN 1 ELSE 3 END,
                CASE WHEN ejercicio.categoria = 'cardio' THEN ''
                     WHEN v_slug IN ('plancha','plancha-lateral') THEN '20 segundos' ELSE '10' END,
                NULL, ejercicio.id,
                CASE WHEN ejercicio.categoria = 'cardio' THEN '{"duracion_minutos":10}'::jsonb ELSE NULL END
            ) ON CONFLICT (id) DO NOTHING;
        END LOOP;
    END LOOP;

    -- 4. Progreso reciente: una serie ficticia por alumno en cada uno de cinco días.
    FOR alumno IN SELECT id, email FROM public.profiles
        WHERE gimnasio_id = g AND rol = 'alumno'
          AND email IN ('alumno@cda.com','ana@cda.com','diego@cda.com','sofia@cda.com')
    LOOP
        e := md5(g::text || ':demo:ejercicio:press-pecho')::uuid;
        FOR dia IN 1..5 LOOP
            registro := md5(g::text || ':demo:progreso:' || alumno.id::text || ':' || (CURRENT_DATE-dia)::text)::uuid;
            INSERT INTO public.progreso_registros (
                id, alumno_id, fecha, ejercicio_tipo, maquina_id, numero_serie,
                peso, repeticiones, gimnasio_id, ejercicio_catalogo_id, modalidad,
                peso_valor, peso_unidad, peso_kg, repeticiones_valor
            ) VALUES (
                registro, alumno.id, (CURRENT_DATE-dia)::timestamptz + interval '18 hours',
                'maquina', e, 1, (25-dia)::text || ' kg', '10', g, e, 'fuerza',
                25-dia, 'kg', 25-dia, 10
            ) ON CONFLICT (id) DO NOTHING;
            INSERT INTO public.progreso_recursos (registro_id, recurso_id, gimnasio_id)
            VALUES (registro, e, g) ON CONFLICT (registro_id, recurso_id) DO NOTHING;
        END LOOP;
    END LOOP;

    -- 5. Horarios de demostración del profesor (lunes, miércoles y viernes).
    FOR dia IN SELECT unnest(ARRAY[0,2,4]) LOOP
        INSERT INTO public.horarios (id, profesor_id, profesor_nombre, dia_semana, hora_inicio, hora_fin, notas, gimnasio_id)
        VALUES (md5(g::text || ':demo:horario:' || dia::text)::uuid, prof, prof_nombre,
            dia, '09:00', '13:00', 'Horario ficticio de demostración.', g)
        ON CONFLICT (id) DO NOTHING;
    END LOOP;
END;
$demo$;
COMMIT;

SELECT 'Alumnos' AS tipo, count(*) AS cantidad FROM public.profiles
WHERE gimnasio_id = (SELECT id FROM public.gimnasios WHERE slug='cda') AND rol='alumno'
UNION ALL SELECT 'Ejercicios', count(*) FROM public.ejercicios_catalogo
WHERE gimnasio_id = (SELECT id FROM public.gimnasios WHERE slug='cda')
UNION ALL SELECT 'Rutinas', count(*) FROM public.rutinas
WHERE gimnasio_id = (SELECT id FROM public.gimnasios WHERE slug='cda');
