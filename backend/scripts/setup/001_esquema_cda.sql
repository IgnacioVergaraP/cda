-- CDA: esquema inicial reconstruido de la estructura original (2026-10-19).

-- Ejecutar SOLO en el proyecto Supabase NUEVO de CDA, desde SQL Editor.

-- No contiene datos de clientes. No ejecutar las migraciones 001-008 encima.

-- Se aplica en una transacción. Si ya existen estas tablas, falla sin reemplazarlas.

BEGIN;

SET LOCAL search_path = public, extensions, pg_catalog;

DO $guard$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
  ) OR EXISTS (SELECT 1 FROM auth.users) THEN
    RAISE EXCEPTION 'Usar un proyecto CDA nuevo, sin tablas de aplicación ni usuarios.';
  END IF;
END;
$guard$;

CREATE TABLE public."ejercicio_recursos" (
    "ejercicio_id" uuid NOT NULL,
    "recurso_id" uuid NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

CREATE TABLE public."ejercicios_catalogo" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "gimnasio_id" uuid NOT NULL,
    "nombre" text NOT NULL,
    "categoria" text NOT NULL,
    "grupos_musculares" text[] DEFAULT '{}'::text[] NOT NULL,
    "descripcion" text DEFAULT ''::text NOT NULL,
    "video_url" text DEFAULT ''::text NOT NULL,
    "imagen_url" text DEFAULT ''::text NOT NULL,
    "maquina_origen_id" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."gimnasios" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "nombre" text NOT NULL,
    "slug" text NOT NULL,
    "logo_url" text,
    "color_primario" text DEFAULT '#2f6f4e'::text NOT NULL,
    "tabs_habilitadas" text[] DEFAULT ARRAY['maquinas'::text, 'rutinas'::text, 'progreso'::text, 'usuario'::text] NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."horarios" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "profesor_id" uuid NOT NULL,
    "profesor_nombre" text NOT NULL,
    "dia_semana" integer NOT NULL,
    "hora_inicio" text NOT NULL,
    "hora_fin" text NOT NULL,
    "notas" text,
    "fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

CREATE TABLE public."mantenciones" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "maquina_id" uuid NOT NULL,
    "maquina_nombre" text NOT NULL,
    "fecha" timestamp with time zone DEFAULT now() NOT NULL,
    "tipo" text NOT NULL,
    "notas" text,
    "realizado_por_id" uuid,
    "realizado_por_nombre" text,
    "origen" text DEFAULT 'manual'::text NOT NULL,
    "reporte_id" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

CREATE TABLE public."maquinas" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "nombre" text NOT NULL,
    "grupos_musculares" text[] DEFAULT '{}'::text[] NOT NULL,
    "descripcion" text NOT NULL,
    "video_url" text DEFAULT ''::text NOT NULL,
    "imagen_url" text DEFAULT ''::text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

CREATE TABLE public."profiles" (
    "id" uuid NOT NULL,
    "email" text NOT NULL,
    "nombre" text NOT NULL,
    "rol" text NOT NULL,
    "activo" boolean DEFAULT true NOT NULL,
    "altura" numeric,
    "peso_actual" numeric,
    "peso_objetivo" numeric,
    "imagen_url" text,
    "porcentaje_grasa" numeric,
    "fecha_medicion_grasa" date,
    "origen_grasa" text,
    "cargado_por_id" uuid,
    "bio" text,
    "especialidades" text[],
    "anios_experiencia" integer,
    "telefono" text,
    "notas_profesor" text,
    "fecha_alta" timestamp with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

CREATE TABLE public."progreso_recursos" (
    "registro_id" uuid NOT NULL,
    "recurso_id" uuid NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

CREATE TABLE public."progreso_registros" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "alumno_id" uuid NOT NULL,
    "fecha" timestamp with time zone DEFAULT now() NOT NULL,
    "ejercicio_tipo" text NOT NULL,
    "maquina_id" uuid,
    "nombre_libre" text,
    "rutina_id" uuid,
    "numero_serie" integer NOT NULL,
    "peso" text NOT NULL,
    "repeticiones" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL,
    "ejercicio_catalogo_id" uuid,
    "modalidad" text DEFAULT 'fuerza'::text NOT NULL,
    "peso_valor" numeric,
    "peso_unidad" text,
    "peso_kg" numeric,
    "repeticiones_valor" integer,
    "duracion_segundos" integer,
    "distancia_metros" numeric
);

CREATE TABLE public."recursos_gimnasio" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "gimnasio_id" uuid NOT NULL,
    "nombre" text NOT NULL,
    "tipo" text NOT NULL,
    "numero_maquina" text,
    "descripcion" text DEFAULT ''::text NOT NULL,
    "maquina_origen_id" uuid,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."reportes" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "estado" text DEFAULT 'abierto'::text NOT NULL,
    "tipo" text NOT NULL,
    "prioridad" text DEFAULT 'media'::text NOT NULL,
    "descripcion" text NOT NULL,
    "reportante_id" uuid NOT NULL,
    "reportante_nombre" text NOT NULL,
    "maquina_id" uuid,
    "maquina_nombre" text,
    "foto_url" text,
    "resolucion" text,
    "revisado_por_id" uuid,
    "revisado_por_nombre" text,
    "fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
    "fecha_revision" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

CREATE TABLE public."rutina_ejercicios" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "rutina_id" uuid NOT NULL,
    "posicion" integer NOT NULL,
    "tipo" text NOT NULL,
    "maquina_id" uuid,
    "nombre_libre" text,
    "descripcion_libre" text,
    "series" integer NOT NULL,
    "repeticiones" text NOT NULL,
    "peso_sugerido" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "ejercicio_catalogo_id" uuid,
    "prescripcion_cardio" jsonb
);

CREATE TABLE public."rutinas" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "alumno_id" uuid,
    "titulo" text NOT NULL,
    "grupos_musculares" text[] DEFAULT '{}'::text[] NOT NULL,
    "profesor_id" uuid,
    "profesor_nombre" text,
    "activa" boolean DEFAULT true NOT NULL,
    "fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
    "fecha_modificacion" timestamp with time zone,
    "gimnasio_id" uuid NOT NULL,
    "creada_por_alumno" boolean DEFAULT false NOT NULL,
    "es_publica" boolean DEFAULT false NOT NULL,
    "rutina_origen_id" uuid,
    "disciplina" text,
    "objetivo" text,
    "nivel" text,
    "equipamiento" text,
    "descripcion" text
);

CREATE TABLE public."solicitudes_ejercicio" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "estado" text DEFAULT 'pendiente'::text NOT NULL,
    "solicitante_id" uuid NOT NULL,
    "solicitante_nombre" text NOT NULL,
    "tipo_solicitud" text DEFAULT 'crear'::text NOT NULL,
    "nombre" text NOT NULL,
    "grupos_musculares" text[] DEFAULT '{}'::text[] NOT NULL,
    "descripcion" text NOT NULL,
    "video_url" text DEFAULT ''::text NOT NULL,
    "imagen_url" text DEFAULT ''::text NOT NULL,
    "maquina_id_objetivo" uuid,
    "maquina_id_creado" uuid,
    "revisado_por_id" uuid,
    "revisado_por_nombre" text,
    "motivo_rechazo" text,
    "fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
    "fecha_revision" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL,
    "categoria" text,
    "recurso_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
    "ejercicio_catalogo_id_creado" uuid
);

