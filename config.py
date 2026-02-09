"""
Configuration settings for Universal Logging System
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    APP_NAME: str = "Universal Logging System"
    APP_VERSION: str = "2.0"
    DEBUG: bool = True
    
    # Database Configuration
    DATABASE_URL: str = "sqlite:///./logging_system.db"
    # For PostgreSQL: DATABASE_URL: str = "postgresql://user:password@localhost/logging_db"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # API Key Settings
    API_KEY_PREFIX: str = "uls_"
    API_KEY_LENGTH: int = 32
    
    # Email Settings (for alerts)
    SMTP_SERVER: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SENDER_EMAIL: str = "noreply@logging-system.com"
    
    # Log Settings
    MAX_LOGS_PER_QUERY: int = 10000
    LOG_RETENTION_DAYS: int = 30
    
    # Real-time Settings
    WEBSOCKET_MAX_CONNECTIONS: int = 100
    WEBSOCKET_PING_INTERVAL: int = 30
    
    # Alert Settings
    ALERT_CHECK_INTERVAL_SECONDS: int = 60
    ALERT_COOLDOWN_MINUTES: int = 5
    
    # CORS Settings
    CORS_ORIGINS: list = ["http://localhost:8000", "http://localhost:3000", "http://127.0.0.1:8000"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    """Get cached settings instance"""
    return Settings()
