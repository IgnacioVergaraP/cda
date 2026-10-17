"""Validación del módulo progreso."""
import re
import math
from uuid import UUID
from app.errors import AuthError


def validar_crear_serie_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")

    if "modalidad" in data or data.get("ejercicio_catalogo_id") is not None:
        out = validar_metricas(data)
        catalogo_id = data.get("ejercicio_catalogo_id")
        out["ejercicio_catalogo_id"] = _uuid(catalogo_id, "ejercicio_catalogo_id") if catalogo_id is not None else None
        rutina_id = data.get("rutina_id")
        if rutina_id is not None and (not isinstance(rutina_id, str) or not rutina_id.strip() or len(rutina_id) > 100):
            raise AuthError(400, "InvalidPayload", "La rutina no es válida.")
        out["rutina_id"] = rutina_id
        ids = data.get("recurso_ids", [])
        if catalogo_id is None:
            if out["modalidad"] == "cardio" or ids:
                raise AuthError(400, "InvalidPayload", "Selecciona un ejercicio del catálogo para registrar cardio o recursos.")
            tipo = data.get("ejercicio_tipo")
            campo = "maquina_id" if tipo == "maquina" else "nombre_libre"
            valor = data.get(campo)
            if tipo not in ("maquina", "libre") or not isinstance(valor, str) or not 1 <= len(valor.strip()) <= 100:
                raise AuthError(400, "InvalidPayload", "Selecciona o escribe un ejercicio válido.")
            out.update(ejercicio_tipo=tipo, maquina_id=valor.strip() if tipo == "maquina" else None,
                       nombre_libre=valor.strip() if tipo == "libre" else None)
            return out
        if not isinstance(ids, list) or not 1 <= len(ids) <= 30:
            raise AuthError(400, "InvalidPayload", "Selecciona entre 1 y 30 recursos utilizados.")
        out["recurso_ids"] = [_uuid(id, "recurso_ids") for id in ids]
        if len(set(out["recurso_ids"])) != len(ids):
            raise AuthError(400, "InvalidPayload", "Los recursos no deben repetirse.")
        return out

    ejercicio_tipo = data.get("ejercicio_tipo")
    if ejercicio_tipo not in ("maquina", "libre"):
        raise AuthError(
            400, "InvalidPayload",
            "'ejercicio_tipo' debe ser 'maquina' o 'libre'."
        )

    peso = data.get("peso")
    if not isinstance(peso, str) or not peso.strip():
        raise AuthError(400, "InvalidPayload", "'peso' es obligatorio y debe ser texto.")
    peso = peso.strip()

    repeticiones = data.get("repeticiones")
    if not isinstance(repeticiones, str) or not repeticiones.strip():
        raise AuthError(400, "InvalidPayload", "'repeticiones' es obligatorio y debe ser texto.")
    repeticiones = repeticiones.strip()

    maquina_id = data.get("maquina_id")
    nombre_libre = data.get("nombre_libre")

    if ejercicio_tipo == "maquina":
        if not isinstance(maquina_id, str) or not maquina_id.strip():
            raise AuthError(
                400, "InvalidPayload",
                "'maquina_id' es obligatorio cuando ejercicio_tipo = 'maquina'."
            )
        maquina_id = maquina_id.strip()
        nombre_libre = None
    else:
        if not isinstance(nombre_libre, str) or not nombre_libre.strip():
            raise AuthError(
                400, "InvalidPayload",
                "'nombre_libre' es obligatorio cuando ejercicio_tipo = 'libre'."
            )
        nombre_libre = nombre_libre.strip()
        maquina_id = None

    rutina_id = data.get("rutina_id")
    if rutina_id is not None and (not isinstance(rutina_id, str) or not rutina_id.strip()):
        raise AuthError(400, "InvalidPayload", "'rutina_id' debe ser texto o null.")
    rutina_id = rutina_id.strip() if isinstance(rutina_id, str) else None

    numero_serie = data.get("numero_serie")
    if numero_serie is not None:
        if not isinstance(numero_serie, int) or numero_serie < 1:
            raise AuthError(400, "InvalidPayload", "'numero_serie' debe ser un entero positivo.")

    return {
        "ejercicio_tipo": ejercicio_tipo,
        "peso": peso,
        "repeticiones": repeticiones,
        "maquina_id": maquina_id,
        "nombre_libre": nombre_libre,
        "rutina_id": rutina_id,
        "numero_serie": numero_serie,
    }


