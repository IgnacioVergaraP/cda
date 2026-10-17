"""Validación del módulo profesor."""
from app.errors import AuthError
from uuid import UUID
from math import isfinite


TIPOS_REPORTE = ("rota", "desgastada", "falta_accesorio", "limpieza", "otro")
PRIORIDADES_REPORTE = ("baja", "media", "alta", "urgente")
OBJETIVOS_RUTINA = ("hipertrofia", "fuerza", "resistencia", "perder_grasa", "mantenimiento", "otro")


def validar_crear_solicitud_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    if "categoria" in data or "recurso_ids" in data:
        from app.blueprints.ejercicios.schemas import ejercicio
        datos, ids = ejercicio(data)
        if not 3 <= len(datos["nombre"]) <= 80 or not 10 <= len(datos["descripcion"]) <= 1000:
            raise AuthError(400, "InvalidPayload", "Revisa el nombre (3–80 caracteres) y la descripción (10–1000).")
        if datos["categoria"] != "cardio" and not datos["grupos_musculares"]:
            raise AuthError(400, "InvalidGrupos", "Selecciona al menos un grupo muscular.")
        return {**datos, "recurso_ids": ids}
    nombre = data.get("nombre")
    if not isinstance(nombre, str) or not nombre.strip():
        raise AuthError(400, "InvalidPayload", "'nombre' es obligatorio.")
    nombre = nombre.strip()
    if len(nombre) < 3 or len(nombre) > 80:
        raise AuthError(400, "InvalidNombre", "El nombre debe tener entre 3 y 80 caracteres.")

    grupos = data.get("grupos_musculares")
    if not isinstance(grupos, list) or len(grupos) == 0:
        raise AuthError(400, "InvalidPayload", "'grupos_musculares' debe ser una lista no vacía.")
    if len(grupos) > 8:
        raise AuthError(400, "InvalidGrupos", "Máximo 8 grupos musculares.")
    limpios = []
    for g in grupos:
        if not isinstance(g, str):
            raise AuthError(400, "InvalidGrupos", "Cada grupo muscular debe ser texto.")
        g = g.strip().lower()
        if not g or len(g) > 40:
            raise AuthError(400, "InvalidGrupos", "Cada grupo muscular debe tener entre 1 y 40 caracteres.")
        limpios.append(g)

    descripcion = data.get("descripcion")
    if not isinstance(descripcion, str) or not descripcion.strip():
        raise AuthError(400, "InvalidPayload", "'descripcion' es obligatoria.")
    descripcion = descripcion.strip()
    if len(descripcion) < 10 or len(descripcion) > 1000:
        raise AuthError(400, "InvalidDescripcion", "La descripción debe tener entre 10 y 1000 caracteres.")

    video_url = data.get("video_url", "")
    if not isinstance(video_url, str):
        raise AuthError(400, "InvalidPayload", "'video_url' debe ser texto.")
    video_url = video_url.strip()
    if video_url and not (video_url.startswith("http://") or video_url.startswith("https://")):
        raise AuthError(400, "InvalidVideoUrl", "La URL de video debe empezar con http:// o https://.")
    if len(video_url) > 500:
        raise AuthError(400, "InvalidVideoUrl", "La URL de video es demasiado larga.")

    imagen_url = data.get("imagen_url", "")
    if not isinstance(imagen_url, str):
        raise AuthError(400, "InvalidPayload", "'imagen_url' debe ser texto.")
    imagen_url = imagen_url.strip()
    if imagen_url and not (imagen_url.startswith("http://") or imagen_url.startswith("https://")):
        raise AuthError(400, "InvalidImagenUrl", "La URL de imagen debe empezar con http:// o https://.")
    if len(imagen_url) > 500:
        raise AuthError(400, "InvalidImagenUrl", "La URL de imagen es demasiado larga.")

    return {
        "nombre": nombre,
        "grupos_musculares": limpios,
        "descripcion": descripcion,
        "video_url": video_url,
        "imagen_url": imagen_url,
    }


