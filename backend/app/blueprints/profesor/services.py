"""Lógica de negocio del módulo profesor."""
import logging
from datetime import datetime, timedelta, timezone, date
from typing import List, Optional

from app.errors import AuthError
from app.domain.models import (
    SolicitudEjercicio, Reporte, SolicitudRutina, Rutina, Ejercicio,
)
from app.repositories.supabase_usuarios import SupabaseUsuariosRepository
from app.repositories.supabase_maquinas import SupabaseMaquinasRepository
from app.repositories.supabase_rutinas import SupabaseRutinasRepository
from app.repositories.supabase_progreso import SupabaseProgresoRepository
from app.repositories.supabase_solicitudes import SupabaseSolicitudesRepository
from app.repositories.supabase_reportes import SupabaseReportesRepository

from app.repositories.supabase_solicitudes_rutina import SupabaseSolicitudesRutinaRepository
from app.blueprints.usuario import services as usuario_services
from app.blueprints.progreso import services as progreso_services
from app.blueprints.rutinas import services as rutinas_services


logger = logging.getLogger(__name__)

_usuarios_repo = SupabaseUsuariosRepository()
_progreso_repo = SupabaseProgresoRepository()
_rutinas_repo = SupabaseRutinasRepository()
_maquinas_repo = SupabaseMaquinasRepository()
_solicitudes_repo = SupabaseSolicitudesRepository()
_reportes_repo = SupabaseReportesRepository()
_solicitudes_rutina_repo = SupabaseSolicitudesRutinaRepository()


def _es_alumno(usuario) -> bool:
    return usuario is not None and usuario.rol == "alumno" and usuario.activo


def _todos_los_alumnos(gimnasio_id: str):
    return [u for u in _usuarios_repo.listar_por_gimnasio(gimnasio_id) if _es_alumno(u)]


def _todos_los_profesores(gimnasio_id: str):
    return [u for u in _usuarios_repo.listar_por_gimnasio(gimnasio_id) if u.rol in ("profesor", "gimnasio") and u.activo]


# ============================================================
# Dashboard
# ============================================================

def obtener_dashboard(gimnasio_id: str) -> dict:
    alumnos = _todos_los_alumnos(gimnasio_id)
    total = len(alumnos)
    hoy = datetime.now(timezone.utc).date()
    hace_7 = hoy - timedelta(days=7)
    activos = 0

    for a in alumnos:
        registros = _progreso_repo.listar_por_alumno(a.id)
        if not registros:
            continue
        tiene = False
        for r in registros:
            try:
                f = datetime.fromisoformat(r.fecha).date()
                if f >= hace_7:
                    tiene = True
                    break
            except (ValueError, TypeError):
                continue
        if tiene:
            activos += 1

    return {
        "alumnos_activos_semana": activos,
        "alumnos_total": total,
        "solicitudes_pendientes": len(_solicitudes_repo.listar_pendientes(gimnasio_id)),
        "reportes_abiertos": len([r for r in _reportes_repo.listar_todos(gimnasio_id) if r.estado in ("abierto", "en_revision")]),
        "solicitudes_rutina_pendientes": len(_solicitudes_rutina_repo.listar_pendientes(gimnasio_id)),
    }


# ============================================================
# Alumnos
# ============================================================

def listar_alumnos(gimnasio_id: str) -> List[dict]:
    alumnos = _todos_los_alumnos(gimnasio_id)
    alumnos.sort(key=lambda u: u.nombre.lower())
    return [
        {"id": u.id, "nombre": u.nombre, "email": u.email, "imagen_url": u.imagen_url}
        for u in alumnos
    ]


def listar_profesores_disponibles(gimnasio_id: str) -> List[dict]:
    profes = _todos_los_profesores(gimnasio_id)
    profes.sort(key=lambda u: u.nombre.lower())
    return [
        {
            "id": u.id,
            "nombre": u.nombre,
            "especialidades": list(u.especialidades) if u.especialidades else None,
            "anios_experiencia": u.anios_experiencia,
        }
        for u in profes
    ]


