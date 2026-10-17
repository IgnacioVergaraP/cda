"""Lógica de negocio del módulo rutinas (vista alumno)."""
from dataclasses import replace
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

    return _resolver(rutina)


# -------- Helpers reusables por el blueprint profesor --------

def listar_rutinas_por_alumno_id(alumno_id: str, incluir_inactivas: bool = False) -> List[dict]:
    return [r for r in listar_rutinas(alumno_id, incluir_inactivas=incluir_inactivas)
            if not r["creada_por_alumno"] and not r["es_publica"] and not r["rutina_origen_id"]]


def obtener_rutina_resuelta(rutina_id: str, gimnasio_id: str) -> dict | None:
    """
    Devuelve la rutina resuelta con datos de máquinas, sin chequear pertenencia.
    Usado desde el panel del profesor. Excluye las rutinas creadas por alumnos.
    """
    rutina = _rutinas_repo.find_by_id(rutina_id)
    if (not rutina or rutina.gimnasio_id != gimnasio_id or rutina.creada_por_alumno
            or rutina.es_publica or rutina.rutina_origen_id):
        return None

    return _resolver(rutina)


def crear_rutina(alumno, payload: dict) -> dict:
    """La identidad y el origen se determinan en el servidor."""
    _validar_maquinas(alumno, payload)

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


def _resolver(rutina: Rutina) -> dict:
    maquinas = {}
    for e in rutina.ejercicios:
        if e.tipo == "maquina" and e.maquina_id:
            maquina = _maquinas_repo.find_by_id(e.maquina_id, rutina.gimnasio_id)
            if maquina:
                maquinas[maquina.id] = maquina
    return rutina.to_dict_resuelto(maquinas)


def _validar_maquinas(usuario, payload):
    for e in payload["ejercicios"]:
        if e["tipo"] == "maquina" and not _maquinas_repo.find_by_id(e["maquina_id"], usuario.gimnasio_id):
            raise AuthError(400, "InvalidMaquina", "La máquina no existe en tu gimnasio.")


def listar_publicas(usuario, filtros: dict, propias: bool = False) -> dict:
    limite = 24
    rutinas = _rutinas_repo.listar_publicas(
        usuario.gimnasio_id, profesor_id=usuario.id if propias else None,
        limite=limite, **filtros,
    )
    return {"items": [r.to_dict() for r in rutinas[:limite]], "hay_mas": len(rutinas) > limite}


def _publicacion(usuario, rutina_id: str, propia: bool = False) -> Rutina:
    rutina = _rutinas_repo.find_by_id(rutina_id)
    if (not rutina or not rutina.es_publica or rutina.gimnasio_id != usuario.gimnasio_id
            or (propia and rutina.profesor_id != usuario.id)
            or (not propia and not rutina.activa)):
        raise AuthError(404, "NotFound", "La publicación no está disponible.")
    return rutina


def obtener_publica(usuario, rutina_id: str, propia: bool = False) -> dict:
    rutina = _publicacion(usuario, rutina_id, propia)
    data = _resolver(rutina)
    copia = _rutinas_repo.buscar_copia(usuario.id, rutina_id) if usuario.rol == "alumno" else None
    data["copia_id"] = copia.id if copia else None
    return data


def crear_publica(profesor, payload: dict) -> dict:
    _validar_maquinas(profesor, payload)
    rutina = Rutina(
        id="", alumno_id=None, gimnasio_id=profesor.gimnasio_id,
        profesor_id=profesor.id, profesor_nombre=profesor.nombre, es_publica=True,
        ejercicios=[Ejercicio(**e) for e in payload["ejercicios"]],
        **{k: v for k, v in payload.items() if k != "ejercicios"},
    )
    return _resolver(_rutinas_repo.crear(rutina))


def editar_publica(profesor, rutina_id: str, payload: dict) -> dict:
    _publicacion(profesor, rutina_id, propia=True)
    _validar_maquinas(profesor, payload)
    data = {**payload, "ejercicios": [Ejercicio(**e) for e in payload["ejercicios"]]}
    rutina = _rutinas_repo.actualizar(rutina_id, profesor.id, data)
    if not rutina:
        raise AuthError(404, "NotFound", "La publicación no está disponible.")
    return _resolver(rutina)


def cambiar_publicacion(profesor, rutina_id: str, activa: bool) -> dict:
    _publicacion(profesor, rutina_id, propia=True)
    modificar = _rutinas_repo.reactivar if activa else _rutinas_repo.archivar
    rutina = modificar(rutina_id, profesor.id)
    if not rutina:
        raise AuthError(404, "NotFound", "La publicación no está disponible.")
    return rutina.to_dict()


def guardar_publica(alumno, rutina_id: str) -> dict:
    original = _publicacion(alumno, rutina_id)
    copia = _rutinas_repo.buscar_copia(alumno.id, rutina_id)
    if not copia:
        # Copiamos cada ejercicio: editar o retirar el original no modifica la copia.
        copia = replace(
            original, id="", alumno_id=alumno.id, es_publica=False,
            rutina_origen_id=original.id, creada_por_alumno=False,
            ejercicios=[replace(e, id="") for e in original.ejercicios],
            fecha_creacion="", fecha_modificacion=None,
        )
        try:
            copia = _rutinas_repo.crear(copia)
        except Exception as exc:
            # El índice único también impide duplicados ante dos solicitudes simultáneas.
            if getattr(exc, "code", None) != "23505":
                raise
            copia = _rutinas_repo.buscar_copia(alumno.id, rutina_id)
            if not copia:
                raise
    return _resolver(copia)


def editar_personal(alumno, rutina_id: str, payload: dict) -> dict:
    rutina = _rutinas_repo.find_by_id(rutina_id)
    if (not rutina or rutina.gimnasio_id != alumno.gimnasio_id or rutina.alumno_id != alumno.id
            or rutina.es_publica or not (rutina.creada_por_alumno or rutina.rutina_origen_id)):
        raise AuthError(404, "NotFound", "No existe una rutina personal que puedas editar.")
    _validar_maquinas(alumno, payload)
    actualizada = _rutinas_repo.actualizar_personal(
        rutina_id, alumno.id, {**payload, "ejercicios": [Ejercicio(**e) for e in payload["ejercicios"]]},
    )
    if not actualizada:
        raise AuthError(404, "NotFound", "No existe una rutina personal que puedas editar.")
    return _resolver(actualizada)