CREATE TABLE public."solicitudes_rutina" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "estado" text DEFAULT 'pendiente'::text NOT NULL,
    "alumno_id" uuid NOT NULL,
    "alumno_nombre" text NOT NULL,
    "objetivo" text NOT NULL,
    "dias_por_semana" integer NOT NULL,
    "comentarios" text,
    "grupos_interes" text[],
    "profesor_preferido_id" uuid,
    "profesor_preferido_nombre" text,
    "profesor_id" uuid,
    "profesor_nombre" text,
    "rutina_id" uuid,
    "mensaje_resolucion" text,
    "motivo_rechazo" text,
    "estado_liberacion" text,
    "fecha_liberacion_solicitada" timestamp with time zone,
    "liberacion_revisada_por_id" uuid,
    "liberacion_revisada_por_nombre" text,
    "liberacion_motivo_rechazo" text,
    "fecha_creacion" timestamp with time zone DEFAULT now() NOT NULL,
    "fecha_tomada" timestamp with time zone,
    "fecha_revision" timestamp with time zone,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    "gimnasio_id" uuid NOT NULL
);

ALTER TABLE public."ejercicio_recursos" ADD CONSTRAINT "ejercicio_recursos_pkey" PRIMARY KEY (ejercicio_id, recurso_id);

ALTER TABLE public."ejercicios_catalogo" ADD CONSTRAINT "ejercicios_catalogo_categoria_check" CHECK (categoria = ANY (ARRAY['maquina'::text, 'libre'::text, 'cardio'::text]));

ALTER TABLE public."ejercicios_catalogo" ADD CONSTRAINT "ejercicios_catalogo_id_gimnasio_id_key" UNIQUE (id, gimnasio_id);

ALTER TABLE public."ejercicios_catalogo" ADD CONSTRAINT "ejercicios_catalogo_maquina_origen_id_key" UNIQUE (maquina_origen_id);

ALTER TABLE public."ejercicios_catalogo" ADD CONSTRAINT "ejercicios_catalogo_nombre_check" CHECK (length(TRIM(BOTH FROM nombre)) >= 1 AND length(TRIM(BOTH FROM nombre)) <= 100);

ALTER TABLE public."ejercicios_catalogo" ADD CONSTRAINT "ejercicios_catalogo_pkey" PRIMARY KEY (id);

ALTER TABLE public."gimnasios" ADD CONSTRAINT "chk_gimnasios_color" CHECK (color_primario ~ '^#[0-9a-fA-F]{6}$'::text);

ALTER TABLE public."gimnasios" ADD CONSTRAINT "chk_gimnasios_slug" CHECK (slug ~ '^[a-z0-9-]+$'::text);

ALTER TABLE public."gimnasios" ADD CONSTRAINT "gimnasios_pkey" PRIMARY KEY (id);

ALTER TABLE public."gimnasios" ADD CONSTRAINT "gimnasios_slug_key" UNIQUE (slug);

ALTER TABLE public."horarios" ADD CONSTRAINT "chk_horarios_formato_fin" CHECK (hora_fin ~ '^([01]\d|2[0-3]):[0-5]\d$'::text);

ALTER TABLE public."horarios" ADD CONSTRAINT "chk_horarios_formato_inicio" CHECK (hora_inicio ~ '^([01]\d|2[0-3]):[0-5]\d$'::text);

ALTER TABLE public."horarios" ADD CONSTRAINT "chk_horarios_orden" CHECK (hora_inicio < hora_fin);

ALTER TABLE public."horarios" ADD CONSTRAINT "horarios_dia_semana_check" CHECK (dia_semana >= 0 AND dia_semana <= 6);

ALTER TABLE public."horarios" ADD CONSTRAINT "horarios_pkey" PRIMARY KEY (id);

ALTER TABLE public."mantenciones" ADD CONSTRAINT "mantenciones_origen_check" CHECK (origen = ANY (ARRAY['manual'::text, 'auto'::text]));

ALTER TABLE public."mantenciones" ADD CONSTRAINT "mantenciones_pkey" PRIMARY KEY (id);

ALTER TABLE public."mantenciones" ADD CONSTRAINT "mantenciones_tipo_check" CHECK (tipo = ANY (ARRAY['preventivo'::text, 'correctivo'::text, 'limpieza'::text, 'revision'::text]));

ALTER TABLE public."maquinas" ADD CONSTRAINT "maquinas_pkey" PRIMARY KEY (id);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_origen_grasa_check" CHECK (origen_grasa = ANY (ARRAY['profesor'::text, 'alumno'::text]));

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_rol_check" CHECK (rol = ANY (ARRAY['gimnasio'::text, 'profesor'::text, 'alumno'::text]));

ALTER TABLE public."progreso_recursos" ADD CONSTRAINT "progreso_recursos_pkey" PRIMARY KEY (registro_id, recurso_id);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "chk_progreso_tipo" CHECK (ejercicio_tipo = 'maquina'::text AND maquina_id IS NOT NULL AND nombre_libre IS NULL OR ejercicio_tipo = 'libre'::text AND nombre_libre IS NOT NULL);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_id_gimnasio_unique" UNIQUE (id, gimnasio_id);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_metricas_modalidad_check" CHECK (modalidad = 'fuerza'::text AND duracion_segundos IS NULL AND distancia_metros IS NULL OR modalidad = 'cardio'::text AND peso_valor IS NULL AND peso_unidad IS NULL AND peso_kg IS NULL AND repeticiones_valor IS NULL AND (duracion_segundos IS NOT NULL OR distancia_metros IS NOT NULL));

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_distancia_metros_check" CHECK (distancia_metros >= 0.01 AND distancia_metros <= 1000000::numeric);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_duracion_segundos_check" CHECK (duracion_segundos >= 1 AND duracion_segundos <= 604800);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_ejercicio_tipo_check" CHECK (ejercicio_tipo = ANY (ARRAY['maquina'::text, 'libre'::text]));

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_modalidad_check" CHECK (modalidad = ANY (ARRAY['fuerza'::text, 'cardio'::text]));

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_numero_serie_check" CHECK (numero_serie >= 1);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_peso_kg_check" CHECK (peso_kg >= 0::numeric AND peso_kg <= 10000::numeric);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_peso_unidad_check" CHECK (peso_unidad = ANY (ARRAY['kg'::text, 'lb'::text, 'otro'::text]));

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_peso_valor_check" CHECK (peso_valor >= 0::numeric AND peso_valor <= 10000::numeric);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_pkey" PRIMARY KEY (id);

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_repeticiones_valor_check" CHECK (repeticiones_valor >= 1 AND repeticiones_valor <= 10000);

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_id_gimnasio_id_key" UNIQUE (id, gimnasio_id);

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_maquina_origen_id_key" UNIQUE (maquina_origen_id);

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_nombre_check" CHECK (length(TRIM(BOTH FROM nombre)) >= 1 AND length(TRIM(BOTH FROM nombre)) <= 100);

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_numero_maquina_check" CHECK (numero_maquina IS NULL OR length(TRIM(BOTH FROM numero_maquina)) >= 1 AND length(TRIM(BOTH FROM numero_maquina)) <= 30);

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_pkey" PRIMARY KEY (id);

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_tipo_check" CHECK (tipo = ANY (ARRAY['maquina'::text, 'equipamiento'::text, 'infraestructura'::text]));

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_estado_check" CHECK (estado = ANY (ARRAY['abierto'::text, 'en_revision'::text, 'resuelto'::text, 'cancelado'::text]));

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_pkey" PRIMARY KEY (id);

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_prioridad_check" CHECK (prioridad = ANY (ARRAY['baja'::text, 'media'::text, 'alta'::text, 'urgente'::text]));

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_tipo_check" CHECK (tipo = ANY (ARRAY['rota'::text, 'desgastada'::text, 'falta_accesorio'::text, 'limpieza'::text, 'otro'::text]));

