"""Lógica de negocio del módulo rutinas (vista alumno)."""
from typing import List
from app.errors import AuthError
from app.domain.models import Rutina, Ejercicio
from app.repositories.supabase_rutinas import SupabaseRutinasRepository
from app.repositories.supabase_maquinas import SupabaseMaquinasRepository



_rutinas_repo = SupabaseRutinasRepository()
_maquinas_repo = SupabaseMaquinasRepository()


def listar_rutinas(alumno_id: str, incluir_inactivas: bool = False) -> List[dict]:
    rutinas = _rutinas_repo.listar_por_alumno(alumno_id, incluir_inactivas=incluir_inactivas)
    return [r.to_dict() for r in rutinas]


def obtener_rutina(rutina_id: str, alumno_id: str, gimnasio_id: str) -> dict:
    rutina = _rutinas_repo.find_by_id(rutina_id)
    if not rutina or rutina.alumno_id != alumno_id or rutina.gimnasio_id != gimnasio_id:
        raise AuthError(
            404, "NotFound",
            f"No existe una rutina con id '{rutina_id}' para este usuario.",
        )

    maquinas_por_id = {}
    for ej in rutina.ejercicios:
        if ej.tipo == "maquina" and ej.maquina_id:
            m = _maquinas_repo.find_by_id(ej.maquina_id, rutina.gimnasio_id)
            if m:
                maquinas_por_id[m.id] = m

    return rutina.to_dict_resuelto(maquinas_por_id)


# -------- Helpers reusables por el blueprint profesor --------

def listar_rutinas_por_alumno_id(alumno_id: str, incluir_inactivas: bool = False) -> List[dict]:
    return [r for r in listar_rutinas(alumno_id, incluir_inactivas=incluir_inactivas)
            if not r["creada_por_alumno"]]


def obtener_rutina_resuelta(rutina_id: str, gimnasio_id: str) -> dict | None:
    """
    Devuelve la rutina resuelta con datos de máquinas, sin chequear pertenencia.
    Usado desde el panel del profesor. Excluye las rutinas creadas por alumnos.
    """
    rutina = _rutinas_repo.find_by_id(rutina_id)
    if not rutina or rutina.gimnasio_id != gimnasio_id or rutina.creada_por_alumno:
        return None

    maquinas_por_id = {}
    for ej in rutina.ejercicios:
        if ej.tipo == "maquina" and ej.maquina_id:
            m = _maquinas_repo.find_by_id(ej.maquina_id, rutina.gimnasio_id)
            if m:
                maquinas_por_id[m.id] = m

    return rutina.to_dict_resuelto(maquinas_por_id)


def crear_rutina(alumno, payload: dict) -> dict:
    """La identidad y el origen se determinan en el servidor."""
    for ejercicio in payload["ejercicios"]:
        if ejercicio["tipo"] == "maquina" and not _maquinas_repo.find_by_id(
            ejercicio["maquina_id"], alumno.gimnasio_id
        ):
            raise AuthError(400, "InvalidMaquina", "La máquina no existe en tu gimnasio.")

    rutina = Rutina(
        id="",
        titulo=payload["titulo"],
        grupos_musculares=payload["grupos_musculares"],
        alumno_id=alumno.id,
        gimnasio_id=alumno.gimnasio_id,
        creada_por_alumno=True,
        ejercicios=[Ejercicio(**ejercicio) for ejercicio in payload["ejercicios"]],
    )
    creada = _rutinas_repo.crear(rutina)
    return obtener_rutina(creada.id, alumno.id, alumno.gimnasio_id)
