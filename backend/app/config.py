import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Configuración base."""

    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-cambiar")

    # CORS
    # Orígenes del frontend de este cliente, separados por comas.
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "capacitor://localhost,"
            "http://localhost:4200,"
            "http://127.0.0.1:4200",
        ).split(",")
        if origin.strip()
    ]

    # -------- Supabase --------
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_JWKS_URL = f"{SUPABASE_URL}/auth/v1/.well-known/jwks.json" if SUPABASE_URL else ""
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET", "")
    SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY", "")

    JSON_SORT_KEYS = False


class DevelopmentConfig(Config):
    DEBUG = True
    ENV = "development"


class ProductionConfig(Config):
    DEBUG = False
    ENV = "production"


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    ENV = "testing"


CONFIG_MAP = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}


def get_config(name: str | None = None):
    name = name or os.getenv("FLASK_ENV", "development")
    return CONFIG_MAP.get(name, DevelopmentConfig)