ALTER TABLE public."rutina_ejercicios" ADD CONSTRAINT "chk_ejercicio_tipo" CHECK (tipo = 'maquina'::text AND maquina_id IS NOT NULL AND nombre_libre IS NULL OR tipo = 'libre'::text AND nombre_libre IS NOT NULL);

ALTER TABLE public."rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_pkey" PRIMARY KEY (id);

ALTER TABLE public."rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_series_check" CHECK (series >= 1);

ALTER TABLE public."rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_tipo_check" CHECK (tipo = ANY (ARRAY['maquina'::text, 'libre'::text]));

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_autoria_alumno_check" CHECK (NOT creada_por_alumno OR profesor_id IS NULL AND profesor_nombre IS NULL);

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_copia_autoria_check" CHECK (rutina_origen_id IS NULL OR NOT creada_por_alumno AND NOT es_publica AND profesor_id IS NOT NULL);

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_pkey" PRIMARY KEY (id);

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_publicas_destino_check" CHECK (es_publica AND alumno_id IS NULL AND profesor_id IS NOT NULL AND NOT creada_por_alumno AND rutina_origen_id IS NULL OR NOT es_publica AND alumno_id IS NOT NULL);

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_publicas_metadatos_check" CHECK (NOT es_publica OR disciplina IS NOT NULL AND (disciplina = ANY (ARRAY['musculacion'::text, 'tenis'::text, 'futbol'::text, 'basquetbol'::text, 'atletismo'::text, 'natacion'::text, 'otro'::text])) AND nivel IS NOT NULL AND (nivel = ANY (ARRAY['principiante'::text, 'intermedio'::text, 'avanzado'::text])) AND objetivo IS NOT NULL AND length(TRIM(BOTH FROM objetivo)) >= 1 AND length(TRIM(BOTH FROM objetivo)) <= 120 AND equipamiento IS NOT NULL AND length(TRIM(BOTH FROM equipamiento)) >= 1 AND length(TRIM(BOTH FROM equipamiento)) <= 250);

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_categoria_check" CHECK (categoria = ANY (ARRAY['maquina'::text, 'libre'::text, 'cardio'::text]));

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_estado_check" CHECK (estado = ANY (ARRAY['pendiente'::text, 'aprobada'::text, 'rechazada'::text, 'cancelada'::text]));

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_pkey" PRIMARY KEY (id);

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_tipo_solicitud_check" CHECK (tipo_solicitud = 'crear'::text);

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_dias_por_semana_check" CHECK (dias_por_semana >= 1 AND dias_por_semana <= 7);

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_estado_check" CHECK (estado = ANY (ARRAY['pendiente'::text, 'en_proceso'::text, 'resuelta'::text, 'rechazada'::text, 'cancelada'::text]));

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_estado_liberacion_check" CHECK ((estado_liberacion = ANY (ARRAY['solicitada'::text, 'aprobada'::text, 'rechazada'::text])) OR estado_liberacion IS NULL);

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_objetivo_check" CHECK (objetivo = ANY (ARRAY['hipertrofia'::text, 'fuerza'::text, 'resistencia'::text, 'perder_grasa'::text, 'mantenimiento'::text, 'otro'::text]));

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_pkey" PRIMARY KEY (id);

ALTER TABLE public."ejercicio_recursos" ADD CONSTRAINT "ejercicio_recursos_ejercicio_id_gimnasio_id_fkey" FOREIGN KEY (ejercicio_id, gimnasio_id) REFERENCES ejercicios_catalogo(id, gimnasio_id) ON DELETE CASCADE;

ALTER TABLE public."ejercicio_recursos" ADD CONSTRAINT "ejercicio_recursos_recurso_id_gimnasio_id_fkey" FOREIGN KEY (recurso_id, gimnasio_id) REFERENCES recursos_gimnasio(id, gimnasio_id) ON DELETE RESTRICT;

ALTER TABLE public."ejercicios_catalogo" ADD CONSTRAINT "ejercicios_catalogo_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."ejercicios_catalogo" ADD CONSTRAINT "ejercicios_catalogo_maquina_origen_id_fkey" FOREIGN KEY (maquina_origen_id) REFERENCES maquinas(id) ON DELETE RESTRICT;

ALTER TABLE public."horarios" ADD CONSTRAINT "horarios_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."horarios" ADD CONSTRAINT "horarios_profesor_id_fkey" FOREIGN KEY (profesor_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."mantenciones" ADD CONSTRAINT "mantenciones_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."mantenciones" ADD CONSTRAINT "mantenciones_maquina_id_fkey" FOREIGN KEY (maquina_id) REFERENCES maquinas(id) ON DELETE CASCADE;

