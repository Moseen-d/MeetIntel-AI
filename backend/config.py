import os
from pathlib import Path
from dotenv import load_dotenv

# Locate backend/.env or root .env
BACKEND_DIR = Path(__file__).resolve().parent
ROOT_DIR = BACKEND_DIR.parent

# Load environment files (backend/.env takes priority, then root .env)
load_dotenv(BACKEND_DIR / ".env")
load_dotenv(ROOT_DIR / ".env.local")
load_dotenv(ROOT_DIR / ".env")

class Settings:
    def __init__(self):
        # 1. Tavily API
        self.TAVILY_API_KEY: str = os.getenv("TAVILY_API_KEY", "").strip()

        # 2. Google Gemini API (accepts GEMINI_API_KEY or GOOGLE_API_KEY)
        self.GEMINI_API_KEY: str = (
            os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_API_KEY", "")
        ).strip()
        # Primary model (configurable via GEMINI_MODEL)
        self.GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()
        # Fallback model when primary model encounters 503/429/high demand
        self.GEMINI_FALLBACK_MODEL: str = os.getenv("GEMINI_FALLBACK_MODEL", "gemini-3.5-flash-lite").strip()
        # Maximum retry attempts per model for transient errors
        self.GEMINI_MAX_RETRIES: int = int(os.getenv("GEMINI_MAX_RETRIES", "3"))

        # Server settings
        self.HOST: str = os.getenv("HOST", "127.0.0.1").strip()
        self.PORT: int = int(os.getenv("PORT", "8000"))
        
        self.CORS_ORIGINS: list[str] = [
            origin.strip()
            for origin in os.getenv(
                "CORS_ORIGINS",
                "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001",
            ).split(",")
            if origin.strip()
        ]

    # Class-level defaults for backward compatibility
    TAVILY_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-3.5-flash"
    GEMINI_FALLBACK_MODEL: str = "gemini-3.5-flash-lite"
    GEMINI_MAX_RETRIES: int = 3
    HOST: str = "127.0.0.1"
    PORT: int = 8000
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    @property
    def has_tavily(self) -> bool:
        return bool(self.TAVILY_API_KEY)

    @property
    def has_gemini(self) -> bool:
        return bool(self.GEMINI_API_KEY)

settings = Settings()
