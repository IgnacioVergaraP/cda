# CDA app

Aplicación del Club Deportivo Alemán (CDA) con backend Flask en `backend/` y frontend Angular en
`frontend/cda-frontend/`. Cada cliente debe usar su propio proyecto Supabase y
sus propios dos proyectos Vercel, con variables independientes.

## Estado

El proyecto Supabase CDA ya fue creado por el propietario. La estructura
original recibida el 19 de octubre de 2026 permitió preparar los scripts de
`backend/scripts/setup/`. Falta ejecutarlos en CDA y configurar las credenciales
y los proyectos Vercel para probar la conexión y el login reales.

La configuración anterior del backend se conservó en `.env.original.local`
(ignorado por Git). No se carga automáticamente. El `.env` activo contiene
valores de ejemplo y debe completarse con el Supabase nuevo.

## 1. Crear Supabase CDA

1. Crear un proyecto en https://supabase.com/dashboard llamado `cda-app`.
   Guardar la contraseña de PostgreSQL en un gestor de contraseñas.
2. Obtener la URL del proyecto y su clave pública (publishable o anon).
   Obtener también la clave `service_role` para el backend; nunca ponerla en
   el frontend. El backend actual utiliza `supabase-py` 2.9.1, por lo que esta
   guía usa la clave legacy `service_role` para ese cliente.
3. En el SQL Editor del Supabase nuevo, ejecutar en este orden:
   - `backend/scripts/setup/001_esquema_cda.sql`: 15 tablas, sus relaciones,
     índices, 9 funciones, 16 triggers y 54 políticas RLS de la exportación.
     Incluye `recursos_gimnasio.es_cardio`, necesario para el código actual.
   - `backend/scripts/setup/002_configurar_cda.sql`: crea el gimnasio CDA
     con un UUID nuevo y slug `cda`.
   - `backend/scripts/setup/004_verificar_cda.sql`: comprueba la estructura.
   El primer script exige un proyecto sin tablas de aplicación ni usuarios;
   si falla, la transacción revierte sus cambios. No ejecutar sobre el original.
4. No copiar usuarios, datos de clientes ni claves del proyecto anterior.
   Supabase crea su propio esquema Auth; los triggers personalizados deben
   revisarse por separado. Recrear buckets y políticas de Storage si la app
   original los utiliza.

Los archivos `backend/scripts/migrations/001...008` son cambios incrementales:
**no ejecutarlos después del esquema de setup**, que ya incorpora esos cambios.
Varias migraciones no son idempotentes. Los seeds tampoco deben ejecutarse
automáticamente: `seed_supabase_users.py` contiene cuentas y contraseñas de
demostración del proyecto original.

Referencia para exportar estructura con Supabase CLI (requiere CLI y Docker):

```sh
supabase db dump --db-url "$CDA_SOURCE_DB_URL" --file /tmp/cda-schema.sql
```

`CDA_SOURCE_DB_URL` debe establecerse localmente con la conexión original.
El dump predeterminado no exporta datos; revisar especialmente los triggers
personalizados en esquemas administrados, que pueden quedar fuera.

