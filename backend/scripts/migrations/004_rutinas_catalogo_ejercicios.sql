-- Etapa 2. Ejecutar una vez, después de 003 y antes de desplegar el código.
-- No elimina máquinas ni cambia el historial de progreso.
BEGIN;

ALTER TABLE public.rutina_ejercicios
    ADD COLUMN ejercicio_catalogo_id uuid
    REFERENCES public.ejercicios_catalogo(id) ON DELETE RESTRICT;

CREATE INDEX rutina_ejercicios_catalogo_idx
    ON public.rutina_ejercicios (ejercicio_catalogo_id);

-- Solo se vinculan correspondencias explícitas del mismo gimnasio.
-- Los ejercicios escritos a mano permanecen intactos.
UPDATE public.rutina_ejercicios re
SET ejercicio_catalogo_id = e.id
FROM public.rutinas r, public.ejercicios_catalogo e
WHERE re.rutina_id = r.id
  AND re.tipo = 'maquina'
  AND e.maquina_origen_id = re.maquina_id
  AND e.gimnasio_id = r.gimnasio_id;

CREATE FUNCTION public.validar_catalogo_rutina() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $func$
BEGIN
    IF NEW.ejercicio_catalogo_id IS NOT NULL AND NOT EXISTS (
        SELECT 1
        FROM public.ejercicios_catalogo e
        JOIN public.rutinas r ON r.gimnasio_id = e.gimnasio_id
        WHERE r.id = NEW.rutina_id AND e.id = NEW.ejercicio_catalogo_id
    ) THEN
        RAISE EXCEPTION 'El ejercicio y la rutina deben pertenecer al mismo gimnasio.'
            USING ERRCODE = '23514';
    END IF;
    RETURN NEW;
END;
$func$;

CREATE TRIGGER rutina_ejercicio_validar_catalogo
    BEFORE INSERT OR UPDATE OF ejercicio_catalogo_id, rutina_id
    ON public.rutina_ejercicios
    FOR EACH ROW EXECUTE FUNCTION public.validar_catalogo_rutina();

COMMIT;
