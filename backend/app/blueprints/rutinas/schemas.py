"""Validación de publicaciones de rutinas y filtros de Explorar."""
from app.errors import AuthError
from app.blueprints.profesor.schemas import validar_editar_rutina_payload

DISCIPLINAS = {"musculacion", "tenis", "futbol", "basquetbol", "atletismo", "natacion", "otro"}
NIVELES = {"principiante", "intermedio", "avanzado"}


def validar_publicacion(data: dict) -> dict:
    payload = validar_editar_rutina_payload(data)
    for campo, opciones in (("disciplina", DISCIPLINAS), ("nivel", NIVELES)):
        valor = data.get(campo)
        if not isinstance(valor, str) or valor not in opciones:
            raise AuthError(400, "InvalidPayload", f"Selecciona un valor válido para '{campo}'.")
        payload[campo] = valor
    for campo, maximo in (("objetivo", 120), ("equipamiento", 250), ("descripcion", 1000)):
        valor = data.get(campo, "")
        if not isinstance(valor, str) or len(valor.strip()) > maximo:
            raise AuthError(400, "InvalidPayload", f"'{campo}' debe ser texto de hasta {maximo} caracteres.")
        if campo != "descripcion" and not valor.strip():
            raise AuthError(400, "InvalidPayload", f"'{campo}' es obligatorio.")
        payload[campo] = valor.strip()
    return payload


def validar_filtros(args) -> dict:
    disciplina = args.get("disciplina", "")
    nivel = args.get("nivel", "")
    buscar = args.get("buscar", "").strip()
    if (disciplina and disciplina not in DISCIPLINAS) or (nivel and nivel not in NIVELES):
        raise AuthError(400, "InvalidFilter", "Disciplina o nivel no válido.")
    try:
        desde = int(args.get("desde", "0"))
    except (TypeError, ValueError):
        raise AuthError(400, "InvalidFilter", "La posición de la página no es válida.")
    if desde < 0 or desde > 100000 or len(buscar) > 80:
        raise AuthError(400, "InvalidFilter", "Los filtros de búsqueda no son válidos.")
    return {"disciplina": disciplina, "nivel": nivel, "buscar": buscar, "desde": desde}
