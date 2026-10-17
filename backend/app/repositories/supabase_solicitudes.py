"""
Implementación del repositorio de solicitudes de ejercicios contra Supabase.
"""
from datetime import datetime, timezone
from typing import List, Optional
from app.domain.models import SolicitudEjercicio
from app.repositories.solicitudes_repository import SolicitudesRepository
from app.extensions import get_supabase


_COLUMNS = (
    "id,estado,solicitante_id,solicitante_nombre,tipo_solicitud,categoria,recurso_ids,ejercicio_catalogo_id_creado,"
    "nombre,grupos_musculares,descripcion,video_url,imagen_url,"
    "maquina_id_objetivo,maquina_id_creado,"
    "revisado_por_id,revisado_por_nombre,motivo_rechazo,"
    "fecha_creacion,fecha_revision,gimnasio_id"
)


def _row_a_solicitud(row: dict) -> SolicitudEjercicio:
    fecha_cre = row.get("fecha_creacion")
    fecha_rev = row.get("fecha_revision")
    return SolicitudEjercicio(
        id=row["id"],
        tipo_solicitud=row.get("tipo_solicitud", "crear"),
        estado=row["estado"],
        solicitante_id=row["solicitante_id"],
        solicitante_nombre=row["solicitante_nombre"],
        nombre=row["nombre"],
        grupos_musculares=list(row.get("grupos_musculares") or []),
        descripcion=row.get("descripcion", ""),
        video_url=row.get("video_url", ""),
        imagen_url=row.get("imagen_url", ""),
        categoria=row.get("categoria"),
        recurso_ids=list(row.get("recurso_ids") or []),
        ejercicio_catalogo_id_creado=row.get("ejercicio_catalogo_id_creado"),
        maquina_id_objetivo=row.get("maquina_id_objetivo"),
        maquina_id_creado=row.get("maquina_id_creado"),
        revisado_por_id=row.get("revisado_por_id"),
        revisado_por_nombre=row.get("revisado_por_nombre"),
        motivo_rechazo=row.get("motivo_rechazo"),
        gimnasio_id=row["gimnasio_id"],
        fecha_creacion=fecha_cre.isoformat() if hasattr(fecha_cre, "isoformat") else (fecha_cre or ""),
        fecha_revision=fecha_rev.isoformat() if hasattr(fecha_rev, "isoformat") else fecha_rev,
    )


class SupabaseSolicitudesRepository(SolicitudesRepository):

    def __init__(self):
        self._sb = get_supabase()

    def aprobar_catalogo(self, solicitud, admin):
        resp = self._sb.rpc("aprobar_solicitud_catalogo", {
            "p_solicitud_id": solicitud.id, "p_gimnasio_id": admin.gimnasio_id,
            "p_admin_id": admin.id,
        }).execute()
        if not resp.data:
            return None
        return _row_a_solicitud(resp.data)

    def crear(self, solicitud: SolicitudEjercicio) -> SolicitudEjercicio:
        payload = {
            "categoria": solicitud.categoria,
            "recurso_ids": list(solicitud.recurso_ids),
            "estado": solicitud.estado,
            "tipo_solicitud": solicitud.tipo_solicitud,
            "solicitante_id": solicitud.solicitante_id,
            "solicitante_nombre": solicitud.solicitante_nombre,
            "nombre": solicitud.nombre,
            "grupos_musculares": list(solicitud.grupos_musculares),
            "descripcion": solicitud.descripcion,
            "video_url": solicitud.video_url,
            "imagen_url": solicitud.imagen_url,
            "gimnasio_id": solicitud.gimnasio_id,
        }
        resp = self._sb.table("solicitudes_ejercicio").insert(payload).execute()
        if not resp.data:
            raise RuntimeError("No se pudo crear la solicitud.")
        return _row_a_solicitud(resp.data[0])

    def find_by_id(self, solicitud_id: str) -> Optional[SolicitudEjercicio]:
        resp = (
            self._sb.table("solicitudes_ejercicio")
            .select(_COLUMNS)
            .eq("id", solicitud_id)
            .limit(1)
            .execute()
        )
        if not resp.data:
            return None
        return _row_a_solicitud(resp.data[0])

    def listar_por_solicitante(self, solicitante_id: str) -> List[SolicitudEjercicio]:
        resp = (
            self._sb.table("solicitudes_ejercicio")
            .select(_COLUMNS)
            .eq("solicitante_id", solicitante_id)
            .order("fecha_creacion", desc=True)
            .execute()
        )
        return [_row_a_solicitud(row) for row in (resp.data or [])]

    def listar_pendientes(self, gimnasio_id: str) -> List[SolicitudEjercicio]:
        resp = (
            self._sb.table("solicitudes_ejercicio")
            .select(_COLUMNS)
            .eq("estado", "pendiente")
            .eq("gimnasio_id", gimnasio_id)
            .order("fecha_creacion", desc=False)
            .execute()
        )
        return [_row_a_solicitud(row) for row in (resp.data or [])]

    def actualizar(self, solicitud_id: str, data: dict) -> Optional[SolicitudEjercicio]:
        """
        Actualiza una solicitud. Se usa para:
          - Cancelar (estado='cancelada' + fecha_revision)
          - Aprobar (estado='aprobada', revisado_por_*, maquina_id_creado, fecha_revision)
          - Rechazar (estado='rechazada', revisado_por_*, motivo_rechazo, fecha_revision)
        """
        # Aseguramos que fecha_revision siempre se setea si no viene
        payload = dict(data)
        if "fecha_revision" not in payload and "estado" in payload:
            payload["fecha_revision"] = datetime.now(timezone.utc).isoformat()

        resp = (
            self._sb.table("solicitudes_ejercicio")
            .update(payload)
            .eq("id", solicitud_id)
            .execute()
        )
        if not resp.data:
            return None
        return _row_a_solicitud(resp.data[0])