ALTER TABLE public."mantenciones" ADD CONSTRAINT "mantenciones_realizado_por_id_fkey" FOREIGN KEY (realizado_por_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."mantenciones" ADD CONSTRAINT "mantenciones_reporte_id_fkey" FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE SET NULL;

ALTER TABLE public."maquinas" ADD CONSTRAINT "maquinas_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_cargado_por_id_fkey" FOREIGN KEY (cargado_por_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."progreso_recursos" ADD CONSTRAINT "progreso_recursos_recurso_id_gimnasio_id_fkey" FOREIGN KEY (recurso_id, gimnasio_id) REFERENCES recursos_gimnasio(id, gimnasio_id) ON DELETE RESTRICT;

ALTER TABLE public."progreso_recursos" ADD CONSTRAINT "progreso_recursos_registro_id_gimnasio_id_fkey" FOREIGN KEY (registro_id, gimnasio_id) REFERENCES progreso_registros(id, gimnasio_id) ON DELETE CASCADE;

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_alumno_id_fkey" FOREIGN KEY (alumno_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_ejercicio_catalogo_id_fkey" FOREIGN KEY (ejercicio_catalogo_id) REFERENCES ejercicios_catalogo(id) ON DELETE RESTRICT;

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_maquina_id_fkey" FOREIGN KEY (maquina_id) REFERENCES maquinas(id) ON DELETE SET NULL;

ALTER TABLE public."progreso_registros" ADD CONSTRAINT "progreso_registros_rutina_id_fkey" FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE SET NULL;

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."recursos_gimnasio" ADD CONSTRAINT "recursos_gimnasio_maquina_origen_id_fkey" FOREIGN KEY (maquina_origen_id) REFERENCES maquinas(id) ON DELETE RESTRICT;

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_maquina_id_fkey" FOREIGN KEY (maquina_id) REFERENCES maquinas(id) ON DELETE SET NULL;

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_reportante_id_fkey" FOREIGN KEY (reportante_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."reportes" ADD CONSTRAINT "reportes_revisado_por_id_fkey" FOREIGN KEY (revisado_por_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_ejercicio_catalogo_id_fkey" FOREIGN KEY (ejercicio_catalogo_id) REFERENCES ejercicios_catalogo(id) ON DELETE RESTRICT;

ALTER TABLE public."rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_maquina_id_fkey" FOREIGN KEY (maquina_id) REFERENCES maquinas(id) ON DELETE SET NULL;

ALTER TABLE public."rutina_ejercicios" ADD CONSTRAINT "rutina_ejercicios_rutina_id_fkey" FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE CASCADE;

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_alumno_id_fkey" FOREIGN KEY (alumno_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_profesor_id_fkey" FOREIGN KEY (profesor_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."rutinas" ADD CONSTRAINT "rutinas_rutina_origen_id_fkey" FOREIGN KEY (rutina_origen_id) REFERENCES rutinas(id) ON DELETE RESTRICT;

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_ejercicio_catalogo_id_creado_fkey" FOREIGN KEY (ejercicio_catalogo_id_creado) REFERENCES ejercicios_catalogo(id) ON DELETE RESTRICT;

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_maquina_id_creado_fkey" FOREIGN KEY (maquina_id_creado) REFERENCES maquinas(id) ON DELETE SET NULL;

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_maquina_id_objetivo_fkey" FOREIGN KEY (maquina_id_objetivo) REFERENCES maquinas(id) ON DELETE SET NULL;

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_revisado_por_id_fkey" FOREIGN KEY (revisado_por_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."solicitudes_ejercicio" ADD CONSTRAINT "solicitudes_ejercicio_solicitante_id_fkey" FOREIGN KEY (solicitante_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_alumno_id_fkey" FOREIGN KEY (alumno_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_gimnasio_id_fkey" FOREIGN KEY (gimnasio_id) REFERENCES gimnasios(id) ON DELETE RESTRICT;

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_liberacion_revisada_por_id_fkey" FOREIGN KEY (liberacion_revisada_por_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_profesor_id_fkey" FOREIGN KEY (profesor_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_profesor_preferido_id_fkey" FOREIGN KEY (profesor_preferido_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."solicitudes_rutina" ADD CONSTRAINT "solicitudes_rutina_rutina_id_fkey" FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE SET NULL;

CREATE INDEX ejercicio_recursos_recurso_idx ON public.ejercicio_recursos USING btree (recurso_id);

CREATE INDEX ejercicios_catalogo_filtros_idx ON public.ejercicios_catalogo USING btree (gimnasio_id, categoria, nombre);

CREATE INDEX idx_gimnasios_activo ON public.gimnasios USING btree (activo);

CREATE INDEX idx_gimnasios_slug ON public.gimnasios USING btree (slug);

CREATE INDEX idx_horarios_gimnasio ON public.horarios USING btree (gimnasio_id);

CREATE INDEX idx_horarios_profesor ON public.horarios USING btree (profesor_id);

CREATE INDEX idx_horarios_profesor_dia ON public.horarios USING btree (profesor_id, dia_semana);

CREATE INDEX idx_mantenciones_fecha ON public.mantenciones USING btree (fecha DESC);

CREATE INDEX idx_mantenciones_gimnasio ON public.mantenciones USING btree (gimnasio_id);

CREATE INDEX idx_mantenciones_maquina ON public.mantenciones USING btree (maquina_id);

CREATE INDEX idx_mantenciones_maquina_fecha ON public.mantenciones USING btree (maquina_id, fecha DESC);

CREATE INDEX idx_mantenciones_reporte ON public.mantenciones USING btree (reporte_id);

CREATE INDEX idx_maquinas_gimnasio ON public.maquinas USING btree (gimnasio_id);

CREATE INDEX idx_maquinas_grupos ON public.maquinas USING gin (grupos_musculares);

CREATE INDEX idx_maquinas_nombre ON public.maquinas USING btree (nombre);

CREATE INDEX idx_profiles_email ON public.profiles USING btree (email);

CREATE INDEX idx_profiles_gimnasio ON public.profiles USING btree (gimnasio_id);

CREATE INDEX idx_profiles_rol ON public.profiles USING btree (rol);

CREATE INDEX progreso_recursos_recurso_idx ON public.progreso_recursos USING btree (recurso_id);

CREATE INDEX idx_progreso_alumno ON public.progreso_registros USING btree (alumno_id);

CREATE INDEX idx_progreso_alumno_fecha ON public.progreso_registros USING btree (alumno_id, fecha DESC);

CREATE INDEX idx_progreso_gimnasio ON public.progreso_registros USING btree (gimnasio_id);

CREATE INDEX idx_progreso_maquina ON public.progreso_registros USING btree (maquina_id);

CREATE INDEX idx_progreso_rutina ON public.progreso_registros USING btree (rutina_id);

CREATE INDEX progreso_catalogo_alumno_fecha_idx ON public.progreso_registros USING btree (alumno_id, ejercicio_catalogo_id, fecha);

CREATE INDEX recursos_gimnasio_tipo_idx ON public.recursos_gimnasio USING btree (gimnasio_id, tipo, nombre);

CREATE UNIQUE INDEX recursos_numero_gimnasio_idx ON public.recursos_gimnasio USING btree (gimnasio_id, lower(TRIM(BOTH FROM numero_maquina))) WHERE (numero_maquina IS NOT NULL);

CREATE INDEX idx_reportes_abiertos ON public.reportes USING btree (fecha_creacion DESC) WHERE (estado = ANY (ARRAY['abierto'::text, 'en_revision'::text]));

CREATE INDEX idx_reportes_estado ON public.reportes USING btree (estado);

CREATE INDEX idx_reportes_fecha ON public.reportes USING btree (fecha_creacion DESC);

CREATE INDEX idx_reportes_gimnasio ON public.reportes USING btree (gimnasio_id);

CREATE INDEX idx_reportes_maquina ON public.reportes USING btree (maquina_id);

CREATE INDEX idx_reportes_reportante ON public.reportes USING btree (reportante_id);

CREATE INDEX idx_rutina_ejercicios_maquina ON public.rutina_ejercicios USING btree (maquina_id);

CREATE INDEX idx_rutina_ejercicios_rutina ON public.rutina_ejercicios USING btree (rutina_id, posicion);

CREATE INDEX rutina_ejercicios_catalogo_idx ON public.rutina_ejercicios USING btree (ejercicio_catalogo_id);

CREATE INDEX idx_rutinas_activa ON public.rutinas USING btree (activa);

CREATE INDEX idx_rutinas_alumno ON public.rutinas USING btree (alumno_id);

CREATE INDEX idx_rutinas_gimnasio ON public.rutinas USING btree (gimnasio_id);

CREATE INDEX idx_rutinas_profesor ON public.rutinas USING btree (profesor_id);

CREATE UNIQUE INDEX rutinas_copia_alumno_origen_idx ON public.rutinas USING btree (alumno_id, rutina_origen_id) WHERE (rutina_origen_id IS NOT NULL);

CREATE INDEX rutinas_explorar_idx ON public.rutinas USING btree (gimnasio_id, disciplina, nivel, fecha_creacion DESC) WHERE (es_publica AND activa);

CREATE INDEX idx_solicitudes_estado ON public.solicitudes_ejercicio USING btree (estado);

CREATE INDEX idx_solicitudes_fecha ON public.solicitudes_ejercicio USING btree (fecha_creacion DESC);

CREATE INDEX idx_solicitudes_gimnasio ON public.solicitudes_ejercicio USING btree (gimnasio_id);

CREATE INDEX idx_solicitudes_pendientes ON public.solicitudes_ejercicio USING btree (fecha_creacion DESC) WHERE (estado = 'pendiente'::text);

CREATE INDEX idx_solicitudes_solicitante ON public.solicitudes_ejercicio USING btree (solicitante_id);

CREATE INDEX idx_solicitudes_rutina_alumno ON public.solicitudes_rutina USING btree (alumno_id);

CREATE INDEX idx_solicitudes_rutina_estado ON public.solicitudes_rutina USING btree (estado);

CREATE INDEX idx_solicitudes_rutina_fecha ON public.solicitudes_rutina USING btree (fecha_creacion DESC);

CREATE INDEX idx_solicitudes_rutina_gimnasio ON public.solicitudes_rutina USING btree (gimnasio_id);

CREATE INDEX idx_solicitudes_rutina_liberaciones ON public.solicitudes_rutina USING btree (fecha_liberacion_solicitada DESC) WHERE (estado_liberacion = 'solicitada'::text);

CREATE INDEX idx_solicitudes_rutina_pendientes ON public.solicitudes_rutina USING btree (fecha_creacion DESC) WHERE (estado = 'pendiente'::text);

CREATE INDEX idx_solicitudes_rutina_preferido ON public.solicitudes_rutina USING btree (profesor_preferido_id);

CREATE INDEX idx_solicitudes_rutina_profesor ON public.solicitudes_rutina USING btree (profesor_id);

-- Equivalente estructural de 008_maquinas_cardio.sql (no hay registros que migrar).

ALTER TABLE public.recursos_gimnasio ADD COLUMN es_cardio boolean NOT NULL DEFAULT false;

ALTER TABLE public.recursos_gimnasio ADD CONSTRAINT recursos_cardio_tipo_check CHECK (NOT es_cardio OR tipo = 'maquina');

CREATE OR REPLACE FUNCTION public.aprobar_solicitud_catalogo(p_solicitud_id uuid, p_gimnasio_id uuid, p_admin_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_solicitud public.solicitudes_ejercicio%ROWTYPE;
  v_admin_nombre text;
  v_ejercicio_id uuid;
BEGIN
  SELECT nombre
  INTO v_admin_nombre
  FROM public.profiles
  WHERE id = p_admin_id
    AND gimnasio_id = p_gimnasio_id
    AND rol = 'gimnasio'
    AND activo;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Administrador inválido'
      USING ERRCODE = '22023';
  END IF;

  SELECT *
  INTO v_solicitud
  FROM public.solicitudes_ejercicio
  WHERE id = p_solicitud_id
    AND gimnasio_id = p_gimnasio_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud inexistente'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_solicitud.estado <> 'pendiente'
     OR v_solicitud.tipo_solicitud <> 'crear'
     OR v_solicitud.categoria IS NULL THEN
    RAISE EXCEPTION 'Solicitud no pendiente o sin categoría'
      USING ERRCODE = '40001';
  END IF;

  v_ejercicio_id := public.guardar_ejercicio_catalogo(
    p_gimnasio_id,
    NULL,
    jsonb_build_object(
      'nombre', v_solicitud.nombre,
      'categoria', v_solicitud.categoria,
      'grupos_musculares', to_jsonb(v_solicitud.grupos_musculares),
      'descripcion', v_solicitud.descripcion,
      'video_url', v_solicitud.video_url,
      'imagen_url', v_solicitud.imagen_url
    ),
    v_solicitud.recurso_ids
  );

  UPDATE public.solicitudes_ejercicio
  SET estado = 'aprobada',
      ejercicio_catalogo_id_creado = v_ejercicio_id,
      revisado_por_id = p_admin_id,
      revisado_por_nombre = v_admin_nombre,
      fecha_revision = now()
  WHERE id = p_solicitud_id
  RETURNING * INTO v_solicitud;

  RETURN to_jsonb(v_solicitud);
END;
$function$;

CREATE OR REPLACE FUNCTION public.guardar_ejercicio_catalogo(p_gimnasio_id uuid, p_ejercicio_id uuid, p_datos jsonb, p_recurso_ids uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_id uuid;
    v_recursos integer;
BEGIN
    IF p_recurso_ids IS NULL
       OR cardinality(p_recurso_ids) NOT BETWEEN 1 AND 30 THEN
        RAISE EXCEPTION
            'Asocia entre 1 y 30 recursos.'
            USING ERRCODE = '22023';
    END IF;

    PERFORM 1
    FROM public.recursos_gimnasio
    WHERE gimnasio_id = p_gimnasio_id
      AND id = ANY(p_recurso_ids)
    FOR SHARE;

    SELECT count(*)
    INTO v_recursos
    FROM public.recursos_gimnasio
    WHERE gimnasio_id = p_gimnasio_id
      AND id = ANY(p_recurso_ids);

    IF v_recursos <> cardinality(p_recurso_ids) THEN
        RAISE EXCEPTION
            'Los recursos deben pertenecer al gimnasio y no repetirse.'
            USING ERRCODE = '22023';
    END IF;

    IF p_datos->>'categoria' = 'maquina'
       AND NOT EXISTS (
           SELECT 1
           FROM public.recursos_gimnasio
           WHERE gimnasio_id = p_gimnasio_id
             AND id = ANY(p_recurso_ids)
             AND tipo = 'maquina'
       ) THEN
        RAISE EXCEPTION
            'El ejercicio requiere una máquina asociada.'
            USING ERRCODE = '22023';
    END IF;

    IF p_ejercicio_id IS NULL THEN
        INSERT INTO public.ejercicios_catalogo (
            gimnasio_id,
            nombre,
            categoria,
            grupos_musculares,
            descripcion,
            video_url,
            imagen_url
        )
        VALUES (
            p_gimnasio_id,
            p_datos->>'nombre',
            p_datos->>'categoria',
            ARRAY(
                SELECT jsonb_array_elements_text(
                    p_datos->'grupos_musculares'
                )
            ),
            p_datos->>'descripcion',
            p_datos->>'video_url',
            p_datos->>'imagen_url'
        )
        RETURNING id INTO v_id;
    ELSE
        UPDATE public.ejercicios_catalogo
        SET
            nombre = p_datos->>'nombre',
            categoria = p_datos->>'categoria',
            grupos_musculares = ARRAY(
                SELECT jsonb_array_elements_text(
                    p_datos->'grupos_musculares'
                )
            ),
            descripcion = p_datos->>'descripcion',
            video_url = p_datos->>'video_url',
            imagen_url = p_datos->>'imagen_url'
        WHERE id = p_ejercicio_id
          AND gimnasio_id = p_gimnasio_id
        RETURNING id INTO v_id;

        IF v_id IS NULL THEN
            RAISE EXCEPTION
                'El ejercicio no existe en el gimnasio.'
                USING ERRCODE = 'P0002';
        END IF;

        DELETE FROM public.ejercicio_recursos
        WHERE ejercicio_id = v_id
          AND gimnasio_id = p_gimnasio_id;
    END IF;

    INSERT INTO public.ejercicio_recursos (
        ejercicio_id,
        recurso_id,
        gimnasio_id
    )
    SELECT v_id, recurso_id, p_gimnasio_id
    FROM unnest(p_recurso_ids) AS recurso_id;

    RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    v_gimnasio_id uuid;
    v_rol text;
BEGIN
    SELECT id INTO v_gimnasio_id FROM public.gimnasios
    WHERE slug = 'cda' AND activo;
    IF v_gimnasio_id IS NULL THEN
        RAISE EXCEPTION 'Falta configurar el gimnasio CDA: ejecutar 002_configurar_cda.sql.';
    END IF;

    -- raw_user_meta_data es editable por el usuario: solo datos de presentación.
    -- Los roles se asignan mediante app_metadata desde SQL o la Admin API.
    v_rol := coalesce(nullif(NEW.raw_app_meta_data ->> 'rol', ''), 'alumno');
    IF v_rol NOT IN ('alumno', 'profesor', 'gimnasio') THEN
        RAISE EXCEPTION 'Rol no válido para CDA.';
    END IF;
    IF nullif(NEW.raw_app_meta_data ->> 'gimnasio_id', '') IS NOT NULL
       AND (NEW.raw_app_meta_data ->> 'gimnasio_id') <> v_gimnasio_id::text THEN
        RAISE EXCEPTION 'El usuario no pertenece a CDA.';
    END IF;

    INSERT INTO public.profiles (id, email, nombre, rol, imagen_url, gimnasio_id)
    VALUES (
        NEW.id, NEW.email,
        coalesce(nullif(NEW.raw_user_meta_data ->> 'nombre', ''), split_part(NEW.email, '@', 1)),
        v_rol, NEW.raw_user_meta_data ->> 'imagen_url', v_gimnasio_id
    );
    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
begin
  -- Solo actualizar si la tabla tiene la columna updated_at
  if (to_jsonb(new) ? 'updated_at') then
    new.updated_at := now();
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.incorporar_maquina_al_catalogo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    INSERT INTO public.recursos_gimnasio (
        id,
        gimnasio_id,
        nombre,
        tipo,
        descripcion,
        maquina_origen_id
    )
    VALUES (
        NEW.id,
        NEW.gimnasio_id,
        NEW.nombre,
        'maquina',
        coalesce(NEW.descripcion, ''),
        NEW.id
    )
    ON CONFLICT (maquina_origen_id) DO NOTHING;

    INSERT INTO public.ejercicios_catalogo (
        id,
        gimnasio_id,
        nombre,
        categoria,
        grupos_musculares,
        descripcion,
        video_url,
        imagen_url,
        maquina_origen_id
    )
    VALUES (
        NEW.id,
        NEW.gimnasio_id,
        NEW.nombre,
        'maquina',
        coalesce(NEW.grupos_musculares, '{}'::text[]),
        coalesce(NEW.descripcion, ''),
        coalesce(NEW.video_url, ''),
        coalesce(NEW.imagen_url, ''),
        NEW.id
    )
    ON CONFLICT (maquina_origen_id) DO NOTHING;

    INSERT INTO public.ejercicio_recursos (
        ejercicio_id,
        recurso_id,
        gimnasio_id
    )
    SELECT e.id, r.id, NEW.gimnasio_id
    FROM public.ejercicios_catalogo e
    JOIN public.recursos_gimnasio r
        ON r.maquina_origen_id = e.maquina_origen_id
    WHERE e.maquina_origen_id = NEW.id
    ON CONFLICT (ejercicio_id, recurso_id) DO NOTHING;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.registrar_entrenamiento_catalogo(p_registro jsonb, p_recurso_ids uuid[])
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
    v_registro public.progreso_registros%ROWTYPE;
    v_ejercicio public.ejercicios_catalogo%ROWTYPE;
    v_id uuid;
    v_cantidad integer;
    v_numero integer;
    v_inicio timestamptz;
BEGIN
    v_registro := jsonb_populate_record(
        NULL::public.progreso_registros,
        p_registro
    );

    SELECT *
    INTO v_ejercicio
    FROM public.ejercicios_catalogo
    WHERE id = v_registro.ejercicio_catalogo_id
      AND gimnasio_id = v_registro.gimnasio_id
    FOR SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'El ejercicio no está disponible.'
            USING ERRCODE = '22023';
    END IF;

    IF v_registro.modalidad IS DISTINCT FROM (
        CASE
            WHEN v_ejercicio.categoria = 'cardio' THEN 'cardio'
            ELSE 'fuerza'
        END
    ) THEN
        RAISE EXCEPTION
            'Las métricas no corresponden al ejercicio.'
            USING ERRCODE = '22023';
    END IF;

    IF p_recurso_ids IS NULL
       OR cardinality(p_recurso_ids) NOT BETWEEN 1 AND 30 THEN
        RAISE EXCEPTION
            'Selecciona los recursos utilizados.'
            USING ERRCODE = '22023';
    END IF;

    PERFORM 1
    FROM public.recursos_gimnasio
    WHERE id = ANY(p_recurso_ids)
      AND gimnasio_id = v_registro.gimnasio_id
    FOR SHARE;

    SELECT count(*)
    INTO v_cantidad
    FROM public.ejercicio_recursos er
    WHERE er.ejercicio_id = v_ejercicio.id
      AND er.gimnasio_id = v_registro.gimnasio_id
      AND er.recurso_id = ANY(p_recurso_ids);

    IF v_cantidad <> cardinality(p_recurso_ids) THEN
        RAISE EXCEPTION
            'Los recursos deben estar asociados al ejercicio y no repetirse.'
            USING ERRCODE = '22023';
    END IF;

    IF v_ejercicio.categoria = 'maquina' AND NOT EXISTS (
        SELECT 1
        FROM public.recursos_gimnasio r
        WHERE r.id = ANY(p_recurso_ids)
          AND r.gimnasio_id = v_registro.gimnasio_id
          AND r.tipo = 'maquina'
    ) THEN
        RAISE EXCEPTION
            'Selecciona la máquina utilizada.'
            USING ERRCODE = '22023';
    END IF;

    IF v_registro.rutina_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM public.rutina_ejercicios re
        WHERE re.rutina_id = v_registro.rutina_id
          AND re.ejercicio_catalogo_id = v_ejercicio.id
    ) THEN
        RAISE EXCEPTION
            'El ejercicio no pertenece a la rutina.'
            USING ERRCODE = '22023';
    END IF;

    v_registro.fecha := coalesce(v_registro.fecha, now());

    v_inicio := date_trunc(
        'day',
        v_registro.fecha AT TIME ZONE 'UTC'
    ) AT TIME ZONE 'UTC';

    -- Evitar que dos registros simultáneos reciban el mismo número.

    PERFORM pg_advisory_xact_lock(
        hashtextextended(
            v_registro.alumno_id::text
            || ':' || v_ejercicio.id::text
            || ':' || (v_registro.fecha AT TIME ZONE 'UTC')::date::text,
            0
        )
    );

    SELECT coalesce(max(numero_serie), 0) + 1
    INTO v_numero
    FROM public.progreso_registros
    WHERE alumno_id = v_registro.alumno_id
      AND ejercicio_catalogo_id = v_ejercicio.id
      AND fecha >= v_inicio
      AND fecha < v_inicio + interval '1 day';

    INSERT INTO public.progreso_registros (
        alumno_id,
        gimnasio_id,
        fecha,
        ejercicio_catalogo_id,
        modalidad,
        ejercicio_tipo,
        maquina_id,
        nombre_libre,
        rutina_id,
        numero_serie,
        peso,
        repeticiones,
        peso_valor,
        peso_unidad,
        peso_kg,
        repeticiones_valor,
        duracion_segundos,
        distancia_metros
    )
    VALUES (
        v_registro.alumno_id,
        v_registro.gimnasio_id,
        v_registro.fecha,
        v_ejercicio.id,
        v_registro.modalidad,
        CASE
            WHEN v_ejercicio.maquina_origen_id IS NULL THEN 'libre'
            ELSE 'maquina'
        END,
        v_ejercicio.maquina_origen_id,
        CASE
            WHEN v_ejercicio.maquina_origen_id IS NULL
                THEN v_ejercicio.nombre
            ELSE NULL
        END,
        v_registro.rutina_id,
        v_numero,
        v_registro.peso,
        v_registro.repeticiones,
        v_registro.peso_valor,
        v_registro.peso_unidad,
        v_registro.peso_kg,
        v_registro.repeticiones_valor,
        v_registro.duracion_segundos,
        v_registro.distancia_metros
    )
    RETURNING id INTO v_id;

    INSERT INTO public.progreso_recursos (
        registro_id,
        recurso_id,
        gimnasio_id
    )
    SELECT v_id, id, v_registro.gimnasio_id
    FROM unnest(p_recurso_ids) AS id;

    RETURN v_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_catalogo_rutina()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF NEW.ejercicio_catalogo_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM public.ejercicios_catalogo e
        JOIN public.rutinas r
            ON r.gimnasio_id = e.gimnasio_id
        WHERE r.id = NEW.rutina_id
          AND e.id = NEW.ejercicio_catalogo_id
    ) THEN
        RAISE EXCEPTION
            'El ejercicio y la rutina deben pertenecer al mismo gimnasio.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_entrenamiento_gimnasio()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = NEW.alumno_id
          AND p.gimnasio_id = NEW.gimnasio_id
    ) THEN
        RAISE EXCEPTION
            'El usuario y el registro deben pertenecer al mismo gimnasio.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.ejercicio_catalogo_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM public.ejercicios_catalogo e
        WHERE e.id = NEW.ejercicio_catalogo_id
          AND e.gimnasio_id = NEW.gimnasio_id
    ) THEN
        RAISE EXCEPTION
            'El ejercicio no pertenece al gimnasio.'
            USING ERRCODE = '23514';
    END IF;

    IF NEW.rutina_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM public.rutinas r
        WHERE r.id = NEW.rutina_id
          AND r.gimnasio_id = NEW.gimnasio_id
          AND r.alumno_id = NEW.alumno_id
          AND NOT r.es_publica
    ) THEN
        RAISE EXCEPTION
            'La rutina no pertenece al usuario.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validar_tipo_recurso_catalogo()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.ejercicio_recursos er
        JOIN public.ejercicios_catalogo e
            ON e.id = er.ejercicio_id
           AND e.gimnasio_id = er.gimnasio_id
        WHERE er.recurso_id = OLD.id
          AND e.categoria = 'maquina'
          AND NOT EXISTS (
              SELECT 1
              FROM public.ejercicio_recursos otro
              JOIN public.recursos_gimnasio r
                  ON r.id = otro.recurso_id
                 AND r.gimnasio_id = otro.gimnasio_id
              WHERE otro.ejercicio_id = e.id
                AND r.id <> OLD.id
                AND r.tipo = 'maquina'
          )
    ) THEN
        RAISE EXCEPTION
            'El recurso es la única máquina asociada a un ejercicio.'
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER on_gimnasios_updated BEFORE UPDATE ON gimnasios FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_horarios_updated BEFORE UPDATE ON horarios FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_mantenciones_updated BEFORE UPDATE ON mantenciones FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER maquina_incorporar_catalogo AFTER INSERT ON maquinas FOR EACH ROW EXECUTE FUNCTION incorporar_maquina_al_catalogo();

CREATE TRIGGER on_maquinas_updated BEFORE UPDATE ON maquinas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_profiles_updated BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_progreso_updated BEFORE UPDATE ON progreso_registros FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER progreso_validar_gimnasio BEFORE INSERT OR UPDATE OF alumno_id, gimnasio_id, ejercicio_catalogo_id, rutina_id ON progreso_registros FOR EACH ROW EXECUTE FUNCTION validar_entrenamiento_gimnasio();

CREATE TRIGGER recurso_preservar_categoria BEFORE UPDATE OF tipo ON recursos_gimnasio FOR EACH ROW WHEN (old.tipo = 'maquina'::text AND new.tipo <> 'maquina'::text) EXECUTE FUNCTION validar_tipo_recurso_catalogo();

CREATE TRIGGER on_reportes_updated BEFORE UPDATE ON reportes FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_rutina_ejercicios_updated BEFORE UPDATE ON rutina_ejercicios FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER rutina_ejercicio_validar_catalogo BEFORE INSERT OR UPDATE OF ejercicio_catalogo_id, rutina_id ON rutina_ejercicios FOR EACH ROW EXECUTE FUNCTION validar_catalogo_rutina();

CREATE TRIGGER on_rutinas_updated BEFORE UPDATE ON rutinas FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_solicitudes_ejercicio_updated BEFORE UPDATE ON solicitudes_ejercicio FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER on_solicitudes_rutina_updated BEFORE UPDATE ON solicitudes_rutina FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE public."ejercicio_recursos" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."ejercicio_recursos" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."ejercicio_recursos" TO authenticated;

GRANT ALL ON TABLE public."ejercicio_recursos" TO service_role;

ALTER TABLE public."ejercicios_catalogo" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."ejercicios_catalogo" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."ejercicios_catalogo" TO authenticated;

GRANT ALL ON TABLE public."ejercicios_catalogo" TO service_role;

ALTER TABLE public."gimnasios" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gimnasio se actualiza a sí mismo" ON public."gimnasios" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((((id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text))) WITH CHECK ((((id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text)));

CREATE POLICY "Usuarios ven su propio gimnasio" ON public."gimnasios" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))));

