# CDA backend

API Flask de CDA. Consultar el [README principal](../README.md) para configurar
el Supabase independiente y el despliegue en Vercel con raíz `backend`.

Completar `.env` siguiendo `.env.example`. Desde esta carpeta, instalar
`requirements.txt` y ejecutar `python wsgi.py`. El endpoint de estado es
`/api/health`; las operaciones de datos requieren el esquema Supabase CDA.