def validar_actualizar_serie_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")

    if "modalidad" in data:
        return validar_metricas(data)

    peso = data.get("peso")
    if not isinstance(peso, str) or not peso.strip():
        raise AuthError(400, "InvalidPayload", "'peso' es obligatorio y debe ser texto.")
    peso = peso.strip()

    repeticiones = data.get("repeticiones")
    if not isinstance(repeticiones, str) or not repeticiones.strip():
        raise AuthError(400, "InvalidPayload", "'repeticiones' es obligatorio y debe ser texto.")
    repeticiones = repeticiones.strip()

    return {"peso": peso, "repeticiones": repeticiones}


def validar_query_ejercicio(raw) -> str:
    if not isinstance(raw, str) or not raw.strip():
        raise AuthError(400, "InvalidQuery", "Falta el parámetro 'ejercicio'.")
    value = raw.strip()
    if len(value) > 120:
        raise AuthError(400, "InvalidQuery", "El parámetro 'ejercicio' es demasiado largo.")
    if value.startswith("catalogo:"):
        return "catalogo:" + _uuid(value[9:], "ejercicio")
    return value


def _uuid(value, campo):
    try:
        return str(UUID(value))
    except (TypeError, ValueError, AttributeError):
        raise AuthError(400, "InvalidPayload", f"'{campo}' debe contener un identificador válido.")


def _numero(data, campo, minimo, maximo, entero=False, opcional=False):
    value = data.get(campo)
    if value is None and opcional:
        return None
    if (isinstance(value, bool) or not isinstance(value, (int, float))
            or not minimo <= value <= maximo or not math.isfinite(value)
            or (entero and int(value) != value)):
        raise AuthError(400, "InvalidPayload", f"'{campo}' debe ser un número válido entre {minimo} y {maximo}.")
    return int(value) if entero else float(value)


def validar_metricas(data):
    modalidad = data.get("modalidad")
    if modalidad not in ("fuerza", "cardio"):
        raise AuthError(400, "InvalidPayload", "Selecciona fuerza o cardio.")
    out = dict(modalidad=modalidad, peso_valor=None, peso_unidad=None, peso_kg=None,
               repeticiones_valor=None, duracion_segundos=None, distancia_metros=None)
    if modalidad == "cardio":
        out["duracion_segundos"] = _numero(data, "duracion_segundos", 1, 604800, entero=True, opcional=True)
        out["distancia_metros"] = _numero(data, "distancia_metros", 0.01, 1000000, opcional=True)
        if out["duracion_segundos"] is None and out["distancia_metros"] is None:
            raise AuthError(400, "InvalidPayload", "Ingresa la duración o la distancia del entrenamiento.")
        if any(data.get(k) is not None for k in ("peso_valor", "peso_unidad", "repeticiones_valor")):
            raise AuthError(400, "InvalidPayload", "Cardio se registra con tiempo o distancia.")
        out.update(peso="No aplica", repeticiones="No aplica")
        return out
    if any(data.get(k) is not None for k in ("duracion_segundos", "distancia_metros")):
        raise AuthError(400, "InvalidPayload", "La duración y distancia corresponden a cardio.")
    unidad = data.get("peso_unidad")
    if unidad not in ("kg", "lb", "otro"):
        raise AuthError(400, "InvalidPayload", "Selecciona kg, lb u otro.")
    out["peso_unidad"] = unidad
    out["repeticiones_valor"] = _numero(data, "repeticiones_valor", 1, 10000, entero=True)
    out["repeticiones"] = str(out["repeticiones_valor"])
    if unidad == "otro":
        texto = data.get("peso_texto")
        if not isinstance(texto, str) or not 1 <= len(texto.strip()) <= 100:
            raise AuthError(400, "InvalidPayload", "Describe el peso o resistencia (máximo 100 caracteres).")
        out["peso"] = texto.strip()
    else:
        valor = _numero(data, "peso_valor", 0, 10000)
        out["peso_valor"] = valor
        out["peso_kg"] = round(valor * (0.45359237 if unidad == "lb" else 1), 6)
        out["peso"] = f"{valor:g} {unidad}"
    return out


def validar_query_fecha(raw) -> str:
    if not isinstance(raw, str) or not raw.strip():
        raise AuthError(400, "InvalidQuery", "Falta el parámetro 'fecha'.")
    value = raw.strip()
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", value):
        raise AuthError(400, "InvalidQuery", "El parámetro 'fecha' debe tener formato YYYY-MM-DD.")
    return value
