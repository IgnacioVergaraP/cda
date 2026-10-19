-- Ejecutar exclusivamente en Supabase CDA, después de los scripts 001 y 002.
-- Cuentas de demostración. Falla sin cambios si alguno de los correos ya existe.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DO $demo$
DECLARE
    v_gimnasio_id uuid;
    v_usuario_id uuid;
    v_usuario record;
BEGIN
    SELECT id INTO STRICT v_gimnasio_id
    FROM public.gimnasios
    WHERE slug = 'cda' AND activo;

    IF EXISTS (
        SELECT 1 FROM auth.users
        WHERE lower(email) IN (
            'admin@cda.com',
            'profesor@cda.com',
            'alumno@cda.com'
        )
    ) THEN
        RAISE EXCEPTION 'Ya existe alguna cuenta de prueba. No se modificó ninguna cuenta.';
    END IF;

    FOR v_usuario IN
        SELECT * FROM (VALUES
            ('admin@cda.com', 'admin123', 'Admin de prueba CDA', 'gimnasio'),
            ('profesor@cda.com', 'profe123', 'Profesor de prueba CDA', 'profesor'),
            ('alumno@cda.com', 'alumno123', 'Alumno de prueba CDA', 'alumno')
        ) AS cuentas(email, clave, nombre, rol)
    LOOP
        v_usuario_id := gen_random_uuid();

        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at, confirmation_token, recovery_token,
            email_change, email_change_token_new, email_change_token_current,
            reauthentication_token, phone_change, phone_change_token,
            email_change_confirm_status, is_sso_user, is_anonymous
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000'::uuid,
            v_usuario_id, 'authenticated', 'authenticated', v_usuario.email,
            extensions.crypt(v_usuario.clave, extensions.gen_salt('bf', 10)),
            now(),
            jsonb_build_object(
                'provider', 'email', 'providers', jsonb_build_array('email'),
                'rol', v_usuario.rol, 'gimnasio_id', v_gimnasio_id::text
            ),
            jsonb_build_object('nombre', v_usuario.nombre, 'email_verified', true),
            now(), now(), '', '', '', '', '', '', '', '', 0, false, false
        );

        INSERT INTO auth.identities (
            id, provider_id, user_id, identity_data, provider,
            created_at, updated_at
        )
        VALUES (
            gen_random_uuid(), v_usuario_id::text, v_usuario_id,
            jsonb_build_object(
                'sub', v_usuario_id::text, 'email', v_usuario.email,
                'email_verified', true, 'phone_verified', false
            ),
            'email', now(), now()
        );

        -- El trigger del esquema CDA debe haber creado el perfil.
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = v_usuario_id AND rol = v_usuario.rol
              AND gimnasio_id = v_gimnasio_id AND activo
        ) THEN
            RAISE EXCEPTION 'El perfil de % no se creó correctamente. Revisar handle_new_user.', v_usuario.email;
        END IF;
    END LOOP;
END;
$demo$;

COMMIT;

SELECT p.email, p.nombre, p.rol, g.slug AS gimnasio, p.activo
FROM public.profiles p
JOIN public.gimnasios g ON g.id = p.gimnasio_id
WHERE g.slug = 'cda' AND p.email IN (
    'admin@cda.com',
    'profesor@cda.com',
    'alumno@cda.com'
)
ORDER BY p.email;