REVOKE ALL ON TABLE public."gimnasios" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."gimnasios" TO authenticated;

GRANT ALL ON TABLE public."gimnasios" TO service_role;

ALTER TABLE public."horarios" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gimnasio crea horarios en su gimnasio" ON public."horarios" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio edita horarios de su gimnasio" ON public."horarios" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio elimina horarios de su gimnasio" ON public."horarios" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio ve horarios de su gimnasio" ON public."horarios" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor ve sus horarios" ON public."horarios" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((profesor_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

REVOKE ALL ON TABLE public."horarios" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."horarios" TO authenticated;

GRANT ALL ON TABLE public."horarios" TO service_role;

ALTER TABLE public."mantenciones" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gimnasio crea mantenciones en su gimnasio" ON public."mantenciones" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio edita mantenciones de su gimnasio" ON public."mantenciones" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio elimina mantenciones de su gimnasio" ON public."mantenciones" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio ve mantenciones de su gimnasio" ON public."mantenciones" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor ve mantenciones de su gimnasio" ON public."mantenciones" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'profesor'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

REVOKE ALL ON TABLE public."mantenciones" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."mantenciones" TO authenticated;

GRANT ALL ON TABLE public."mantenciones" TO service_role;

ALTER TABLE public."maquinas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gimnasio elimina maquinas de su gimnasio" ON public."maquinas" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor y gimnasio crean maquinas en su gimnasio" ON public."maquinas" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor y gimnasio editan maquinas de su gimnasio" ON public."maquinas" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Usuarios leen maquinas de su gimnasio" ON public."maquinas" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))));

