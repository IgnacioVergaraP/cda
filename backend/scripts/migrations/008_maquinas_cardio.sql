-- Clasificación explícita de máquinas de cardio. Ejecutar antes de desplegar el código.
BEGIN;
ALTER TABLE public.recursos_gimnasio
  ADD COLUMN IF NOT EXISTS es_cardio boolean NOT NULL DEFAULT false;
UPDATE public.recursos_gimnasio r
SET es_cardio = true
WHERE r.tipo = 'maquina' AND NOT r.es_cardio AND EXISTS (
  SELECT 1 FROM public.ejercicio_recursos er
  JOIN public.ejercicios_catalogo e ON e.id = er.ejercicio_id AND e.gimnasio_id = er.gimnasio_id
  WHERE er.recurso_id = r.id AND er.gimnasio_id = r.gimnasio_id AND e.categoria = 'cardio'
);
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid = 'public.recursos_gimnasio'::regclass AND conname = 'recursos_cardio_tipo_check') THEN
    ALTER TABLE public.recursos_gimnasio ADD CONSTRAINT recursos_cardio_tipo_check
      CHECK (NOT es_cardio OR tipo = 'maquina');
  END IF;
END;
$$;
COMMIT;
