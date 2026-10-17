"""Lógica de negocio del módulo admin."""
from datetime import datetime, timedelta, timezone
from typing import List, Optional
from app.blueprints.ejercicios import services as catalogo_services

from app.errors import AuthError
from app.domain.models import Horario, Mantenimiento
from app.repositories.supabase_horarios import SupabaseHorariosRepository
from app.repositories.supabase_usuarios import SupabaseUsuariosRepository
from app.repositories.supabase_maquinas import SupabaseMaquinasRepository
from app.repositories.supabase_mantenimientos import SupabaseMantenimientosRepository   


_horarios_repo = SupabaseHorariosRepository()
_usuarios_repo = SupabaseUsuariosRepository()
_maquinas_repo = SupabaseMaquinasRepository()
_mantenimientos_repo = SupabaseMantenimientosRepository()


def _progreso_repo():
    """Import perezoso para evitar ciclos."""
    from app.repositories.supabase_progreso import SupabaseProgresoRepository
    return SupabaseProgresoRepository()


# -------- Profesores --------

def listar_profesores(gimnasio_id: str) -> List[dict]:
    todos = _usuarios_repo.listar_por_gimnasio(gimnasio_id)
    profes = [u for u in todos if u.rol in ("profesor", "gimnasio") and u.activo]
    profes.sort(key=lambda u: u.nombre.lower())
    return [{"id": u.id, "nombre": u.nombre, "rol": u.rol} for u in profes]


# -------- Horarios --------

def listar_horarios(gimnasio_id: str, profesor_id: Optional[str] = None) -> List[dict]:
    horarios = _horarios_repo.listar(gimnasio_id, profesor_id)
    horarios.sort(key=lambda h: (h.dia_semana, h.hora_inicio))
    return [h.to_dict() for h in horarios]


def obtener_horario(horario_id: str, gimnasio_id: str) -> dict:
    h = _horarios_repo.find_by_id(horario_id)
    if not h or h.gimnasio_id != gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe un horario con id '{horario_id}'.")
    return h.to_dict()


def crear_horario(admin, payload: dict) -> dict:
    profesor = _usuarios_repo.find_by_id(payload["profesor_id"])
    if (
        not profesor
        or profesor.rol not in ("profesor", "gimnasio")
        or profesor.gimnasio_id != admin.gimnasio_id
    ):
        raise AuthError(400, "InvalidProfesor", f"No existe un profesor con id '{payload['profesor_id']}'.")

    if _horarios_repo.hay_solapamiento(
        profesor_id=payload["profesor_id"],
        dia_semana=payload["dia_semana"],
        hora_inicio=payload["hora_inicio"],
        hora_fin=payload["hora_fin"],
    ):
        raise AuthError(400, "HorarioSolapado", "El profesor ya tiene un horario que se solapa con este.")

    horario = Horario(
        id="",
        profesor_id=profesor.id,
        profesor_nombre=profesor.nombre,
        dia_semana=payload["dia_semana"],
        gimnasio_id=profesor.gimnasio_id,
        hora_inicio=payload["hora_inicio"],
        hora_fin=payload["hora_fin"],
        notas=payload.get("notas"),
    )
    creado = _horarios_repo.crear(horario)
    return creado.to_dict()


def editar_horario(horario_id: str, gimnasio_id: str, payload: dict) -> dict:
    horario = _horarios_repo.find_by_id(horario_id)
    if not horario or horario.gimnasio_id != gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe un horario con id '{horario_id}'.")

    dia = payload.get("dia_semana", horario.dia_semana)
    h_inicio = payload.get("hora_inicio", horario.hora_inicio)
    h_fin = payload.get("hora_fin", horario.hora_fin)

    if h_inicio >= h_fin:
        raise AuthError(400, "InvalidRango", "'hora_inicio' debe ser menor que 'hora_fin'.")

    if _horarios_repo.hay_solapamiento(
        profesor_id=horario.profesor_id,
        dia_semana=dia,
        hora_inicio=h_inicio,
        hora_fin=h_fin,
        excluir_id=horario_id,
    ):
        raise AuthError(400, "HorarioSolapado", "El nuevo horario se solapa con otro del mismo profesor.")

    actualizado = _horarios_repo.actualizar(horario_id, payload)
    if not actualizado:
        raise AuthError(500, "UnexpectedError", "No se pudo actualizar.")
    return actualizado.to_dict()