def validar_rechazo_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    motivo = data.get("motivo")
    if not isinstance(motivo, str) or not motivo.strip():
        raise AuthError(400, "InvalidPayload", "'motivo' es obligatorio para rechazar.")
    motivo = motivo.strip()
    if len(motivo) < 5 or len(motivo) > 500:
        raise AuthError(400, "InvalidMotivo", "El motivo debe tener entre 5 y 500 caracteres.")
    return {"motivo": motivo}


def validar_crear_reporte_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    tipo = data.get("tipo")
    if tipo not in TIPOS_REPORTE:
        raise AuthError(400, "InvalidTipo", f"'tipo' debe ser uno de: {', '.join(TIPOS_REPORTE)}.")
    prioridad = data.get("prioridad", "media")
    if prioridad not in PRIORIDADES_REPORTE:
        raise AuthError(400, "InvalidPrioridad", f"'prioridad' debe ser una de: {', '.join(PRIORIDADES_REPORTE)}.")
    descripcion = data.get("descripcion")
    if not isinstance(descripcion, str) or not descripcion.strip():
        raise AuthError(400, "InvalidPayload", "'descripcion' es obligatoria.")
    descripcion = descripcion.strip()
    if len(descripcion) < 10 or len(descripcion) > 1000:
        raise AuthError(400, "InvalidDescripcion", "La descripción debe tener entre 10 y 1000 caracteres.")
    maquina_id = data.get("maquina_id")
    if maquina_id is not None:
        if not isinstance(maquina_id, str) or not maquina_id.strip():
            raise AuthError(400, "InvalidPayload", "'maquina_id' debe ser texto o null.")
        maquina_id = maquina_id.strip()
    foto_url = data.get("foto_url")
    if foto_url is not None:
        if not isinstance(foto_url, str):
            raise AuthError(400, "InvalidPayload", "'foto_url' debe ser texto o null.")
        foto_url = foto_url.strip() or None
        if foto_url and len(foto_url) > 500:
            raise AuthError(400, "InvalidFoto", "La URL de foto es demasiado larga.")
    return {
        "tipo": tipo,
        "prioridad": prioridad,
        "descripcion": descripcion,
        "maquina_id": maquina_id,
        "foto_url": foto_url,
    }


def validar_resolver_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    resolucion = data.get("resolucion")
    if resolucion is not None:
        if not isinstance(resolucion, str):
            raise AuthError(400, "InvalidPayload", "'resolucion' debe ser texto o null.")
        resolucion = resolucion.strip() or None
        if resolucion and len(resolucion) > 500:
            raise AuthError(400, "InvalidResolucion", "La resolución no puede superar los 500 caracteres.")
    return {"resolucion": resolucion}


def validar_crear_solicitud_rutina_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    objetivo = data.get("objetivo")
    if objetivo not in OBJETIVOS_RUTINA:
        raise AuthError(400, "InvalidObjetivo", f"'objetivo' debe ser uno de: {', '.join(OBJETIVOS_RUTINA)}.")
    dias = data.get("dias_por_semana")
    if not isinstance(dias, int) or dias < 1 or dias > 7:
        raise AuthError(400, "InvalidDias", "'dias_por_semana' debe ser un entero entre 1 y 7.")
    comentarios = data.get("comentarios")
    if comentarios is not None:
        if not isinstance(comentarios, str):
            raise AuthError(400, "InvalidPayload", "'comentarios' debe ser texto o null.")
        comentarios = comentarios.strip() or None
        if comentarios and len(comentarios) > 500:
            raise AuthError(400, "InvalidComentarios", "Los comentarios no pueden superar los 500 caracteres.")
    grupos = data.get("grupos_interes")
    grupos_limpios = []
    if grupos is not None:
        if not isinstance(grupos, list):
            raise AuthError(400, "InvalidPayload", "'grupos_interes' debe ser una lista o null.")
        if len(grupos) > 6:
            raise AuthError(400, "InvalidGrupos", "Máximo 6 grupos de interés.")
        for g in grupos:
            if not isinstance(g, str):
                raise AuthError(400, "InvalidGrupos", "Cada grupo debe ser texto.")
            g = g.strip().lower()
            if g and len(g) <= 40:
                grupos_limpios.append(g)
    profesor_id = data.get("profesor_preferido_id")
    if profesor_id is not None:
        if not isinstance(profesor_id, str) or not profesor_id.strip():
            raise AuthError(400, "InvalidPayload", "'profesor_preferido_id' debe ser texto o null.")
        profesor_id = profesor_id.strip()
    return {
        "objetivo": objetivo,
        "dias_por_semana": dias,
        "comentarios": comentarios,
        "grupos_interes": grupos_limpios or None,
        "profesor_preferido_id": profesor_id,
    }