REVOKE ALL ON TABLE public."maquinas" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."maquinas" TO authenticated;

GRANT ALL ON TABLE public."maquinas" TO service_role;

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin elimina perfiles de su gimnasio" ON public."profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Admin inserta perfiles en su gimnasio" ON public."profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesores y admin actualizan perfiles de alumnos de su gimnasi" ON public."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesores y admin ven perfiles de su gimnasio" ON public."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Usuarios actualizan su propio perfil" ON public."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Usuarios ven su propio perfil" ON public."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((( SELECT auth.uid() AS uid) = id));

REVOKE ALL ON TABLE public."profiles" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."profiles" TO authenticated;

GRANT ALL ON TABLE public."profiles" TO service_role;

ALTER TABLE public."progreso_recursos" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."progreso_recursos" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."progreso_recursos" TO authenticated;

GRANT ALL ON TABLE public."progreso_recursos" TO service_role;

ALTER TABLE public."progreso_registros" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumno actualiza sus registros de progreso" ON public."progreso_registros" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Alumno crea sus registros de progreso" ON public."progreso_registros" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Alumno ve sus registros de progreso" ON public."progreso_registros" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor y gimnasio actualizan registros de su gimnasio" ON public."progreso_registros" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor y gimnasio ven registros de su gimnasio" ON public."progreso_registros" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

