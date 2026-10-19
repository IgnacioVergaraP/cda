from flask import Blueprint
from app.utils.responses import ok

bp = Blueprint("health", __name__)


@bp.get("/health")
def healthcheck():
    """Endpoint de liveness. Sin dependencias externas."""
    return ok({"status": "ok", "service": "cda-api"})