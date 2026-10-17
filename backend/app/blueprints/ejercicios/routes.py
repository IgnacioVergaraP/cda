from flask import Blueprint, g, request
from app.utils.responses import ok, created
from app.utils.security.decorators import requiere_auth, requiere_rol
from . import schemas, services

bp = Blueprint("catalogo_ejercicios", __name__)


@bp.get("/ejercicios")
@requiere_auth
def listar_ejercicios():
    return ok(services.listar_ejercicios(g.usuario_actual.gimnasio_id, schemas.filtros(request.args)))


@bp.get("/ejercicios/<id>")
@requiere_auth
def detalle(id):
    return ok(services.obtener_ejercicio(schemas.validar_id(id), g.usuario_actual.gimnasio_id))


@bp.post("/ejercicios")
@requiere_rol("gimnasio")
def crear_ejercicio():
    payload, ids = schemas.ejercicio(request.get_json(silent=True))
    return created(services.guardar_ejercicio(g.usuario_actual.gimnasio_id, payload, ids))


@bp.put("/ejercicios/<id>")
@requiere_rol("gimnasio")
def editar_ejercicio(id):
    id = schemas.validar_id(id)
    payload, ids = schemas.ejercicio(request.get_json(silent=True))
    return ok(services.guardar_ejercicio(g.usuario_actual.gimnasio_id, payload, ids, id))


@bp.get("/recursos")
@requiere_auth
def listar_recursos():
    return ok(services.listar_recursos(g.usuario_actual.gimnasio_id, schemas.filtros(request.args, recursos=True)))


@bp.post("/recursos")
@requiere_rol("gimnasio")
def crear_recurso():
    return created(services.guardar_recurso(g.usuario_actual.gimnasio_id, schemas.recurso(request.get_json(silent=True))))


@bp.put("/recursos/<id>")
@requiere_rol("gimnasio")
def editar_recurso(id):
    id = schemas.validar_id(id)
    return ok(services.guardar_recurso(g.usuario_actual.gimnasio_id, schemas.recurso(request.get_json(silent=True)), id))
