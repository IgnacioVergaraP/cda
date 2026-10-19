# CDA frontend

Frontend Angular 17 de CDA. Configuración de Supabase y Vercel en el
[README principal](../../README.md).

Desde esta carpeta:

```sh
cp .env.example .env.local
# Completar las variables públicas exclusivas de CDA.
npm ci
npm start
```

Compilar: `npm run build`. Salida: `dist/cda-frontend/browser`.
Los comandos npm generan la configuración pública antes de ejecutar Angular.
Las variables se definen en `.env.local` o en el proyecto frontend de Vercel.
