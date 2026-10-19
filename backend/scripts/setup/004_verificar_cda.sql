-- Solo lectura. Ejecutar en CDA después de los scripts 001 y 002.
SELECT c.relname AS tabla, c.relrowsecurity AS rls_habilitado,
       (SELECT count(*) FROM pg_policy p WHERE p.polrelid = c.oid) AS politicas
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

SELECT id AS gimnasio_id, nombre, slug, activo
FROM public.gimnasios WHERE slug = 'cda';

SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'recursos_gimnasio'
  AND column_name = 'es_cardio';

SELECT tgname, pg_get_triggerdef(oid) AS definicion
FROM pg_trigger
WHERE tgrelid = 'auth.users'::regclass AND NOT tgisinternal;