def obtener_perfil_alumno(alumno_id: str, rol_solicitante: str, gimnasio_id: str) -> dict:
    usuario = _usuarios_repo.find_by_id(alumno_id, gimnasio_id)
    if not _es_alumno(usuario):
        raise AuthError(404, "NotFound", f"No existe un alumno con id '{alumno_id}'.")
    return {
        "perfil": usuario_services.obtener_perfil_por_id(alumno_id, rol_solicitante, gimnasio_id),
        "resumen": usuario_services.obtener_resumen_por_id(alumno_id),
    }


def obtener_progreso_alumno(alumno_id: str, gimnasio_id: str) -> dict:
    usuario = _usuarios_repo.find_by_id(alumno_id, gimnasio_id)
    if not _es_alumno(usuario):
        raise AuthError(404, "NotFound", f"No existe un alumno con id '{alumno_id}'.")

    historial = progreso_services.listar_historial(alumno_id)
    evolucion = None
    if historial:
        first = historial[0]
        key = first["maquina_id"] if first["ejercicio_tipo"] == "maquina" else first["nombre_libre"]
        if key:
            evolucion = progreso_services.obtener_evolucion(alumno_id, key)

    return {"historial": historial, "evolucion": evolucion}


def editar_datos_alumno(profesor, alumno_id: str, payload: dict) -> dict:
    """Edición de datos del alumno por parte del profesor (peso, % grasa, notas)."""
    usuario = _usuarios_repo.find_by_id(alumno_id, profesor.gimnasio_id)
    if not _es_alumno(usuario):
        raise AuthError(404, "NotFound", f"No existe un alumno con id '{alumno_id}'.")

    fecha_medicion_grasa = None
    origen_grasa = None
    cargado_por_id = None
    if payload.get("porcentaje_grasa") is not None:
        origen_grasa = "profesor"
        cargado_por_id = profesor.id
        fecha_medicion_grasa = date.today().isoformat()

    actualizado = _usuarios_repo.actualizar(
        user_id=alumno_id,
        peso_actual=payload.get("peso_actual"),
        peso_objetivo=payload.get("peso_objetivo"),
        porcentaje_grasa=payload.get("porcentaje_grasa"),
        fecha_medicion_grasa=fecha_medicion_grasa,
        origen_grasa=origen_grasa,
        cargado_por_id=cargado_por_id,
        notas_profesor=payload.get("notas_profesor"),
    )
    if not actualizado:
        raise AuthError(500, "UnexpectedError", "No se pudo actualizar el alumno.")
    return actualizado.to_public_dict_for(profesor.rol)


# ============================================================
# Rutinas (builder del profesor)
# ============================================================

def listar_rutinas_del_profesor(profesor_id: str, incluir_inactivas: bool = False) -> List[dict]:
    rutinas = _rutinas_repo.listar_por_profesor(profesor_id, incluir_inactivas=incluir_inactivas)
    rutinas.sort(key=lambda r: r.fecha_creacion or "", reverse=True)
    return [r.to_dict() for r in rutinas]


def listar_rutinas_de_alumno(
    alumno_id: str,
    gimnasio_id: str,
    incluir_inactivas: bool = False,
) -> List[dict]:
    usuario = _usuarios_repo.find_by_id(alumno_id, gimnasio_id)
    if not _es_alumno(usuario):
        raise AuthError(404, "NotFound", f"No existe un alumno con id '{alumno_id}'.")
    return rutinas_services.listar_rutinas_por_alumno_id(alumno_id, incluir_inactivas=incluir_inactivas)


def obtener_rutina_para_profesor(rutina_id: str, gimnasio_id: str) -> dict:
    data = rutinas_services.obtener_rutina_resuelta(rutina_id, gimnasio_id)
    if not data:
        raise AuthError(404, "NotFound", f"No existe una rutina con id '{rutina_id}'.")
    return data


