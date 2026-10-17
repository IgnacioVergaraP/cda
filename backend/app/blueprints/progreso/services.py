"""Lógica de negocio del módulo progreso."""
from datetime import datetime, timezone
from typing import List, Dict
from collections import defaultdict
import re
import math
from app.blueprints.ejercicios import services as catalogo_services
from app.blueprints.rutinas import services as rutinas_services

from app.errors import AuthError
from app.domain.models import RegistroSerie
from app.repositories.supabase_progreso import SupabaseProgresoRepository
from app.repositories.supabase_maquinas import SupabaseMaquinasRepository


_progreso_repo = SupabaseProgresoRepository()
_maquinas_repo = SupabaseMaquinasRepository()


def _key_de_registro(r: RegistroSerie) -> str:
    if r.ejercicio_catalogo_id:
        return "catalogo:" + r.ejercicio_catalogo_id
    return r.maquina_id if r.ejercicio_tipo == "maquina" else (r.nombre_libre or "")


def _nombre_visible(r: RegistroSerie, catalogo=None) -> str:
    if r.ejercicio_catalogo_id:
        e = (catalogo.get(r.ejercicio_catalogo_id) if catalogo is not None else
             catalogo_services._repo.obtener_ejercicio(r.ejercicio_catalogo_id, r.gimnasio_id))
        if e:
            return e["nombre"]
    if r.ejercicio_tipo == "maquina" and r.maquina_id:
        m = _maquinas_repo.find_by_id(r.maquina_id, r.gimnasio_id)
        return m.nombre if m else r.maquina_id
    return r.nombre_libre or "Ejercicio"


def _peso_numerico(peso_str: str) -> float | None:
    match = re.fullmatch(r"\s*(\d+(?:[.,]\d+)?)\s*(kg|lbs?)?\s*", peso_str or "", re.I)
    if not match:
        return None
    valor = float(match[1].replace(",", "."))
    if not math.isfinite(valor):
        return None
    return round(valor * 0.45359237, 6) if (match[2] or "").lower().startswith("lb") else valor


def _peso_max_numerico(registros: List[RegistroSerie]) -> float:
    max_peso = 0.0
    for r in registros:
        if r.modalidad == "cardio":
            continue
        n = None if r.peso_unidad == "otro" else (r.peso_kg if r.peso_kg is not None else _peso_numerico(r.peso))
        if n is not None and n > max_peso:
            max_peso = n
    return max_peso


