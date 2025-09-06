import os
from pathlib import Path


class BaseConfig:
    BASE_DIR = Path(__file__).resolve().parent
    SECRET_KEY = os.environ.get("SESSION_SECRET", "dev-secret-key-change-in-production")
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024
    UPLOAD_FOLDER = "/tmp"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Default SQLite in instance folder inside Toolchain
    INSTANCE_DIR = BASE_DIR / "instance"
    INSTANCE_DIR.mkdir(parents=True, exist_ok=True)
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        f"sqlite:///{(INSTANCE_DIR / 'markleaf.db').as_posix()}",
    )


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False


def get_config() -> type[BaseConfig]:
    env = os.environ.get("FLASK_ENV", "development").lower()
    if env == "production":
        return ProductionConfig
    return DevelopmentConfig