def validar_resolver_solicitud_rutina_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    mensaje = data.get("mensaje_resolucion")
    if not isinstance(mensaje, str) or not mensaje.strip():
        raise AuthError(400, "InvalidPayload", "'mensaje_resolucion' es obligatorio al resolver.")
    mensaje = mensaje.strip()
    if len(mensaje) < 5 or len(mensaje) > 500:
        raise AuthError(400, "InvalidMensaje", "El mensaje debe tener entre 5 y 500 caracteres.")
    rutina_id = data.get("rutina_id")
    if rutina_id is not None:
        if not isinstance(rutina_id, str) or not rutina_id.strip():
            raise AuthError(400, "InvalidPayload", "'rutina_id' debe ser texto o null.")
        rutina_id = rutina_id.strip()
    return {"mensaje_resolucion": mensaje, "rutina_id": rutina_id}


# -------- NUEVO: validaciones del builder de rutinas --------

def _validar_ejercicio(e: dict, index: int) -> dict:
    if not isinstance(e, dict):
        raise AuthError(400, "InvalidEjercicio", f"El ejercicio #{index+1} no es un objeto.")

    tipo = e.get("tipo")
    catalogo_id = e.get("ejercicio_catalogo_id")
    if catalogo_id is not None:
        try:
            catalogo_id = str(UUID(catalogo_id))
        except (ValueError, TypeError, AttributeError):
            raise AuthError(400, "InvalidEjercicio", "El identificador del ejercicio del catálogo no es válido.")
    if tipo not in ("maquina", "libre") and not catalogo_id:
        raise AuthError(400, "InvalidEjercicio", f"El ejercicio #{index+1} tiene tipo inválido.")

    cardio = e.get("prescripcion_cardio")
    if cardio is not None:
        if not catalogo_id or not isinstance(cardio, dict):
            raise AuthError(400, "InvalidEjercicio", "La prescripción de cardio requiere un ejercicio del catálogo.")
        intensidad = cardio.get("intensidad")
        if intensidad is not None and (not isinstance(intensidad, str) or len(intensidad.strip()) > 100):
            raise AuthError(400, "InvalidEjercicio", "La intensidad admite hasta 100 caracteres.")
        cardio = {"intensidad": (intensidad.strip() or None) if intensidad is not None else None}
        for campo, maximo in (("duracion_minutos", 10080), ("distancia_km", 1000)):
            valor = e["prescripcion_cardio"].get(campo)
            if valor is not None and (type(valor) not in (int, float) or not isfinite(valor) or not 0 < valor <= maximo):
                raise AuthError(400, "InvalidEjercicio", f"'{campo}' debe ser positivo y no superar {maximo}.")
            cardio[campo] = valor

    series = 1 if cardio is not None else e.get("series")
    if not isinstance(series, int) or series < 1 or series > 20:
        raise AuthError(400, "InvalidEjercicio", f"El ejercicio #{index+1} debe tener entre 1 y 20 series.")

    reps = "" if cardio is not None else e.get("repeticiones")
    if not isinstance(reps, str) or (cardio is None and not reps.strip()):
        raise AuthError(400, "InvalidEjercicio", f"El ejercicio #{index+1} debe tener repeticiones.")
    reps = reps.strip()
    if len(reps) > 30:
        raise AuthError(400, "InvalidEjercicio", f"Las repeticiones del ejercicio #{index+1} son demasiado largas.")

    peso = "" if cardio is not None else e.get("peso_sugerido")
    if not isinstance(peso, str) or (cardio is None and not peso.strip()):
        raise AuthError(400, "InvalidEjercicio", f"El peso sugerido del ejercicio #{index+1} es obligatorio.")
    peso = peso.strip()
    if len(peso) > 40:
        raise AuthError(400, "InvalidEjercicio", f"El peso sugerido del ejercicio #{index+1} es demasiado largo.")

    out = {
        "id": e.get("id") or f"ej-{index+1}",
        "tipo": tipo if tipo in ("maquina", "libre") else "libre",
        "series": series,
        "repeticiones": reps,
        "peso_sugerido": peso,
        "prescripcion_cardio": cardio,
    }

    if catalogo_id:
        # La identidad, el nombre y el tipo de compatibilidad se resuelven en el servidor.
        out["ejercicio_catalogo_id"] = catalogo_id
        return out

    if tipo == "maquina":
        maquina_id = e.get("maquina_id")
        if not isinstance(maquina_id, str) or not maquina_id.strip():
            raise AuthError(400, "InvalidEjercicio", f"El ejercicio #{index+1} no tiene máquina seleccionada.")
        out["maquina_id"] = maquina_id.strip()
    else:
        nombre = e.get("nombre")
        if not isinstance(nombre, str) or not nombre.strip():
            raise AuthError(400, "InvalidEjercicio", f"El ejercicio libre #{index+1} no tiene nombre.")
        nombre = nombre.strip()
        if len(nombre) > 80:
            raise AuthError(400, "InvalidEjercicio", f"El nombre del ejercicio #{index+1} es demasiado largo.")
        out["nombre"] = nombre
        desc = e.get("descripcion")
        if desc is not None:
            if not isinstance(desc, str):
                raise AuthError(400, "InvalidEjercicio", f"La descripción del ejercicio #{index+1} debe ser texto.")
            desc = desc.strip() or None
            if desc and len(desc) > 500:
                raise AuthError(400, "InvalidEjercicio", f"La descripción del ejercicio #{index+1} es demasiado larga.")
            out["descripcion"] = desc
        else:
            out["descripcion"] = None

    return out


