-- Ejecutar después de 003, 004 y 005, antes de desplegar el backend actualizado.
-- Agrega indicaciones opcionales de cardio y datos de categoría/recursos a las propuestas.
-- La aprobación crea el ejercicio y sus asociaciones en la misma transacción.
-- Las solicitudes antiguas conservan su categoría NULL y su flujo de aprobación anterior.
BEGIN;
ALTER TABLE public.rutina_ejercicios ADD COLUMN IF NOT EXISTS prescripcion_cardio jsonb;
ALTER TABLE public.solicitudes_ejercicio
  ADD COLUMN IF NOT EXISTS categoria text CHECK (categoria IN ('maquina','libre','cardio')),
  ADD COLUMN IF NOT EXISTS recurso_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ejercicio_catalogo_id_creado uuid REFERENCES public.ejercicios_catalogo(id) ON DELETE RESTRICT;

CREATE OR REPLACE FUNCTION public.aprobar_solicitud_catalogo(
    p_solicitud_id uuid, p_gimnasio_id uuid, p_admin_id uuid
) RETURNS jsonb
LANGUAGE plpgsql SET search_path = public
AS $$
DECLARE
    v_solicitud public.solicitudes_ejercicio%ROWTYPE;
    v_admin_nombre text;
    v_ejercicio_id uuid;
BEGIN
    SELECT nombre INTO v_admin_nombre FROM public.profiles
    WHERE id = p_admin_id AND gimnasio_id = p_gimnasio_id AND rol = 'gimnasio' AND activo;
    IF NOT FOUND THEN RAISE EXCEPTION 'Administrador inválido' USING ERRCODE = '22023'; END IF;
    SELECT * INTO v_solicitud FROM public.solicitudes_ejercicio
    WHERE id = p_solicitud_id AND gimnasio_id = p_gimnasio_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Solicitud inexistente' USING ERRCODE = 'P0002'; END IF;
    IF v_solicitud.estado <> 'pendiente' OR v_solicitud.tipo_solicitud <> 'crear'
       OR v_solicitud.categoria IS NULL THEN
        RAISE EXCEPTION 'Solicitud no pendiente o sin categoría' USING ERRCODE = '40001';
    END IF;
    v_ejercicio_id := public.guardar_ejercicio_catalogo(p_gimnasio_id, NULL,
        jsonb_build_object('nombre', v_solicitud.nombre, 'categoria', v_solicitud.categoria,
            'grupos_musculares', to_jsonb(v_solicitud.grupos_musculares),
            'descripcion', v_solicitud.descripcion, 'video_url', v_solicitud.video_url,
            'imagen_url', v_solicitud.imagen_url), v_solicitud.recurso_ids);
    UPDATE public.solicitudes_ejercicio SET estado = 'aprobada',
        ejercicio_catalogo_id_creado = v_ejercicio_id,
        revisado_por_id = p_admin_id, revisado_por_nombre = v_admin_nombre, fecha_revision = now()
    WHERE id = p_solicitud_id RETURNING * INTO v_solicitud;
    RETURN to_jsonb(v_solicitud);
END;
$$;
REVOKE ALL ON FUNCTION public.aprobar_solicitud_catalogo(uuid, uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.aprobar_solicitud_catalogo(uuid, uuid, uuid) TO service_role;
COMMIT;
