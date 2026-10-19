-- Ejecutar SOLO en CDA, después de crear el usuario en Authentication > Users.
-- Cambiar únicamente el correo de ejemplo por el correo real del administrador.
-- No crea una contraseña ni copia cuentas del proyecto anterior.
BEGIN;

DO $admin$
DECLARE
    v_email text := 'CAMBIAR_POR_CORREO_ADMIN';
    v_usuario_id uuid;
    v_gimnasio_id uuid;
BEGIN
    IF v_email = 'CAMBIAR_POR_CORREO_ADMIN' THEN
        RAISE EXCEPTION 'Reemplazar CAMBIAR_POR_CORREO_ADMIN por el correo del usuario creado en Auth.';
    END IF;

    SELECT id INTO STRICT v_gimnasio_id
    FROM public.gimnasios WHERE slug = 'cda' AND activo;

    SELECT id INTO STRICT v_usuario_id
    FROM auth.users WHERE lower(email) = lower(v_email);

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_usuario_id) THEN
        RAISE EXCEPTION 'El usuario no tiene perfil. Revisar el trigger handle_new_user antes de continuar.';
    END IF;

    UPDATE auth.users
    SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb)
        || jsonb_build_object('rol', 'gimnasio', 'gimnasio_id', v_gimnasio_id::text)
    WHERE id = v_usuario_id;

    UPDATE public.profiles
    SET rol = 'gimnasio', gimnasio_id = v_gimnasio_id, activo = true
    WHERE id = v_usuario_id;
END;
$admin$;

COMMIT;

-- Cerrar sesión y volver a entrar para recibir un JWT con los metadatos nuevos.
SELECT p.email, p.rol, g.slug, u.raw_app_meta_data AS app_metadata
FROM public.profiles p
JOIN public.gimnasios g ON g.id = p.gimnasio_id
JOIN auth.users u ON u.id = p.id
WHERE g.slug = 'cda' AND p.rol = 'gimnasio';
