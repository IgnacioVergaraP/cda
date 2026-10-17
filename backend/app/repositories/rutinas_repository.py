"""
Interfaz del repositorio de rutinas.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from app.domain.models import Rutina


class RutinasRepository(ABC):

    @abstractmethod
    def listar_por_alumno(self, alumno_id: str, incluir_inactivas: bool = False) -> List[Rutina]:
        ...

    @abstractmethod
    def listar_por_profesor(self, profesor_id: str, incluir_inactivas: bool = False) -> List[Rutina]:
        ...

    @abstractmethod
    def find_by_id(self, rutina_id: str) -> Optional[Rutina]:
        ...

    @abstractmethod
    def crear(self, rutina: Rutina) -> Rutina:
        ...

    @abstractmethod
    def actualizar(self, rutina_id: str, profesor_id: str, data: dict) -> Optional[Rutina]:
        ...

    @abstractmethod
    def archivar(self, rutina_id: str, profesor_id: str) -> Optional[Rutina]:
        ...

    @abstractmethod
    def reactivar(self, rutina_id: str, profesor_id: str) -> Optional[Rutina]:
        ...

    @abstractmethod
    def duplicar(self, rutina_id: str, profesor: dict, nuevo_alumno_id: str) -> Optional[Rutina]:
        ...

    @abstractmethod
    def listar_publicas(self, gimnasio_id: str, *, profesor_id: str | None = None,
                        disciplina: str = "", nivel: str = "", buscar: str = "",
                        desde: int = 0, limite: int = 24) -> List[Rutina]:
        ...

    @abstractmethod
    def buscar_copia(self, alumno_id: str, origen_id: str) -> Optional[Rutina]:
        ...

    @abstractmethod
    def actualizar_personal(self, rutina_id: str, alumno_id: str, data: dict) -> Optional[Rutina]:
        ...