def crear_rutina(profesor, payload: dict) -> dict:
    alumno = _usuarios_repo.find_by_id(payload["alumno_id"], profesor.gimnasio_id)
    if not _es_alumno(alumno):
        raise AuthError(400, "InvalidAlumno", f"No existe un alumno con id '{payload['alumno_id']}'.")

    ejercicios = [
        Ejercicio(
            id=e["id"],
            tipo=e["tipo"],
            series=e["series"],
            repeticiones=e["repeticiones"],
            peso_sugerido=e.get("peso_sugerido"),
            maquina_id=e.get("maquina_id"),
            nombre=e.get("nombre"),
            descripcion=e.get("descripcion"),
        )
        for e in payload["ejercicios"]
    ]

    rutina = Rutina(
        id="",
        titulo=payload["titulo"],
        grupos_musculares=payload["grupos_musculares"],
        alumno_id=payload["alumno_id"],
        gimnasio_id=profesor.gimnasio_id,
        profesor_id=profesor.id,
        profesor_nombre=profesor.nombre,
        activa=True,
        ejercicios=ejercicios,
    )
    creada = _rutinas_repo.crear(rutina)
    logger.info("[RUTINA CREADA] %s por %s para alumno %s",
                creada.id, profesor.nombre, alumno.nombre)

    # Resolver solicitud de rutina activa si existe
    solicitudes_activas = [
        s for s in _solicitudes_rutina_repo.listar_por_alumno(payload["alumno_id"])
        if s.estado in ("pendiente", "en_proceso")
    ]
    if solicitudes_activas:
        s = solicitudes_activas[0]
        _solicitudes_rutina_repo.actualizar(s.id, {
            "estado": "resuelta",
            "rutina_id": creada.id,
            "profesor_id": profesor.id,
            "profesor_nombre": profesor.nombre,
            "mensaje_resolucion": f"Te armé la rutina '{creada.titulo}'. Ya la podés ver en la app.",
            "fecha_revision": datetime.now(timezone.utc).isoformat(),
        })

    return creada.to_dict_resuelto(_maquinas_dict_para(creada))


def editar_rutina(profesor, rutina_id: str, payload: dict) -> dict:
    ejercicios = [
        Ejercicio(
            id=e["id"],
            tipo=e["tipo"],
            series=e["series"],
            repeticiones=e["repeticiones"],
            peso_sugerido=e.get("peso_sugerido"),
            maquina_id=e.get("maquina_id"),
            nombre=e.get("nombre"),
            descripcion=e.get("descripcion"),
        )
        for e in payload["ejercicios"]
    ]

    actualizada = _rutinas_repo.actualizar(
        rutina_id=rutina_id,
        profesor_id=profesor.id,
        data={
            "titulo": payload["titulo"],
            "grupos_musculares": payload["grupos_musculares"],
            "ejercicios": ejercicios,
        },
    )
    if not actualizada:
        raise AuthError(404, "NotFound", f"No existe una rutina con id '{rutina_id}' que te pertenezca.")
    return actualizada.to_dict_resuelto(_maquinas_dict_para(actualizada))


def archivar_rutina(profesor, rutina_id: str) -> dict:
    rutina = _rutinas_repo.archivar(rutina_id, profesor.id)
    if not rutina:
        raise AuthError(404, "NotFound", f"No existe una rutina con id '{rutina_id}' que te pertenezca.")
    return rutina.to_dict()


def reactivar_rutina(profesor, rutina_id: str) -> dict:
    rutina = _rutinas_repo.reactivar(rutina_id, profesor.id)
    if not rutina:
        raise AuthError(404, "NotFound", f"No existe una rutina con id '{rutina_id}' que te pertenezca.")
    return rutina.to_dict()


