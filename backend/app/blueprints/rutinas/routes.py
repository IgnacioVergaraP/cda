from flask import Blueprint, g, request

from app.utils.responses import ok, created
from app.utils.security.decorators import requiere_auth, requiere_rol
from app.blueprints.rutinas import services
from app.blueprints.profesor.schemas import validar_editar_rutina_payload

bp = Blueprint("rutinas", __name__)


@bp.get("")
@requiere_auth
def listar():
    incluir_inactivas = request.args.get("incluir_inactivas", "false").lower() == "true"
    return ok(services.listar_rutinas(g.usuario_actual.id, incluir_inactivas=incluir_inactivas))


@bp.get("/<rutina_id>")
@requiere_auth
def detalle(rutina_id: str):
    return ok(services.obtener_rutina(
        rutina_id,
        g.usuario_actual.id,
        g.usuario_actual.gimnasio_id,
    ))


@bp.post("")
@requiere_rol("alumno")
def crear():
    payload = validar_editar_rutina_payload(request.get_json(silent=True))
    return created(services.crear_rutina(g.usuario_actual, payload))
