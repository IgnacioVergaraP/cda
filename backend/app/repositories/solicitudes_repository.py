"""
Interfaz del repositorio de solicitudes de ejercicios.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import SolicitudEjercicio


class SolicitudesRepository(ABC):

    @abstractmethod
    def aprobar_catalogo(self, solicitud, admin) -> Optional[SolicitudEjercicio]:
        ...

    @abstractmethod
    def crear(self, solicitud: SolicitudEjercicio) -> SolicitudEjercicio:
        ...

    @abstractmethod
    def find_by_id(self, solicitud_id: str) -> Optional[SolicitudEjercicio]:
        ...

    @abstractmethod
    def listar_por_solicitante(self, solicitante_id: str) -> List[SolicitudEjercicio]:
        ...

    @abstractmethod
    def listar_pendientes(self, gimnasio_id: str) -> List[SolicitudEjercicio]:
        ...

    @abstractmethod
    def actualizar(self, solicitud_id: str, data: dict) -> Optional[SolicitudEjercicio]:
        ...