def eliminar_horario(horario_id: str, gimnasio_id: str) -> dict:
    horario = _horarios_repo.find_by_id(horario_id)
    if not horario or horario.gimnasio_id != gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe un horario con id '{horario_id}'.")
    ok = _horarios_repo.eliminar(horario_id)
    if not ok:
        raise AuthError(404, "NotFound", f"No existe un horario con id '{horario_id}'.")
    return {"id": horario_id, "eliminado": True}


# -------- Dashboard de uso --------

_RANGOS_VALIDOS = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "365d": 365,
}


def _dias_de_rango(rango: str) -> int:
    if rango not in _RANGOS_VALIDOS:
        raise AuthError(400, "InvalidRango", f"'rango' debe ser uno de: {', '.join(_RANGOS_VALIDOS.keys())}.")
    return _RANGOS_VALIDOS[rango]


def obtener_dashboard_uso(rango: str, gimnasio_id: str, tipo: str = "") -> dict:
    """Cada registro cuenta un uso por recurso seleccionado, nunca por asociación del catálogo."""
    dias = _dias_de_rango(rango)
    if tipo not in ("", "maquina", "equipamiento", "infraestructura"):
        raise AuthError(400, "InvalidTipo", "Selecciona un tipo de recurso válido.")
    hasta = datetime.now(timezone.utc)
    desde = hasta - timedelta(days=dias)
    recursos = {r["id"]: r for r in catalogo_services._repo.iterar_recursos_uso(gimnasio_id)
                if r["gimnasio_id"] == gimnasio_id}
    estadisticas = {
        id: {"recurso_id": id, "nombre": r["nombre"], "tipo": r["tipo"],
             "numero_maquina": r.get("numero_maquina"), "cantidad_registros": 0,
             "registros_fuerza": 0, "registros_cardio": 0, "alumnos_unicos": 0}
        for id, r in recursos.items() if not tipo or r["tipo"] == tipo
    }
    alumnos_por_recurso = {id: set() for id in estadisticas}
    alumnos = set()
    total = con_recursos = fuerza = cardio = 0
    for registro in _progreso_repo().iterar_uso_recursos(gimnasio_id, desde.isoformat(), hasta.isoformat()):
        if registro.get("gimnasio_id") != gimnasio_id:
            continue
        try:
            fecha = datetime.fromisoformat(registro["fecha"])
            if fecha.tzinfo is None:
                fecha = fecha.replace(tzinfo=timezone.utc)
            if not desde <= fecha < hasta:
                continue
        except (KeyError, TypeError, ValueError):
            continue
        total += 1
        alumnos.add(registro["alumno_id"])
        es_cardio = registro.get("modalidad") == "cardio"
        cardio += int(es_cardio)
        fuerza += int(not es_cardio)
        ids = {v["recurso_id"] for v in registro.get("vinculos", [])
               if v.get("gimnasio_id") == gimnasio_id and v.get("recurso_id") in recursos}
        con_recursos += int(bool(ids))
        for id in ids & estadisticas.keys():
            fila = estadisticas[id]
            fila["cantidad_registros"] += 1
            fila["registros_cardio" if es_cardio else "registros_fuerza"] += 1
            alumnos_por_recurso[id].add(registro["alumno_id"])
    for id, fila in estadisticas.items():
        fila["alumnos_unicos"] = len(alumnos_por_recurso[id])
    filas = list(estadisticas.values())
    desempate = lambda r: (r["nombre"].casefold(), (r["numero_maquina"] or "").casefold(), r["recurso_id"])
    top = sorted((r for r in filas if r["cantidad_registros"]),
                 key=lambda r: (-r["cantidad_registros"], *desempate(r)))[:5]
    menos = sorted(filas, key=lambda r: (r["cantidad_registros"], *desempate(r)))[:5]
    usados = sum(r["cantidad_registros"] > 0 for r in filas)
    return {
        "rango": rango, "dias": dias, "tipo": tipo,
        "desde": desde.isoformat(), "hasta": hasta.isoformat(),
        "total_registros": total, "registros_con_recursos": con_recursos,
        "registros_sin_recursos": total - con_recursos,
        "registros_fuerza": fuerza, "registros_cardio": cardio,
        "alumnos_con_registros": len(alumnos),
        "total_recursos": len(filas), "recursos_usados": usados,
        "recursos_sin_uso": len(filas) - usados,
        "total_usos": sum(r["cantidad_registros"] for r in filas),
        "top_usadas": top, "menos_usadas": menos,
    }