def validar_crear_rutina_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")

    alumno_id = data.get("alumno_id")
    if not isinstance(alumno_id, str) or not alumno_id.strip():
        raise AuthError(400, "InvalidPayload", "'alumno_id' es obligatorio.")
    alumno_id = alumno_id.strip()

    titulo = data.get("titulo")
    if not isinstance(titulo, str) or not titulo.strip():
        raise AuthError(400, "InvalidPayload", "'titulo' es obligatorio.")
    titulo = titulo.strip()
    if len(titulo) < 3 or len(titulo) > 80:
        raise AuthError(400, "InvalidTitulo", "El título debe tener entre 3 y 80 caracteres.")

    grupos = data.get("grupos_musculares", [])
    if not isinstance(grupos, list):
        raise AuthError(400, "InvalidPayload", "'grupos_musculares' debe ser una lista.")
    if len(grupos) > 8:
        raise AuthError(400, "InvalidGrupos", "Máximo 8 grupos musculares.")
    grupos_limpios = []
    for g in grupos:
        if not isinstance(g, str):
            raise AuthError(400, "InvalidGrupos", "Cada grupo muscular debe ser texto.")
        g = g.strip().lower()
        if g and len(g) <= 40:
            grupos_limpios.append(g)

    ejercicios = data.get("ejercicios")
    if not isinstance(ejercicios, list) or len(ejercicios) == 0:
        raise AuthError(400, "InvalidPayload", "La rutina debe tener al menos un ejercicio.")
    if len(ejercicios) > 30:
        raise AuthError(400, "InvalidPayload", "Máximo 30 ejercicios por rutina.")

    ejercicios_validados = [_validar_ejercicio(e, i) for i, e in enumerate(ejercicios)]

    return {
        "alumno_id": alumno_id,
        "titulo": titulo,
        "grupos_musculares": grupos_limpios,
        "ejercicios": ejercicios_validados,
    }