REVOKE ALL ON TABLE public."progreso_registros" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."progreso_registros" TO authenticated;

GRANT ALL ON TABLE public."progreso_registros" TO service_role;

ALTER TABLE public."recursos_gimnasio" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public."recursos_gimnasio" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."recursos_gimnasio" TO authenticated;

GRANT ALL ON TABLE public."recursos_gimnasio" TO service_role;

ALTER TABLE public."reportes" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gimnasio gestiona reportes de su gimnasio" ON public."reportes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio ve reportes de su gimnasio" ON public."reportes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Reportante cancela sus reportes abiertos" ON public."reportes" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((reportante_id = ( SELECT auth.uid() AS uid)) AND (estado = 'abierto'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((reportante_id = ( SELECT auth.uid() AS uid)) AND (estado = 'cancelado'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Reportante crea reportes en su gimnasio" ON public."reportes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND (reportante_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Reportante ve sus reportes" ON public."reportes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((reportante_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

REVOKE ALL ON TABLE public."reportes" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."reportes" TO authenticated;

GRANT ALL ON TABLE public."reportes" TO service_role;

ALTER TABLE public."rutina_ejercicios" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumno ve ejercicios de sus rutinas" ON public."rutina_ejercicios" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM rutinas r
  WHERE ((r.id = rutina_ejercicios.rutina_id) AND (r.alumno_id = ( SELECT auth.uid() AS uid)) AND ((r.gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))))));

