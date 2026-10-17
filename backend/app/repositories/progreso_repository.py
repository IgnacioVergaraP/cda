"""
Interfaz del repositorio de progreso.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import RegistroSerie


class ProgresoRepository(ABC):

    @abstractmethod
    def crear(self, registro: RegistroSerie) -> RegistroSerie:
        ...

    @abstractmethod
    def listar_por_alumno(self, alumno_id: str) -> List[RegistroSerie]:
        ...

    @abstractmethod
    def listar_por_ejercicio(self, alumno_id: str, ejercicio_key: str) -> List[RegistroSerie]:
        ...

    @abstractmethod
    def listar_sesion(
        self, alumno_id: str, ejercicio_key: str, fecha_dia: str
    ) -> List[RegistroSerie]:
        """
        Series individuales de un ejercicio en un día específico.
        fecha_dia: 'YYYY-MM-DD'
        """
        ...

    @abstractmethod
    def siguiente_numero_serie(self, alumno_id: str, ejercicio_key: str, fecha_iso_dia: str) -> int:
        ...

    @abstractmethod
    def find_by_id(self, registro_id: str) -> Optional[RegistroSerie]:
        ...

    @abstractmethod
    def actualizar(
        self,
        registro_id: str,
        alumno_id: str,
        peso: str,
        repeticiones: str,
        **metricas,
    ) -> Optional[RegistroSerie]:
        ...