# -------- Mantenciones --------

def _maquina_nombre(maquina_id: str) -> str:
    m = _maquinas_repo.find_by_id(maquina_id)
    return m.nombre if m else maquina_id


def listar_mantenimientos_maquina(maquina_id: str, gimnasio_id: str) -> dict:
    maquina = _maquinas_repo.find_by_id(maquina_id, gimnasio_id)
    if not maquina or maquina.gimnasio_id != gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe una máquina con id '{maquina_id}'.")
    items = _mantenimientos_repo.listar_por_maquina(maquina_id, gimnasio_id)
    return {
        "maquina": maquina.to_dict(),
        "mantenimientos": [m.to_dict() for m in items],
    }


def listar_todos_mantenimientos(gimnasio_id: str) -> List[dict]:
    return [m.to_dict() for m in _mantenimientos_repo.listar_todos(gimnasio_id)]


def crear_mantenimiento(admin, payload: dict) -> dict:
    maquina = _maquinas_repo.find_by_id(payload["maquina_id"], admin.gimnasio_id)
    if not maquina or maquina.gimnasio_id != admin.gimnasio_id:
        raise AuthError(400, "InvalidMaquina", f"No existe una máquina con id '{payload['maquina_id']}'.")

    # Si viene fecha (YYYY-MM-DD), la convertimos a ISO con hora 12:00 UTC
    # para evitar problemas de zona horaria. Si no, usamos "ahora".
    if payload.get("fecha"):
        # "2026-10-01" → "2026-10-01T12:00:00+00:00"
        fecha_iso = f"{payload['fecha']}T12:00:00+00:00"
    else:
        fecha_iso = datetime.now(timezone.utc).isoformat()

    mantenimiento = Mantenimiento(
        id="",
        maquina_id=maquina.id,
        maquina_nombre=maquina.nombre,
        fecha=fecha_iso,
        tipo=payload["tipo"],
        notas=payload.get("notas"),
        realizado_por_id=admin.id,
        realizado_por_nombre=admin.nombre,
        origen="manual",
        gimnasio_id=admin.gimnasio_id,
    )
    creado = _mantenimientos_repo.crear(mantenimiento)
    return creado.to_dict()


def eliminar_mantenimiento(mantenimiento_id: str, gimnasio_id: str) -> dict:
    mantenimiento = _mantenimientos_repo.find_by_id(mantenimiento_id)
    if not mantenimiento or mantenimiento.gimnasio_id != gimnasio_id:
        raise AuthError(404, "NotFound", f"No existe un mantenimiento con id '{mantenimiento_id}'.")
    ok = _mantenimientos_repo.eliminar(mantenimiento_id)
    if not ok:
        raise AuthError(404, "NotFound", f"No existe un mantenimiento con id '{mantenimiento_id}'.")
    return {"id": mantenimiento_id, "eliminado": True}


def registrar_mantenimiento_auto(reporte, admin) -> Optional[Mantenimiento]:
    """
    Se llama desde el blueprint profesor cuando se resuelve un reporte
    de tipo 'rota' o 'desgastada'.
    """
    if reporte.tipo not in ("rota", "desgastada"):
        return None
    if not reporte.maquina_id:
        return None

    mantenimiento = Mantenimiento(
        id="",
        maquina_id=reporte.maquina_id,
        maquina_nombre=reporte.maquina_nombre or reporte.maquina_id,
        fecha=datetime.now(timezone.utc).isoformat(),
        tipo="correctivo" if reporte.tipo == "rota" else "preventivo",
        notas=f"Auto-generado desde reporte: {reporte.descripcion[:200]}",
        realizado_por_id=admin.id,
        realizado_por_nombre=admin.nombre,
        origen="auto",
        reporte_id=reporte.id,
        gimnasio_id=reporte.gimnasio_id,
    )
    return _mantenimientos_repo.crear(mantenimiento)