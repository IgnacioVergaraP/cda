from app.errors import AuthError
from app.repositories.supabase_catalogo import SupabaseCatalogoRepository

_repo = SupabaseCatalogoRepository()


def _pagina(items):
    return {"items": items[:24], "hay_mas": len(items) > 24}


def listar_ejercicios(gimnasio_id, filtros):
    return _pagina(_repo.listar_ejercicios(gimnasio_id, **filtros))


def obtener_ejercicio(id, gimnasio_id):
    ejercicio = _repo.obtener_ejercicio(id, gimnasio_id)
    if not ejercicio:
        raise AuthError(404, "NotFound", "El ejercicio no existe en tu gimnasio.")
    return ejercicio


def listar_recursos(gimnasio_id, filtros):
    return _pagina(_repo.listar_recursos(gimnasio_id, **filtros))


def guardar_recurso(gimnasio_id, payload, id=None):
    try:
        recurso = _repo.guardar_recurso(gimnasio_id, payload, id)
    except Exception as exc:
        if getattr(exc, "code", None) == "23514":
            raise AuthError(400, "InvalidRecurso", "Este recurso es la única máquina de un ejercicio. Revisa primero sus asociaciones o categoría.") from exc
        if getattr(exc, "code", None) == "23505":
            raise AuthError(409, "DuplicateNumero", "Ese número ya está asignado a otro recurso del gimnasio.") from exc
        raise
    if not recurso:
        raise AuthError(404, "NotFound", "El recurso no existe en tu gimnasio.")
    return recurso


def guardar_ejercicio(gimnasio_id, payload, ids, id=None):
    if id:
        obtener_ejercicio(id, gimnasio_id)
    recursos = _repo.recursos_por_ids(ids, gimnasio_id)
    if len(recursos) != len(ids):
        raise AuthError(400, "InvalidRecurso", "Todos los recursos deben pertenecer a tu gimnasio.")
    if payload["categoria"] == "maquina" and not any(r["tipo"] == "maquina" for r in recursos):
        raise AuthError(400, "InvalidRecurso", "Un ejercicio en máquina debe tener al menos una máquina asociada.")
    try:
        ejercicio = _repo.guardar_ejercicio(gimnasio_id, payload, ids, id)
    except Exception as exc:
        if getattr(exc, "code", None) == "22023":
            raise AuthError(400, "InvalidRecurso", "Revisa los recursos asociados al ejercicio.") from exc
        if getattr(exc, "code", None) == "P0002":
            raise AuthError(404, "NotFound", "El ejercicio no existe en tu gimnasio.") from exc
        raise
    if not ejercicio:
        raise AuthError(404, "NotFound", "El ejercicio no existe en tu gimnasio.")
    return ejercicio
