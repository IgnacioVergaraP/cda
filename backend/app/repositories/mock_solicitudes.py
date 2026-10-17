"""
Implementación mock del repositorio de solicitudes.
"""
from copy import deepcopy
from datetime import datetime, timezone
from typing import List, Optional
from app.domain.models import SolicitudEjercicio
from app.repositories.solicitudes_repository import SolicitudesRepository


def _ahora_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# Una solicitud precargada para que la pantalla no esté vacía al entrar.
_SOLICITUDES_INICIALES: List[SolicitudEjercicio] = [
    SolicitudEjercicio(
        id="sol-0001",
        tipo_solicitud="crear",
        estado="pendiente",
        solicitante_id="u-pro-001",
        solicitante_nombre="Prof. Martínez",
        gimnasio_id="mock-gym",
        nombre="Máquina de remo sentado",
        grupos_musculares=["espalda", "biceps"],
        descripcion=(
            "Máquina de remo con agarre neutro. Trabaja la espalda media "
            "y el dorsal ancho. Se realiza sentado, tirando del maneral "
            "hacia el abdomen manteniendo la espalda recta."
        ),
        video_url="https://www.youtube.com/embed/GZbfZ033f74",
        imagen_url="",
        fecha_creacion=_ahora_iso(),
    ),
]


class MockSolicitudesRepository(SolicitudesRepository):

    def __init__(self):
        self._solicitudes: List[SolicitudEjercicio] = deepcopy(_SOLICITUDES_INICIALES)

    def _calcular_next_num(self) -> int:
        max_n = 0
        for s in self._solicitudes:
            try:
                n = int(s.id.replace("sol-", ""))
                if n > max_n:
                    max_n = n
            except ValueError:
                continue
        return max_n + 1

    def _generar_id(self) -> str:
        return f"sol-{self._calcular_next_num():04d}"

    def aprobar_catalogo(self, solicitud, admin):
        from app.blueprints.ejercicios import services as catalogo
        datos = {k: getattr(solicitud, k) for k in ("nombre", "categoria", "grupos_musculares", "descripcion", "video_url", "imagen_url")}
        creado = catalogo.guardar_ejercicio(admin.gimnasio_id, datos, solicitud.recurso_ids)
        return self.actualizar(solicitud.id, {"estado": "aprobada", "ejercicio_catalogo_id_creado": creado["id"],
            "revisado_por_id": admin.id, "revisado_por_nombre": admin.nombre, "fecha_revision": _ahora_iso()})

    def crear(self, solicitud: SolicitudEjercicio) -> SolicitudEjercicio:
        solicitud.id = self._generar_id()
        solicitud.fecha_creacion = _ahora_iso()
        self._solicitudes.append(solicitud)
        return solicitud

    def find_by_id(self, solicitud_id: str) -> Optional[SolicitudEjercicio]:
        for s in self._solicitudes:
            if s.id == solicitud_id:
                return s
        return None

    def listar_por_solicitante(self, solicitante_id: str) -> List[SolicitudEjercicio]:
        result = [s for s in self._solicitudes if s.solicitante_id == solicitante_id]
        result.sort(key=lambda s: s.fecha_creacion, reverse=True)
        return result

    def listar_pendientes(self, gimnasio_id: str) -> List[SolicitudEjercicio]:
        result = [s for s in self._solicitudes if s.estado == "pendiente" and s.gimnasio_id == gimnasio_id]
        result.sort(key=lambda s: s.fecha_creacion)
        return result
    
    def actualizar(self, solicitud_id: str, data: dict) -> Optional[SolicitudEjercicio]:
        solicitud = self.find_by_id(solicitud_id)
        if not solicitud:
            return None
        for key, value in data.items():
            if hasattr(solicitud, key):
                setattr(solicitud, key, value)
        return solicitud