def duplicar_rutina(profesor, rutina_id: str, nuevo_alumno_id: str) -> dict:
    nuevo_alumno = _usuarios_repo.find_by_id(nuevo_alumno_id, profesor.gimnasio_id)
    if not _es_alumno(nuevo_alumno):
        raise AuthError(400, "InvalidAlumno", f"No existe un alumno con id '{nuevo_alumno_id}'.")

    original = _rutinas_repo.find_by_id(rutina_id)
    if (not original or original.gimnasio_id != profesor.gimnasio_id or original.creada_por_alumno
            or original.es_publica or original.rutina_origen_id):
        raise AuthError(404, "NotFound", f"No existe una rutina con id '{rutina_id}'.")

    nueva = _rutinas_repo.duplicar(
        rutina_id=rutina_id,
        profesor={"id": profesor.id, "nombre": profesor.nombre},
        nuevo_alumno_id=nuevo_alumno_id,
    )
    if not nueva:
        raise AuthError(500, "UnexpectedError", "No se pudo duplicar la rutina.")
    return nueva.to_dict_resuelto(_maquinas_dict_para(nueva))


def _maquinas_dict_para(rutina: Rutina) -> dict:
    maquinas_por_id = {}
    for ej in rutina.ejercicios:
        if ej.tipo == "maquina" and ej.maquina_id:
            m = _maquinas_repo.find_by_id(ej.maquina_id, rutina.gimnasio_id)
            if m:
                maquinas_por_id[m.id] = m
    return maquinas_por_id


# ============================================================
# Solicitudes de ejercicio (profesor → admin)
# ============================================================

def crear_solicitud(profesor, payload: dict) -> dict:
    solicitud = SolicitudEjercicio(
        id="",
        tipo_solicitud="crear",
        estado="pendiente",
        solicitante_id=profesor.id,
        gimnasio_id=profesor.gimnasio_id,
        solicitante_nombre=profesor.nombre,
        nombre=payload["nombre"],
        grupos_musculares=payload["grupos_musculares"],
        descripcion=payload["descripcion"],
        video_url=payload["video_url"],
        imagen_url=payload["imagen_url"],
    )
    creada = _solicitudes_repo.crear(solicitud)
    logger.info("[NOTIFICACIÓN ADMIN] Nueva solicitud %s de '%s' creada por %s",
                creada.id, creada.nombre, profesor.nombre)
    return creada.to_dict()


def listar_mis_solicitudes(profesor_id: str) -> List[dict]:
    return [s.to_dict() for s in _solicitudes_repo.listar_por_solicitante(profesor_id)]