def validar_editar_rutina_payload(data: dict) -> dict:
    # Mismo shape que crear pero sin alumno_id (no se puede cambiar el destinatario)
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")

    titulo = data.get("titulo")
    if not isinstance(titulo, str) or not titulo.strip():
        raise AuthError(400, "InvalidPayload", "'titulo' es obligatorio.")
    titulo = titulo.strip()
    if len(titulo) < 3 or len(titulo) > 80:
        raise AuthError(400, "InvalidTitulo", "El título debe tener entre 3 y 80 caracteres.")

    grupos = data.get("grupos_musculares", [])
    if not isinstance(grupos, list):
        raise AuthError(400, "InvalidPayload", "'grupos_musculares' debe ser una lista.")
    if len(grupos) > 8:
        raise AuthError(400, "InvalidGrupos", "Máximo 8 grupos musculares.")
    grupos_limpios = []
    for g in grupos:
        if not isinstance(g, str):
            raise AuthError(400, "InvalidGrupos", "Cada grupo muscular debe ser texto.")
        g = g.strip().lower()
        if g and len(g) <= 40:
            grupos_limpios.append(g)

    ejercicios = data.get("ejercicios")
    if not isinstance(ejercicios, list) or len(ejercicios) == 0:
        raise AuthError(400, "InvalidPayload", "La rutina debe tener al menos un ejercicio.")
    if len(ejercicios) > 30:
        raise AuthError(400, "InvalidPayload", "Máximo 30 ejercicios por rutina.")

    ejercicios_validados = [_validar_ejercicio(e, i) for i, e in enumerate(ejercicios)]

    return {
        "titulo": titulo,
        "grupos_musculares": grupos_limpios,
        "ejercicios": ejercicios_validados,
    }


def validar_duplicar_rutina_payload(data: dict) -> dict:
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    nuevo_alumno_id = data.get("nuevo_alumno_id")
    if not isinstance(nuevo_alumno_id, str) or not nuevo_alumno_id.strip():
        raise AuthError(400, "InvalidPayload", "'nuevo_alumno_id' es obligatorio.")
    return {"nuevo_alumno_id": nuevo_alumno_id.strip()}


def validar_editar_datos_alumno_payload(data: dict) -> dict:
    """
    Edición de datos del alumno desde el panel del profesor.
    Permite: peso_actual, peso_objetivo, porcentaje_grasa, notas_profesor.
    """
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")

    out = {}

    if "peso_actual" in data:
        peso = data.get("peso_actual")
        if peso is not None:
            if not isinstance(peso, (int, float)):
                raise AuthError(400, "InvalidPayload", "'peso_actual' debe ser numérico o null.")
            if peso < 20 or peso > 300:
                raise AuthError(400, "InvalidPeso", "El peso debe estar entre 20 y 300 kg.")
            out["peso_actual"] = float(peso)

    if "peso_objetivo" in data:
        peso_obj = data.get("peso_objetivo")
        if peso_obj is not None:
            if not isinstance(peso_obj, (int, float)):
                raise AuthError(400, "InvalidPayload", "'peso_objetivo' debe ser numérico o null.")
            if peso_obj < 20 or peso_obj > 300:
                raise AuthError(400, "InvalidPesoObjetivo", "El peso objetivo debe estar entre 20 y 300 kg.")
            out["peso_objetivo"] = float(peso_obj)

    if "porcentaje_grasa" in data:
        pg = data.get("porcentaje_grasa")
        if pg is not None:
            if not isinstance(pg, (int, float)):
                raise AuthError(400, "InvalidPayload", "'porcentaje_grasa' debe ser numérico o null.")
            if pg < 3 or pg > 70:
                raise AuthError(400, "InvalidGrasa", "El porcentaje de grasa debe estar entre 3 y 70.")
            out["porcentaje_grasa"] = float(pg)

    if "notas_profesor" in data:
        notas = data.get("notas_profesor")
        if notas is not None:
            if not isinstance(notas, str):
                raise AuthError(400, "InvalidPayload", "'notas_profesor' debe ser texto o null.")
            notas = notas.strip() or None
            if notas and len(notas) > 1000:
                raise AuthError(400, "InvalidNotas", "Las notas no pueden superar los 1000 caracteres.")
            out["notas_profesor"] = notas

    if not out:
        raise AuthError(400, "EmptyPayload", "No se envió ningún campo para actualizar.")

    return out
