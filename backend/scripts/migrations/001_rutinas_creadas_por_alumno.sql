-- Ejecutar antes de desplegar el backend actualizado.
BEGIN;

ALTER TABLE public.rutinas
    ADD COLUMN IF NOT EXISTS creada_por_alumno boolean NOT NULL DEFAULT false;

ALTER TABLE public.rutinas
    ALTER COLUMN profesor_id DROP NOT NULL,
    ALTER COLUMN profesor_nombre DROP NOT NULL;

-- Las rutinas propias no tienen profesor autor.
ALTER TABLE public.rutinas
    ADD CONSTRAINT rutinas_autoria_alumno_check
    CHECK (NOT creada_por_alumno OR (profesor_id IS NULL AND profesor_nombre IS NULL));

COMMIT;