def cancelar_solicitud(profesor, solicitud_id: str) -> dict:
    solicitud = _solicitudes_repo.find_by_id(solicitud_id)
    if (
        not solicitud
        or solicitud.solicitante_id != profesor.id
        or solicitud.gimnasio_id != profesor.gimnasio_id
    ):
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.estado != "pendiente":
        raise AuthError(400, "InvalidState", "Solo se pueden cancelar solicitudes pendientes.")

    actualizada = _solicitudes_repo.actualizar(solicitud_id, {
        "estado": "cancelada",
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo cancelar la solicitud.")
    return actualizada.to_dict()


def listar_pendientes(gimnasio_id: str) -> List[dict]:
    return [s.to_dict() for s in _solicitudes_repo.listar_pendientes(gimnasio_id)]


def contar_pendientes(gimnasio_id: str) -> dict:
    return {"count": len(_solicitudes_repo.listar_pendientes(gimnasio_id))}


def aprobar_solicitud(admin, solicitud_id: str) -> dict:
    solicitud = _solicitudes_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != admin.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.estado != "pendiente":
        raise AuthError(400, "InvalidState", "Solo se pueden aprobar solicitudes pendientes.")

    if solicitud.tipo_solicitud == "crear":
        maquina = _maquinas_repo.crear(
            nombre=solicitud.nombre,
            grupos_musculares=solicitud.grupos_musculares,
            descripcion=solicitud.descripcion,
            gimnasio_id=solicitud.gimnasio_id,
            video_url=solicitud.video_url,
            imagen_url=solicitud.imagen_url,
        )
        maquina_id_creado = maquina.id
    else:
        raise AuthError(400, "NotSupported", f"Tipo de solicitud '{solicitud.tipo_solicitud}' no soportado todavía.")

    actualizada = _solicitudes_repo.actualizar(solicitud_id, {
        "estado": "aprobada",
        "revisado_por_id": admin.id,
        "revisado_por_nombre": admin.nombre,
        "maquina_id_creado": maquina_id_creado,
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo aprobar la solicitud.")

    logger.info("[APROBACIÓN] Solicitud %s aprobada por %s → máquina %s creada",
                solicitud.id, admin.nombre, maquina_id_creado)
    return actualizada.to_dict()


def rechazar_solicitud(admin, solicitud_id: str, motivo: str) -> dict:
    solicitud = _solicitudes_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != admin.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.estado != "pendiente":
        raise AuthError(400, "InvalidState", "Solo se pueden rechazar solicitudes pendientes.")

    actualizada = _solicitudes_repo.actualizar(solicitud_id, {
        "estado": "rechazada",
        "motivo_rechazo": motivo,
        "revisado_por_id": admin.id,
        "revisado_por_nombre": admin.nombre,
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo rechazar la solicitud.")

    logger.info("[RECHAZO] Solicitud %s rechazada por %s. Motivo: %s",
                solicitud.id, admin.nombre, motivo)
    return actualizada.to_dict()


# ============================================================
# Reportes
# ============================================================

# ============================================================
# Reportes
# ============================================================

def crear_reporte(profesor, payload: dict) -> dict:
    maquina_id = payload.get("maquina_id")
    maquina_nombre = None
    if maquina_id:
        maquina = _maquinas_repo.find_by_id(maquina_id, profesor.gimnasio_id)
        if not maquina:
            raise AuthError(400, "InvalidMaquina", f"No existe una máquina con id '{maquina_id}'.")
        maquina_nombre = maquina.nombre
    reporte = Reporte(
        id="", estado="abierto", tipo=payload["tipo"], prioridad=payload["prioridad"],
        descripcion=payload["descripcion"], reportante_id=profesor.id,
        reportante_nombre=profesor.nombre, maquina_id=maquina_id,
        gimnasio_id=profesor.gimnasio_id,
        maquina_nombre=maquina_nombre, foto_url=payload.get("foto_url"),
    )
    creado = _reportes_repo.crear(reporte)
    logger.info("[NOTIFICACIÓN ADMIN] Nuevo reporte %s creado por %s (prioridad=%s, tipo=%s)",
                creado.id, profesor.nombre, creado.prioridad, creado.tipo)
    return creado.to_dict()


def listar_mis_reportes(profesor_id: str) -> List[dict]:
    return [r.to_dict() for r in _reportes_repo.listar_por_reportante(profesor_id)]


def cancelar_reporte(profesor, reporte_id: str) -> dict:
    reporte = _reportes_repo.find_by_id(reporte_id)
    if (
        not reporte
        or reporte.reportante_id != profesor.id
        or reporte.gimnasio_id != profesor.gimnasio_id
    ):
        raise AuthError(404, "NotFound", f"No existe un reporte con id '{reporte_id}'.")
    if reporte.estado != "abierto":
        raise AuthError(400, "InvalidState", "Solo se pueden cancelar reportes en estado 'abierto'.")

    actualizado = _reportes_repo.actualizar(reporte_id, {
        "estado": "cancelado",
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizado:
        raise AuthError(500, "UnexpectedError", "No se pudo cancelar el reporte.")
    return actualizado.to_dict()


def listar_todos_reportes(gimnasio_id: str) -> List[dict]:
    return [r.to_dict() for r in _reportes_repo.listar_todos(gimnasio_id)]


def contar_reportes(gimnasio_id: str) -> dict:
    todos = _reportes_repo.listar_todos(gimnasio_id)
    abiertos = len([r for r in todos if r.estado == "abierto"])
    en_revision = len([r for r in todos if r.estado == "en_revision"])
    resueltos = len([r for r in todos if r.estado == "resuelto"])
    return {
        "abiertos": abiertos,
        "en_revision": en_revision,
        "resueltos": resueltos,
        "total_pendientes": abiertos + en_revision,
    }


def marcar_reporte_en_revision(admin, reporte_id: str) -> dict:
    reporte = _reportes_repo.find_by_id(reporte_id)
    if not reporte or reporte.gimnasio_id != admin.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe un reporte con id '{reporte_id}'.")
    if reporte.estado != "abierto":
        raise AuthError(400, "InvalidState", "Solo se pueden marcar en revisión reportes en estado 'abierto'.")

    actualizado = _reportes_repo.actualizar(reporte_id, {
        "estado": "en_revision",
        "revisado_por_id": admin.id,
        "revisado_por_nombre": admin.nombre,
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizado:
        raise AuthError(500, "UnexpectedError", "No se pudo marcar en revisión.")
    return actualizado.to_dict()


def resolver_reporte(admin, reporte_id: str, resolucion: str | None) -> dict:
    reporte = _reportes_repo.find_by_id(reporte_id)
    if not reporte or reporte.gimnasio_id != admin.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe un reporte con id '{reporte_id}'.")
    if reporte.estado not in ("abierto", "en_revision"):
        raise AuthError(400, "InvalidState", "Solo se pueden resolver reportes abiertos o en revisión.")

    actualizado = _reportes_repo.actualizar(reporte_id, {
        "estado": "resuelto",
        "resolucion": resolucion,
        "revisado_por_id": admin.id,
        "revisado_por_nombre": admin.nombre,
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizado:
        raise AuthError(500, "UnexpectedError", "No se pudo resolver el reporte.")

    # Auto-generar mantenimiento si aplica
    try:
        from app.blueprints.admin import services as admin_services
        admin_services.registrar_mantenimiento_auto(actualizado, admin)
    except Exception:
        logger.exception("Error generando mantenimiento automático")

    return actualizado.to_dict()


# ============================================================
# Solicitudes de rutina
# ============================================================

def _solicitudes_activas_de_alumno(alumno_id: str) -> List[SolicitudRutina]:
    return [
        s for s in _solicitudes_rutina_repo.listar_por_alumno(alumno_id)
        if s.estado in ("pendiente", "en_proceso")
    ]


def crear_solicitud_rutina(alumno, payload: dict) -> dict:
    activas = _solicitudes_activas_de_alumno(alumno.id)
    if activas:
        raise AuthError(400, "SolicitudActiva",
                        "Ya tenés una solicitud de rutina activa. Cancelala antes de crear otra.")

    profesor_preferido_id = payload.get("profesor_preferido_id")
    profesor_preferido_nombre = None
    if profesor_preferido_id:
        profe = _usuarios_repo.find_by_id(profesor_preferido_id, alumno.gimnasio_id)
        if not profe or profe.rol not in ("profesor", "gimnasio"):
            raise AuthError(400, "InvalidProfesor", f"No existe un profesor con id '{profesor_preferido_id}'.")
        profesor_preferido_nombre = profe.nombre

    solicitud = SolicitudRutina(
        id="", estado="pendiente", alumno_id=alumno.id, alumno_nombre=alumno.nombre,
        objetivo=payload["objetivo"], dias_por_semana=payload["dias_por_semana"], gimnasio_id=alumno.gimnasio_id,
        comentarios=payload.get("comentarios"), grupos_interes=payload.get("grupos_interes"),
        profesor_preferido_id=profesor_preferido_id, profesor_preferido_nombre=profesor_preferido_nombre,
    )
    creada = _solicitudes_rutina_repo.crear(solicitud)
    logger.info("[NOTIFICACIÓN PROFESOR] Nueva solicitud de rutina %s de %s",
                creada.id, alumno.nombre)
    return creada.to_dict()


def listar_mis_solicitudes_rutina(alumno_id: str) -> List[dict]:
    return [s.to_dict() for s in _solicitudes_rutina_repo.listar_por_alumno(alumno_id)]


def cancelar_solicitud_rutina(alumno, solicitud_id: str) -> dict:
    solicitud = _solicitudes_rutina_repo.find_by_id(solicitud_id)
    if (
        not solicitud
        or solicitud.alumno_id != alumno.id
        or solicitud.gimnasio_id != alumno.gimnasio_id
    ):
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.estado not in ("pendiente", "en_proceso"):
        raise AuthError(400, "InvalidState", "Solo se pueden cancelar solicitudes pendientes o en proceso.")

    actualizada = _solicitudes_rutina_repo.actualizar(solicitud_id, {
        "estado": "cancelada",
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo cancelar la solicitud.")
    return actualizada.to_dict()


def listar_solicitudes_rutina_disponibles(profesor) -> List[dict]:
    pendientes = _solicitudes_rutina_repo.listar_pendientes(profesor.gimnasio_id)
    result = []
    for s in pendientes:
        if s.profesor_preferido_id is None or s.profesor_preferido_id == profesor.id:
            result.append(s.to_dict())
    return result


def listar_mis_solicitudes_rutina_como_profesor(profesor_id: str) -> List[dict]:
    return [s.to_dict() for s in _solicitudes_rutina_repo.listar_por_profesor(profesor_id)]


def listar_todas_solicitudes_rutina(gimnasio_id: str) -> List[dict]:
    return [s.to_dict() for s in _solicitudes_rutina_repo.listar_todas(gimnasio_id)]


def listar_solicitudes_rutina_de_alumno(alumno_id: str, gimnasio_id: str) -> List[dict]:
    usuario = _usuarios_repo.find_by_id(alumno_id, gimnasio_id)
    if not _es_alumno(usuario):
        raise AuthError(404, "NotFound", f"No existe un alumno con id '{alumno_id}'.")
    return [s.to_dict() for s in _solicitudes_rutina_repo.listar_por_alumno(alumno_id)]


def tomar_solicitud_rutina(profesor, solicitud_id: str) -> dict:
    solicitud = _solicitudes_rutina_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != profesor.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.estado != "pendiente":
        raise AuthError(400, "InvalidState", "Solo se pueden tomar solicitudes pendientes.")
    if solicitud.profesor_preferido_id and solicitud.profesor_preferido_id != profesor.id:
        raise AuthError(403, "Forbidden", "Esta solicitud está dirigida a otro profesor.")

    actualizada = _solicitudes_rutina_repo.actualizar(solicitud_id, {
        "estado": "en_proceso",
        "profesor_id": profesor.id,
        "profesor_nombre": profesor.nombre,
        "fecha_tomada": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo tomar la solicitud.")
    return actualizada.to_dict()


def resolver_solicitud_rutina(profesor, solicitud_id: str, mensaje: str, rutina_id: str | None) -> dict:
    solicitud = _solicitudes_rutina_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != profesor.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.profesor_id != profesor.id:
        raise AuthError(403, "Forbidden", "Solo el profesor que tomó la solicitud puede resolverla.")
    if solicitud.estado != "en_proceso":
        raise AuthError(400, "InvalidState", "Solo se pueden resolver solicitudes en proceso.")

    actualizada = _solicitudes_rutina_repo.actualizar(solicitud_id, {
        "estado": "resuelta",
        "mensaje_resolucion": mensaje,
        "rutina_id": rutina_id,
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo resolver la solicitud.")
    return actualizada.to_dict()


def rechazar_solicitud_rutina(profesor, solicitud_id: str, motivo: str) -> dict:
    solicitud = _solicitudes_rutina_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != profesor.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.profesor_id != profesor.id:
        raise AuthError(403, "Forbidden", "Solo el profesor que tomó la solicitud puede rechazarla.")
    if solicitud.estado != "en_proceso":
        raise AuthError(400, "InvalidState", "Solo se pueden rechazar solicitudes en proceso.")

    actualizada = _solicitudes_rutina_repo.actualizar(solicitud_id, {
        "estado": "rechazada",
        "motivo_rechazo": motivo,
        "fecha_revision": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo rechazar la solicitud.")
    return actualizada.to_dict()


def solicitar_liberacion(profesor, solicitud_id: str) -> dict:
    solicitud = _solicitudes_rutina_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != profesor.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.profesor_id != profesor.id:
        raise AuthError(403, "Forbidden", "Solo el profesor que tomó la solicitud puede pedir liberación.")
    if solicitud.estado != "en_proceso":
        raise AuthError(400, "InvalidState", "Solo se puede pedir liberación de solicitudes en proceso.")
    if solicitud.estado_liberacion == "solicitada":
        raise AuthError(400, "InvalidState", "Ya pediste la liberación de esta solicitud.")

    actualizada = _solicitudes_rutina_repo.actualizar(solicitud_id, {
        "estado_liberacion": "solicitada",
        "fecha_liberacion_solicitada": datetime.now(timezone.utc).isoformat(),
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo pedir la liberación.")
    return actualizada.to_dict()


def listar_liberaciones_pendientes(gimnasio_id: str) -> List[dict]:
    todos = _solicitudes_rutina_repo.listar_todas(gimnasio_id)
    return [
        s.to_dict() for s in todos
        if s.estado == "en_proceso" and s.estado_liberacion == "solicitada"
    ]


def aprobar_liberacion(admin, solicitud_id: str) -> dict:
    solicitud = _solicitudes_rutina_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != admin.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.estado != "en_proceso" or solicitud.estado_liberacion != "solicitada":
        raise AuthError(400, "InvalidState", "La solicitud no tiene una liberación pendiente.")

    actualizada = _solicitudes_rutina_repo.actualizar(solicitud_id, {
        "estado": "pendiente",
        "profesor_id": None,
        "profesor_nombre": None,
        "fecha_tomada": None,
        "estado_liberacion": "aprobada",
        "liberacion_revisada_por_id": admin.id,
        "liberacion_revisada_por_nombre": admin.nombre,
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo aprobar la liberación.")
    return actualizada.to_dict()


def rechazar_liberacion(admin, solicitud_id: str, motivo: str) -> dict:
    solicitud = _solicitudes_rutina_repo.find_by_id(solicitud_id)
    if not solicitud or solicitud.gimnasio_id != admin.gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una solicitud con id '{solicitud_id}'.")
    if solicitud.estado != "en_proceso" or solicitud.estado_liberacion != "solicitada":
        raise AuthError(400, "InvalidState", "La solicitud no tiene una liberación pendiente.")

    actualizada = _solicitudes_rutina_repo.actualizar(solicitud_id, {
        "estado_liberacion": "rechazada",
        "liberacion_motivo_rechazo": motivo,
        "liberacion_revisada_por_id": admin.id,
        "liberacion_revisada_por_nombre": admin.nombre,
    })
    if not actualizada:
        raise AuthError(500, "UnexpectedError", "No se pudo rechazar la liberación.")
    return actualizada.to_dict()

# ============================================================
# Horarios
# ============================================================

def listar_mis_horarios(profesor_id: str, gimnasio_id: str) -> List[dict]:
    """Horarios del profesor autenticado."""
    from app.blueprints.admin import services as admin_services
    return admin_services.listar_horarios(gimnasio_id, profesor_id)