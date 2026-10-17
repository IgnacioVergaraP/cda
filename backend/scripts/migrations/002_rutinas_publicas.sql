-- Ejecutar en Supabase antes de desplegar esta versión. Requiere la migración 001.
BEGIN;

ALTER TABLE public.rutinas
    ALTER COLUMN alumno_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS es_publica boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS rutina_origen_id uuid REFERENCES public.rutinas(id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS disciplina text,
    ADD COLUMN IF NOT EXISTS objetivo text,
    ADD COLUMN IF NOT EXISTS nivel text,
    ADD COLUMN IF NOT EXISTS equipamiento text,
    ADD COLUMN IF NOT EXISTS descripcion text;

ALTER TABLE public.rutinas ADD CONSTRAINT rutinas_publicas_destino_check CHECK (
    (es_publica AND alumno_id IS NULL AND profesor_id IS NOT NULL
        AND NOT creada_por_alumno AND rutina_origen_id IS NULL)
    OR (NOT es_publica AND alumno_id IS NOT NULL)
);
ALTER TABLE public.rutinas ADD CONSTRAINT rutinas_copia_autoria_check CHECK (
    rutina_origen_id IS NULL OR (NOT creada_por_alumno AND NOT es_publica AND profesor_id IS NOT NULL)
);
ALTER TABLE public.rutinas ADD CONSTRAINT rutinas_publicas_metadatos_check CHECK (
    NOT es_publica OR (
        disciplina IS NOT NULL AND disciplina IN ('musculacion', 'tenis', 'futbol', 'basquetbol', 'atletismo', 'natacion', 'otro')
        AND nivel IS NOT NULL AND nivel IN ('principiante', 'intermedio', 'avanzado')
        AND objetivo IS NOT NULL AND length(trim(objetivo)) BETWEEN 1 AND 120
        AND equipamiento IS NOT NULL AND length(trim(equipamiento)) BETWEEN 1 AND 250
    )
);
CREATE UNIQUE INDEX IF NOT EXISTS rutinas_copia_alumno_origen_idx
    ON public.rutinas (alumno_id, rutina_origen_id) WHERE rutina_origen_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS rutinas_explorar_idx
    ON public.rutinas (gimnasio_id, disciplina, nivel, fecha_creacion DESC)
    WHERE es_publica AND activa;

COMMIT;
