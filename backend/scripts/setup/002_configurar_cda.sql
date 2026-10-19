-- Ejecutar después de 001_esquema_cda.sql, SOLO en el Supabase nuevo de CDA.
-- Crea únicamente la configuración del cliente, sin usuarios de demostración.
BEGIN;

INSERT INTO public.gimnasios (nombre, slug)
VALUES ('CDA', 'cda')
ON CONFLICT (slug) DO NOTHING;

COMMIT;

SELECT id AS gimnasio_id, nombre, slug, activo
FROM public.gimnasios
WHERE slug = 'cda';