def crear_serie(alumno_id: str, gimnasio_id: str, payload: dict) -> dict:
    fecha_iso = datetime.now(timezone.utc).isoformat()

    payload = dict(payload)
    catalogo_id = payload.get("ejercicio_catalogo_id")
    recursos = []
    if catalogo_id:
        elegido = catalogo_services.obtener_ejercicio(catalogo_id, gimnasio_id)
        modalidad = "cardio" if elegido["categoria"] == "cardio" else "fuerza"
        if payload["modalidad"] != modalidad:
            raise AuthError(400, "InvalidEjercicio", "El tipo de registro no coincide con el ejercicio.")
        disponibles = {r["id"]: r for r in elegido["recursos"]}
        ids = payload["recurso_ids"]
        if not set(ids) <= disponibles.keys():
            raise AuthError(400, "InvalidRecurso", "Selecciona recursos asociados al ejercicio de tu gimnasio.")
        recursos = [disponibles[id] for id in ids]
        if elegido["categoria"] == "maquina" and not any(r["tipo"] == "maquina" for r in recursos):
            raise AuthError(400, "InvalidRecurso", "Selecciona la máquina utilizada para este ejercicio.")
        origen = elegido.get("maquina_origen_id")
        payload.update(ejercicio_tipo="maquina" if origen else "libre", maquina_id=origen,
                       nombre_libre=None if origen else elegido["nombre"])
    elif payload["ejercicio_tipo"] == "maquina" and not _maquinas_repo.find_by_id(payload["maquina_id"], gimnasio_id):
        raise AuthError(400, "InvalidMaquina", "La máquina no existe en tu gimnasio.")
    if payload.get("rutina_id"):
        rutina = rutinas_services._rutinas_repo.find_by_id(payload["rutina_id"])
        if not rutina or rutina.alumno_id != alumno_id or rutina.gimnasio_id != gimnasio_id or rutina.es_publica:
            raise AuthError(404, "NotFound", "La rutina no está disponible para este usuario.")
        if catalogo_id and not any(e.ejercicio_catalogo_id == catalogo_id for e in rutina.ejercicios):
            raise AuthError(400, "InvalidEjercicio", "El ejercicio no pertenece a esa rutina.")

    numero_serie = payload.get("numero_serie")
    if numero_serie is None:
        ejercicio_key = ("catalogo:" + catalogo_id) if catalogo_id else (payload.get("maquina_id") or payload.get("nombre_libre") or "")
        fecha_dia = fecha_iso[:10]
        numero_serie = _progreso_repo.siguiente_numero_serie(alumno_id, ejercicio_key, fecha_dia)

    registro = RegistroSerie(
        id="",
        alumno_id=alumno_id,
        fecha=fecha_iso,
        ejercicio_tipo=payload["ejercicio_tipo"],
        numero_serie=numero_serie,
        peso=payload["peso"],
        repeticiones=payload["repeticiones"],
        gimnasio_id=gimnasio_id,
        maquina_id=payload.get("maquina_id"),
        nombre_libre=payload.get("nombre_libre"),
        rutina_id=payload.get("rutina_id"),
        ejercicio_catalogo_id=catalogo_id,
        recursos=recursos,
        **{k: payload[k] for k in METRICAS if k in payload},
    )

    try:
        creado = _progreso_repo.crear(registro)
    except Exception as exc:
        if getattr(exc, "code", None) in ("22023", "23514", "23503"):
            raise AuthError(400, "InvalidEntrenamiento", "Revisa el ejercicio, la rutina y los recursos seleccionados.") from exc
        raise
    return creado.to_dict()


METRICAS = ("modalidad", "peso_valor", "peso_unidad", "peso_kg", "repeticiones_valor", "duracion_segundos", "distancia_metros")


def actualizar_serie(alumno_id: str, registro_id: str, payload: dict) -> dict:
    registro = _progreso_repo.find_by_id(registro_id)
    if not registro or registro.alumno_id != alumno_id:
        raise AuthError(404, "NotFound", f"No existe un registro con id '{registro_id}'.")
    if payload.get("modalidad", "fuerza") != registro.modalidad:
        raise AuthError(400, "InvalidPayload", "La edición debe conservar el tipo de entrenamiento.")
    metricas = {k: payload[k] for k in METRICAS if k in payload}
    if "modalidad" not in payload:
        # Una edición desde un cliente antiguo no debe dejar métricas anteriores desactualizadas.
        metricas.update(peso_valor=None, peso_unidad=None, peso_kg=_peso_numerico(payload["peso"]),
                        repeticiones_valor=int(payload["repeticiones"]) if payload["repeticiones"].isdigit() and len(payload["repeticiones"]) <= 4 else None)
    actualizado = _progreso_repo.actualizar(
        registro_id=registro_id, alumno_id=alumno_id, peso=payload["peso"],
        repeticiones=payload["repeticiones"], **metricas,
    )
    if not actualizado:
        raise AuthError(404, "NotFound", f"No existe un registro con id '{registro_id}'.")
    return actualizado.to_dict()


