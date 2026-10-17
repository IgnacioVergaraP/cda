from flask import Flask
from flask_cors import CORS

from app.config import get_config
from app.errors import register_error_handlers


def create_app(config_name: str | None = None) -> Flask:
    app = Flask(__name__)
    app.config.from_object(get_config(config_name))

    _register_extensions(app)
    _register_blueprints(app)
    register_error_handlers(app)

    return app


def _register_extensions(app: Flask) -> None:
    CORS(
        app,
        resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}},
        supports_credentials=True,
    )


def _register_blueprints(app: Flask) -> None:
    from app.blueprints.health import bp as health_bp
    from app.blueprints.auth import bp as auth_bp
    from app.blueprints.maquinas import bp as maquinas_bp
    from app.blueprints.ejercicios import bp as ejercicios_bp
    from app.blueprints.rutinas import bp as rutinas_bp
    from app.blueprints.progreso import bp as progreso_bp
    from app.blueprints.usuario import bp as usuario_bp
    from app.blueprints.profesor import bp as profesor_bp
    from app.blueprints.admin import bp as admin_bp
    from app.blueprints.gimnasio import bp as gimnasio_bp

    app.register_blueprint(health_bp, url_prefix="/api")
    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(maquinas_bp, url_prefix="/api/maquinas")
    app.register_blueprint(ejercicios_bp, url_prefix="/api")
    app.register_blueprint(rutinas_bp, url_prefix="/api/rutinas")
    app.register_blueprint(progreso_bp, url_prefix="/api/progreso")
    app.register_blueprint(usuario_bp, url_prefix="/api/usuario")
    app.register_blueprint(profesor_bp, url_prefix="/api/profesor")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(gimnasio_bp, url_prefix="/api/gimnasio")