"""
Fixtures compartidas para todos los tests.
"""
import pytest

from app import create_app


# ============================================================
# Fixtures base
# ============================================================

@pytest.fixture
def app():
    app = create_app("testing")
    yield app


@pytest.fixture
def client(app):
    return app.test_client()


# ============================================================
# MockAuth
# ============================================================

class MockAuth:

    _USUARIOS = {
        "alumno":    {"id": "u-alu-001", "email": "alumno@gimnasio.com",    "rol": "alumno"},
        "profesor":  {"id": "u-pro-001", "email": "profesor@gimnasio.com",  "rol": "profesor"},
        "admin":     {"id": "u-gim-001", "email": "admin@gimnasio.com",     "rol": "gimnasio"},
    }

    def __init__(self, monkeypatch):
        self._monkeypatch = monkeypatch
        self._activar()

    def _activar(self):
        from app.utils.security import decorators
        from app.repositories.mock_usuarios import MockUsuariosRepository
        from app.repositories.mock_maquinas import MockMaquinasRepository
        from app.repositories.mock_rutinas import MockRutinasRepository
        from app.repositories.mock_progreso import MockProgresoRepository
        from app.repositories.mock_solicitudes import MockSolicitudesRepository
        from app.repositories.mock_reportes import MockReportesRepository
        from app.repositories.mock_solicitudes_rutina import MockSolicitudesRutinaRepository
        from app.repositories.mock_horarios import MockHorariosRepository
        from app.repositories.mock_mantenimientos import MockMantenimientosRepository

        mock_usuarios = MockUsuariosRepository()
        mock_maquinas = MockMaquinasRepository()
        mock_rutinas = MockRutinasRepository()
        mock_progreso = MockProgresoRepository()
        mock_solicitudes = MockSolicitudesRepository()
        mock_reportes = MockReportesRepository()
        mock_solicitudes_rutina = MockSolicitudesRutinaRepository()
        mock_horarios = MockHorariosRepository()
        mock_mantenimientos = MockMantenimientosRepository()

        # Decoradores
        self._monkeypatch.setattr(decorators, "_get_repo", lambda: mock_usuarios)

        # Imports de todos los services
        from app.blueprints.usuario import services as usuario_services
        from app.blueprints.profesor import services as profesor_services
        from app.blueprints.admin import services as admin_services
        from app.blueprints.maquinas import services as maquinas_services
        from app.blueprints.rutinas import services as rutinas_services
        from app.blueprints.progreso import services as progreso_services

        # usuario
        self._monkeypatch.setattr(usuario_services, "_usuarios_repo", mock_usuarios)
        self._monkeypatch.setattr(usuario_services, "_rutinas_repo", mock_rutinas)
        self._monkeypatch.setattr(usuario_services, "_progreso_repo", mock_progreso)

        # profesor
        self._monkeypatch.setattr(profesor_services, "_usuarios_repo", mock_usuarios)
        self._monkeypatch.setattr(profesor_services, "_maquinas_repo", mock_maquinas)
        self._monkeypatch.setattr(profesor_services, "_progreso_repo", mock_progreso)
        self._monkeypatch.setattr(profesor_services, "_solicitudes_repo", mock_solicitudes)
        self._monkeypatch.setattr(profesor_services, "_reportes_repo", mock_reportes)
        self._monkeypatch.setattr(profesor_services, "_solicitudes_rutina_repo", mock_solicitudes_rutina)
        if hasattr(profesor_services, "_rutinas_repo"):
            self._monkeypatch.setattr(profesor_services, "_rutinas_repo", mock_rutinas)

        # admin
        self._monkeypatch.setattr(admin_services, "_usuarios_repo", mock_usuarios)
        self._monkeypatch.setattr(admin_services, "_maquinas_repo", mock_maquinas)
        self._monkeypatch.setattr(admin_services, "_horarios_repo", mock_horarios)
        self._monkeypatch.setattr(admin_services, "_mantenimientos_repo", mock_mantenimientos)
        # admin usa `_progreso_repo` como FUNCIÓN
        self._monkeypatch.setattr(
            admin_services,
            "_progreso_repo",
            lambda: mock_progreso,
        )

        # maquinas
        self._monkeypatch.setattr(maquinas_services, "_repo", mock_maquinas)

        # rutinas
        self._monkeypatch.setattr(rutinas_services, "_rutinas_repo", mock_rutinas)
        self._monkeypatch.setattr(rutinas_services, "_maquinas_repo", mock_maquinas)

        # progreso
        self._monkeypatch.setattr(progreso_services, "_progreso_repo", mock_progreso)
        self._monkeypatch.setattr(progreso_services, "_maquinas_repo", mock_maquinas)

        # Payload falso
        self._payload_actual = self._payload_para("alumno")

        def _fake_decodificar(token):
            return self._payload_actual

        self._monkeypatch.setattr(decorators, "decodificar_token", _fake_decodificar)

    def _payload_para(self, clave: str) -> dict:
        u = self._USUARIOS[clave]
        return {
            "sub": u["id"],
            "email": u["email"],
            "app_metadata": {"rol": u["rol"]},
            "user_metadata": {"rol": u["rol"]},
        }

    def _headers_con_payload(self, payload: dict) -> dict:
        self._payload_actual = payload
        return {"Authorization": "Bearer fake-token-for-tests"}

    def as_alumno(self) -> dict:
        return self._headers_con_payload(self._payload_para("alumno"))

    def as_profesor(self) -> dict:
        return self._headers_con_payload(self._payload_para("profesor"))

    def as_admin(self) -> dict:
        return self._headers_con_payload(self._payload_para("admin"))

    def as_user(self, user_id: str) -> dict:
        from app.repositories.mock_usuarios import MockUsuariosRepository
        repo = MockUsuariosRepository()
        usuario = repo.find_by_id(user_id)
        if not usuario:
            raise ValueError(f"No existe un usuario con id '{user_id}' en el mock.")

        payload = {
            "sub": usuario.id,
            "email": usuario.email,
            "app_metadata": {"rol": usuario.rol},
            "user_metadata": {"rol": usuario.rol},
        }
        return self._headers_con_payload(payload)


@pytest.fixture
def mock_auth(monkeypatch):
    return MockAuth(monkeypatch)