CREATE POLICY "Profesor y gimnasio editan ejercicios" ON public."rutina_ejercicios" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM rutinas r
  WHERE ((r.id = rutina_ejercicios.rutina_id) AND ((r.gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM rutinas r
  WHERE ((r.id = rutina_ejercicios.rutina_id) AND ((r.gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text]))))));

CREATE POLICY "Profesor y gimnasio eliminan ejercicios" ON public."rutina_ejercicios" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM rutinas r
  WHERE ((r.id = rutina_ejercicios.rutina_id) AND ((r.gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text]))))));

CREATE POLICY "Profesor y gimnasio insertan ejercicios" ON public."rutina_ejercicios" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM rutinas r
  WHERE ((r.id = rutina_ejercicios.rutina_id) AND ((r.gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text]))))));

CREATE POLICY "Profesor y gimnasio ven ejercicios de su gimnasio" ON public."rutina_ejercicios" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM rutinas r
  WHERE ((r.id = rutina_ejercicios.rutina_id) AND ((r.gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text]))))));

REVOKE ALL ON TABLE public."rutina_ejercicios" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rutina_ejercicios" TO authenticated;

GRANT ALL ON TABLE public."rutina_ejercicios" TO service_role;

ALTER TABLE public."rutinas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumno ve sus rutinas" ON public."rutinas" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor y gimnasio crean rutinas en su gimnasio" ON public."rutinas" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor y gimnasio editan rutinas de su gimnasio" ON public."rutinas" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor y gimnasio ven rutinas de su gimnasio" ON public."rutinas" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

REVOKE ALL ON TABLE public."rutinas" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."rutinas" TO authenticated;

GRANT ALL ON TABLE public."rutinas" TO service_role;

ALTER TABLE public."solicitudes_ejercicio" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Gimnasio gestiona solicitudes de su gimnasio" ON public."solicitudes_ejercicio" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio ve solicitudes de su gimnasio" ON public."solicitudes_ejercicio" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor cancela sus solicitudes pendientes" ON public."solicitudes_ejercicio" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((solicitante_id = ( SELECT auth.uid() AS uid)) AND (estado = 'pendiente'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((solicitante_id = ( SELECT auth.uid() AS uid)) AND (estado = 'cancelada'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor crea solicitudes en su gimnasio" ON public."solicitudes_ejercicio" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = ANY (ARRAY['profesor'::text, 'gimnasio'::text])) AND (solicitante_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor ve sus solicitudes" ON public."solicitudes_ejercicio" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((solicitante_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

REVOKE ALL ON TABLE public."solicitudes_ejercicio" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."solicitudes_ejercicio" TO authenticated;

GRANT ALL ON TABLE public."solicitudes_ejercicio" TO service_role;

ALTER TABLE public."solicitudes_rutina" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alumno cancela sus solicitudes" ON public."solicitudes_rutina" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((alumno_id = ( SELECT auth.uid() AS uid)) AND (estado = ANY (ARRAY['pendiente'::text, 'en_proceso'::text])) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Alumno crea solicitudes de rutina" ON public."solicitudes_rutina" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'alumno'::text) AND (alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Alumno ve sus solicitudes de rutina" ON public."solicitudes_rutina" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((alumno_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio gestiona solicitudes de rutina de su gimnasio" ON public."solicitudes_rutina" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Gimnasio ve solicitudes de su gimnasio" ON public."solicitudes_rutina" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'gimnasio'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor gestiona solicitudes de su gimnasio" ON public."solicitudes_rutina" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'profesor'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text))) AND (((estado = 'pendiente'::text) AND (profesor_id IS NULL) AND ((profesor_preferido_id IS NULL) OR (profesor_preferido_id = ( SELECT auth.uid() AS uid)))) OR (profesor_id = ( SELECT auth.uid() AS uid))))) WITH CHECK (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'profesor'::text) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor ve solicitudes disponibles de su gimnasio" ON public."solicitudes_rutina" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'profesor'::text) AND (estado = 'pendiente'::text) AND ((profesor_preferido_id IS NULL) OR (profesor_preferido_id = ( SELECT auth.uid() AS uid))) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

CREATE POLICY "Profesor ve sus solicitudes tomadas" ON public."solicitudes_rutina" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'rol'::text)) = 'profesor'::text) AND (profesor_id = ( SELECT auth.uid() AS uid)) AND ((gimnasio_id)::text = ( SELECT ((auth.jwt() -> 'app_metadata'::text) ->> 'gimnasio_id'::text)))));

REVOKE ALL ON TABLE public."solicitudes_rutina" FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public."solicitudes_rutina" TO authenticated;

GRANT ALL ON TABLE public."solicitudes_rutina" TO service_role;

-- Las RPC de negocio se invocan desde Flask con service_role.

REVOKE ALL ON FUNCTION public.aprobar_solicitud_catalogo(p_solicitud_id uuid, p_gimnasio_id uuid, p_admin_id uuid) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.aprobar_solicitud_catalogo(p_solicitud_id uuid, p_gimnasio_id uuid, p_admin_id uuid) TO service_role;

REVOKE ALL ON FUNCTION public.guardar_ejercicio_catalogo(p_gimnasio_id uuid, p_ejercicio_id uuid, p_datos jsonb, p_recurso_ids uuid[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.guardar_ejercicio_catalogo(p_gimnasio_id uuid, p_ejercicio_id uuid, p_datos jsonb, p_recurso_ids uuid[]) TO service_role;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

REVOKE ALL ON FUNCTION public.handle_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.handle_updated_at() TO service_role;

REVOKE ALL ON FUNCTION public.incorporar_maquina_al_catalogo() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.incorporar_maquina_al_catalogo() TO service_role;

REVOKE ALL ON FUNCTION public.registrar_entrenamiento_catalogo(p_registro jsonb, p_recurso_ids uuid[]) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.registrar_entrenamiento_catalogo(p_registro jsonb, p_recurso_ids uuid[]) TO service_role;

REVOKE ALL ON FUNCTION public.validar_catalogo_rutina() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.validar_catalogo_rutina() TO service_role;

REVOKE ALL ON FUNCTION public.validar_entrenamiento_gimnasio() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.validar_entrenamiento_gimnasio() TO service_role;

REVOKE ALL ON FUNCTION public.validar_tipo_recurso_catalogo() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.validar_tipo_recurso_catalogo() TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;

SELECT 'Esquema CDA creado. Ejecutar ahora 002_configurar_cda.sql.' AS resultado;