Documentación: [Supabase CLI](https://supabase.com/docs/reference/cli/supabase-db-dump),
[migración entre proyectos](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore).

## 2. Backend en Vercel

Importar el repositorio como un proyecto:

| Ajuste | Valor |
| --- | --- |
| Nombre sugerido | `cda-app` |
| Root Directory | `backend` |
| Framework | Flask (detección automática) |
| Build / Output Directory | Usar los valores predeterminados de Flask |
| Entrada | `wsgi.py`, ya exporta `app` |

Configurar variables del proyecto backend:

| Variable | Valor |
| --- | --- |
| `FLASK_ENV` | `production` |
| `SECRET_KEY` | Cadena aleatoria exclusiva de CDA |
| `SUPABASE_URL` | URL del Supabase CDA |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada service_role del Supabase CDA |
| `SUPABASE_ANON_KEY` | Clave pública del Supabase CDA |
| `CORS_ORIGINS` | URL real del frontend, sin barra final; varios orígenes separados por coma |

Para generar `SECRET_KEY`: `python3 -c 'import secrets; print(secrets.token_urlsafe(48))'`.
El backend verifica JWT mediante el JWKS del proyecto Supabase; usar claves de
firma asimétricas de Auth, compatibles con ES256 o RS256.

Desplegar y comprobar `https://DOMINIO-BACKEND/api/health`.
Debe responder con `service: cda-api`. Este endpoint solo verifica que Flask
está activo; no prueba conexión a Supabase ni existencia de tablas.

Vercel ejecuta Flask como una función; no requiere un comando de inicio de
Gunicorn. Referencia: [Flask en Vercel](https://vercel.com/docs/frameworks/backend/flask).

## 3. Frontend en Vercel

Importar el mismo repositorio como otro proyecto:

| Ajuste | Valor |
| --- | --- |
| Nombre sugerido | `cda-frontend` |
| Root Directory | `frontend/cda-frontend` |
| Framework | Angular |
| Build Command | `npm run build` |
| Output Directory | `dist/cda-frontend/browser` |

Configurar las tres variables públicas:

```text
CDA_API_URL=https://DOMINIO-BACKEND/api
CDA_SUPABASE_URL=https://REFERENCIA-CDA.supabase.co
CDA_SUPABASE_ANON_KEY=CLAVE_PUBLICA_CDA
```

`scripts/configure-env.mjs` genera la configuración de Angular antes del build.
En Vercel el build falla si falta alguna variable. Nunca usar `service_role`
ni una clave `sb_secret_` en estas variables: quedan visibles en el navegador.
Después de cambiar variables, hacer un nuevo despliegue.

`vercel.json` permite abrir y recargar las rutas internas de Angular.
Una vez conocido el dominio definitivo, actualizar `CORS_ORIGINS` del backend
y redesplegarlo. Usar las URLs reales asignadas: los nombres sugeridos no
garantizan disponibilidad de dominio.

## 4. Auth y verificación

En Supabase → Authentication → URL Configuration, establecer como Site URL el
frontend real de CDA y autorizar las URLs de retorno utilizadas por la app.
Agregar `http://localhost:4200` si se necesita desarrollo local.

Después de los scripts 001 y 002, crear el usuario administrador en
Authentication → Users con su correo y contraseña propios. El trigger crea
automáticamente su perfil. Luego editar el correo de ejemplo en
`backend/scripts/setup/003_asignar_administrador.sql` y ejecutar ese script:
asigna el rol `gimnasio` y `gimnasio_id` tanto en `app_metadata` como en el
perfil. Cerrar sesión y volver a entrar para renovar el JWT.

El trigger usa exclusivamente `raw_app_meta_data` para roles y el gimnasio CDA
para la pertenencia; no confía en esos datos de `raw_user_meta_data`. Si se crea
un usuario sin rol administrado, su perfil empieza como alumno. Para habilitar
sus rutas por rol deben asignarse también `rol` y `gimnasio_id` en
`app_metadata` mediante SQL o la Admin API; editar el perfil solamente no basta.
Las políticas RLS se conservaron de la exportación. Como la exportación no
incluía permisos ACL, el setup define permisos explícitos de tablas y reserva
la ejecución de las RPC para el backend con `service_role`.

Para poblar un entorno de demostración, ejecutar
`backend/scripts/setup/006_datos_demo_cda.sql`. Crea 4 alumnos, 1 profesor,
1 administrador, 16 ejercicios, 7 rutinas, 20 registros de progreso recientes
y 3 horarios. Reutiliza las cuentas de prueba existentes y conserva sus
contraseñas. Las cuentas nuevas de alumno usan `alumno123`; profesor y
administrador usan `profe123` y `admin123`. Todos son datos ficticios.
Los grupos musculares de los ejercicios se corresponden con las imágenes
incluidas en `frontend/cda-frontend/src/assets/img`; no requieren Storage.

Comprobar login, autorización por rol, lectura y escritura de una rutina y
recarga directa de una ruta interna. Confirmar que los registros aparecen
únicamente en el Supabase CDA. Configurar Preview y Production con variables
explícitas; si las vistas previas necesitan datos de prueba aislados, usar un
proyecto Supabase de pruebas.

## Desarrollo local

Backend: completar `backend/.env` con credenciales CDA y ejecutar desde
`backend/`:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python wsgi.py
```

Frontend, desde `frontend/cda-frontend/`:

```sh
cp .env.example .env.local
# Completar .env.local con URL y clave pública del Supabase CDA.
npm ci
npm start
```

Sin esas variables el frontend compila localmente con valores de ejemplo,
pero no permite autenticarse. Usar `npm run build` y `npm start` para generar
la configuración antes de ejecutar Angular.

Las carpetas nativas Android/iOS conservan los identificadores y recursos
del proyecto original. El despliegue web usa el nombre CDA; publicar una app
móvil independiente requiere configurar también sus identificadores nativos.
