"""
Meridian ML Engine — Configuration
===================================
Reads environment variables with pydantic-settings.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    redis_url: str = "redis://localhost:6379"
    app_name: str = "Meridian ML Engine"
    debug: bool = False

    # Supabase (Phase 4 — RevOps Agent)
    supabase_url: str = ""
    supabase_anon_key: str = ""

    # Groq LLM (Phase 4 — RevOps Agent)
    groq_api_key: str = ""

    # Base prices in cents (matching Supabase products table)
    base_prices: dict[str, int] = {
        "prod_001": 249_900,   # Enterprise API Gateway
        "prod_002": 89_900,    # Standard Cloud Storage Node
        "prod_003": 1_299_900, # Dedicated GPU Cluster
        "prod_004": 179_900,   # Managed Kubernetes Orchestrator
        "prod_005": 349_900,   # Real-Time Analytics Pipeline
    }

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
