from urllib.parse import urlparse
from uuid import UUID

from app.errors import AuthError

CATEGORIAS = {"maquina", "libre", "cardio"}
TIPOS_RECURSO = {"maquina", "equipamiento", "infraestructura"}


def validar_id(raw):
    try:
        return str(UUID(raw))
    except (ValueError, TypeError, AttributeError):
        raise AuthError(400, "InvalidId", "El identificador no es válido.")


def _texto(data, campo, maximo, obligatorio=False):
    valor = data.get(campo, "")
    if not isinstance(valor, str) or len(valor.strip()) > maximo or (obligatorio and not valor.strip()):
        raise AuthError(400, "InvalidPayload", f"'{campo}' debe ser texto de hasta {maximo} caracteres.")
    return valor.strip()


def filtros(args, recursos=False):
    campo, opciones = ("tipo", TIPOS_RECURSO) if recursos else ("categoria", CATEGORIAS)
    valor = args.get(campo, "")
    if valor and valor not in opciones:
        raise AuthError(400, "InvalidFilter", f"'{campo}' no es válido.")
    buscar = args.get("buscar", "").strip()
    musculo = args.get("musculo", "").strip().lower()
    if len(buscar) > 80 or len(musculo) > 40:
        raise AuthError(400, "InvalidFilter", "La búsqueda o el grupo muscular no es válido.")
    try:
        desde = int(args.get("desde", "0"))
    except (TypeError, ValueError):
        raise AuthError(400, "InvalidFilter", "La página no es válida.")
    if desde < 0 or desde > 100000:
        raise AuthError(400, "InvalidFilter", "La página no es válida.")
    return {campo: valor, "buscar": buscar, "desde": desde, **({} if recursos else {"musculo": musculo})}


def recurso(data):
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    tipo = data.get("tipo")
    if not isinstance(tipo, str) or tipo not in TIPOS_RECURSO:
        raise AuthError(400, "InvalidPayload", "El tipo de recurso no es válido.")
    numero = data.get("numero_maquina")
    if numero is not None:
        if not isinstance(numero, str) or len(numero.strip()) > 30:
            raise AuthError(400, "InvalidPayload", "El número debe ser texto de hasta 30 caracteres.")
        numero = numero.strip() or None
    return {"nombre": _texto(data, "nombre", 100, True), "tipo": tipo,
            "numero_maquina": numero, "descripcion": _texto(data, "descripcion", 1000)}


def ejercicio(data):
    if not isinstance(data, dict):
        raise AuthError(400, "InvalidPayload", "Se esperaba un objeto JSON.")
    categoria = data.get("categoria")
    if not isinstance(categoria, str) or categoria not in CATEGORIAS:
        raise AuthError(400, "InvalidPayload", "La categoría no es válida.")
    grupos = data.get("grupos_musculares", [])
    if not isinstance(grupos, list) or len(grupos) > 8 or any(not isinstance(g, str) or not g.strip() or len(g.strip()) > 40 for g in grupos):
        raise AuthError(400, "InvalidPayload", "Los grupos musculares no son válidos.")
    ids = data.get("recurso_ids")
    if not isinstance(ids, list) or not 1 <= len(ids) <= 30:
        raise AuthError(400, "InvalidPayload", "Asocia entre 1 y 30 recursos al ejercicio.")
    ids = list(dict.fromkeys(validar_id(id) for id in ids))
    video = _texto(data, "video_url", 500)
    if video:
        url = urlparse(video)
        if (url.scheme != "https" or url.hostname not in ("www.youtube.com", "www.youtube-nocookie.com")
                or not url.path.startswith("/embed/") or url.username or url.password):
            raise AuthError(400, "InvalidPayload", "Usa un video de YouTube con formato https://www.youtube.com/embed/ID.")
    imagen = _texto(data, "imagen_url", 1000)
    if imagen and (urlparse(imagen).scheme != "https" or not urlparse(imagen).hostname):
        raise AuthError(400, "InvalidPayload", "La imagen debe tener una URL HTTPS válida.")
    return {"nombre": _texto(data, "nombre", 100, True), "categoria": categoria,
            "descripcion": _texto(data, "descripcion", 2000), "grupos_musculares": list(dict.fromkeys(g.strip().lower() for g in grupos)),
            "video_url": video, "imagen_url": imagen}, ids
