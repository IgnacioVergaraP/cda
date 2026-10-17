from flask import Blueprint, g, request

from app.utils.responses import ok, created
from app.utils.security.decorators import requiere_rol
from app.blueprints.admin.schemas import (
    validar_crear_horario_payload,
    validar_editar_horario_payload,
    validar_crear_mantenimiento_payload,
)
from app.blueprints.admin import services

bp = Blueprint("admin", __name__)


# -------- Profesores --------

@bp.get("/profesores")
@requiere_rol("gimnasio")
def listar_profesores():
    return ok(services.listar_profesores(g.usuario_actual.gimnasio_id))


# -------- Horarios --------

@bp.get("/horarios")
@requiere_rol("gimnasio")
def listar_horarios():
    profesor_id = request.args.get("profesor_id")
    return ok(services.listar_horarios(g.usuario_actual.gimnasio_id, profesor_id))


@bp.get("/horarios/<horario_id>")
@requiere_rol("gimnasio")
def obtener_horario(horario_id: str):
    return ok(services.obtener_horario(horario_id, g.usuario_actual.gimnasio_id))


@bp.post("/horarios")
@requiere_rol("gimnasio")
def crear_horario():
    data = request.get_json(silent=True) or {}
    payload = validar_crear_horario_payload(data)
    return created(services.crear_horario(g.usuario_actual, payload))


@bp.put("/horarios/<horario_id>")
@requiere_rol("gimnasio")
def editar_horario(horario_id: str):
    data = request.get_json(silent=True) or {}
    payload = validar_editar_horario_payload(data)
    return ok(services.editar_horario(
        horario_id,
        g.usuario_actual.gimnasio_id,
        payload,
    ))


@bp.delete("/horarios/<horario_id>")
@requiere_rol("gimnasio")
def eliminar_horario(horario_id: str):
    return ok(services.eliminar_horario(horario_id, g.usuario_actual.gimnasio_id))


# -------- Dashboard de uso --------

@bp.get("/dashboard/uso")
@requiere_rol("gimnasio")
def dashboard_uso():
    rango = request.args.get("rango", "30d")
    tipo = request.args.get("tipo", "")
    return ok(services.obtener_dashboard_uso(rango, g.usuario_actual.gimnasio_id, tipo))


# -------- Mantenciones --------

@bp.get("/mantenimientos")
@requiere_rol("gimnasio")
def listar_mantenimientos():
    return ok(services.listar_todos_mantenimientos(g.usuario_actual.gimnasio_id))


@bp.get("/maquinas/<maquina_id>/mantenimientos")
@requiere_rol("gimnasio")
def listar_mantenimientos_maquina(maquina_id: str):
    return ok(services.listar_mantenimientos_maquina(
        maquina_id,
        g.usuario_actual.gimnasio_id,
    ))


@bp.post("/mantenimientos")
@requiere_rol("gimnasio")
def crear_mantenimiento():
    data = request.get_json(silent=True) or {}
    payload = validar_crear_mantenimiento_payload(data)
    return created(services.crear_mantenimiento(g.usuario_actual, payload))


@bp.delete("/mantenimientos/<mantenimiento_id>")
@requiere_rol("gimnasio")
def eliminar_mantenimiento(mantenimiento_id: str):
    return ok(services.eliminar_mantenimiento(
        mantenimiento_id,
        g.usuario_actual.gimnasio_id,
    ))
