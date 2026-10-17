from flask import Blueprint, g, request

from app.utils.responses import ok, created
from app.utils.security.decorators import requiere_auth, requiere_rol
from app.blueprints.rutinas import services
from app.blueprints.profesor.schemas import validar_editar_rutina_payload
from app.blueprints.rutinas.schemas import validar_filtros, validar_publicacion
from app.errors import AuthError

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


@bp.put("/<rutina_id>")
@requiere_rol("alumno")
def editar_personal(rutina_id: str):
    payload = validar_editar_rutina_payload(request.get_json(silent=True))
    return ok(services.editar_personal(g.usuario_actual, rutina_id, payload))


@bp.get("/publicas")
@requiere_rol("alumno", "profesor", "gimnasio")
def explorar():
    return ok(services.listar_publicas(g.usuario_actual, validar_filtros(request.args)))


@bp.get("/publicas/mias")
@requiere_rol("profesor", "gimnasio")
def mis_publicaciones():
    return ok(services.listar_publicas(g.usuario_actual, validar_filtros(request.args), propias=True))


@bp.post("/publicas")
@requiere_rol("profesor", "gimnasio")
def crear_publica():
    return created(services.crear_publica(g.usuario_actual, validar_publicacion(request.get_json(silent=True))))


@bp.get("/publicas/<rutina_id>")
@requiere_rol("alumno", "profesor", "gimnasio")
def detalle_publica(rutina_id: str):
    return ok(services.obtener_publica(g.usuario_actual, rutina_id))


@bp.get("/publicas/<rutina_id>/gestion")
@requiere_rol("profesor", "gimnasio")
def detalle_publica_propia(rutina_id: str):
    return ok(services.obtener_publica(g.usuario_actual, rutina_id, propia=True))


@bp.put("/publicas/<rutina_id>")
@requiere_rol("profesor", "gimnasio")
def editar_publica(rutina_id: str):
    payload = validar_publicacion(request.get_json(silent=True))
    return ok(services.editar_publica(g.usuario_actual, rutina_id, payload))


@bp.patch("/publicas/<rutina_id>/publicacion")
@requiere_rol("profesor", "gimnasio")
def cambiar_publicacion(rutina_id: str):
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or not isinstance(data.get("activa"), bool):
        raise AuthError(400, "InvalidPayload", "'activa' debe ser verdadero o falso.")
    return ok(services.cambiar_publicacion(g.usuario_actual, rutina_id, data["activa"]))


@bp.post("/publicas/<rutina_id>/guardar")
@requiere_rol("alumno")
def guardar_publica(rutina_id: str):
    return created(services.guardar_publica(g.usuario_actual, rutina_id))