def listar_historial(alumno_id: str) -> List[dict]:
    registros = _progreso_repo.listar_por_alumno(alumno_id)
    catalogo = {}
    for gym in {r.gimnasio_id for r in registros if r.ejercicio_catalogo_id}:
        ids = {r.ejercicio_catalogo_id for r in registros if r.gimnasio_id == gym and r.ejercicio_catalogo_id}
        catalogo.update({e["id"]: e for e in catalogo_services._repo.ejercicios_por_ids(ids, gym)})

    grupos: Dict[tuple, List[RegistroSerie]] = defaultdict(list)
    for r in registros:
        key = _key_de_registro(r)
        fecha_dia = r.fecha[:10]
        grupos[(key, fecha_dia, r.modalidad)].append(r)

    filas = []
    for (key, fecha_dia, modalidad), series in grupos.items():
        prim = series[0]
        peso_max = _peso_max_numerico(series)
        filas.append({
            "ejercicio": _nombre_visible(prim, catalogo),
            "ejercicio_key": key,
            "ejercicio_catalogo_id": prim.ejercicio_catalogo_id,
            "modalidad": modalidad,
            "duracion_segundos": sum(r.duracion_segundos or 0 for r in series) or None,
            "distancia_metros": sum(r.distancia_metros or 0 for r in series) or None,
            "ejercicio_tipo": prim.ejercicio_tipo,
            "maquina_id": prim.maquina_id,
            "nombre_libre": prim.nombre_libre,
            "fecha": min(s.fecha for s in series),
            "cantidad_series": len(series),
            "peso_max": peso_max if peso_max > 0 else None,
            "rutina_id": prim.rutina_id,
        })

    filas.sort(key=lambda f: f["fecha"], reverse=True)
    return filas


def obtener_evolucion(alumno_id: str, ejercicio_key: str) -> dict:
    registros = _progreso_repo.listar_por_ejercicio(alumno_id, ejercicio_key)
    if not registros:
        return {
            "ejercicio": ejercicio_key,
            "ejercicio_tipo": None,
            "maquina_id": None,
            "nombre_libre": None,
            "puntos": [],
            "pr_historico": None,
        }

    prim = max(registros, key=lambda r: r.fecha)
    nombre = _nombre_visible(prim)
    registros = [r for r in registros if r.modalidad == prim.modalidad]

    por_dia: Dict[str, List[RegistroSerie]] = defaultdict(list)
    for r in registros:
        por_dia[r.fecha[:10]].append(r)

    puntos = []
    for dia in sorted(por_dia.keys()):
        series = por_dia[dia]
        peso_max = _peso_max_numerico(series)
        if peso_max <= 0 and prim.modalidad != "cardio":
            continue
        puntos.append({
            "fecha": dia,
            "peso_max": peso_max,
            "duracion_segundos": sum(s.duracion_segundos or 0 for s in series) or None,
            "distancia_metros": sum(s.distancia_metros or 0 for s in series) or None,
            "cantidad_series": len(series),
        })

    pr_historico = _peso_max_numerico(registros)

    return {
        "ejercicio": nombre,
        "ejercicio_key": ejercicio_key,
        "ejercicio_catalogo_id": prim.ejercicio_catalogo_id,
        "modalidad": prim.modalidad,
        "ejercicio_tipo": prim.ejercicio_tipo,
        "maquina_id": prim.maquina_id,
        "nombre_libre": prim.nombre_libre,
        "puntos": puntos,
        "pr_historico": pr_historico if pr_historico > 0 else None,
    }


def obtener_sesion(alumno_id: str, ejercicio_key: str, fecha_dia: str) -> dict:
    series = _progreso_repo.listar_sesion(alumno_id, ejercicio_key, fecha_dia)
    if not series:
        raise AuthError(
            404,
            "NotFound",
            "No existe una sesión con esos datos para este usuario.",
        )

    prim = series[0]
    nombre = _nombre_visible(prim)

    return {
        "ejercicio": nombre,
        "ejercicio_key": ejercicio_key,
        "ejercicio_catalogo_id": prim.ejercicio_catalogo_id,
        "modalidad": prim.modalidad,
        "ejercicio_tipo": prim.ejercicio_tipo,
        "maquina_id": prim.maquina_id,
        "nombre_libre": prim.nombre_libre,
        "fecha": fecha_dia,
        "series": [
            {
                "id": s.id,
                "numero_serie": s.numero_serie,
                "peso": s.peso,
                "repeticiones": s.repeticiones,
                **{k: getattr(s, k) for k in METRICAS},
                "recursos": s.recursos,
            }
            for s in series
        ],
    }
