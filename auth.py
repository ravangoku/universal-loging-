"""
Authentication utilities for Universal Logging System
JWT token generation, validation, and password hashing
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthCredentials
import secrets
import string
from config import get_settings

settings = get_settings()

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer security
security = HTTPBearer()

class AuthenticationError(HTTPException):
    """Custom authentication error"""
    def __init__(self, detail: str = "Invalid credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(
    data: Dict[str, Any],
    expires_delta: Optional[timedelta] = None
) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def create_refresh_token(data: Dict[str, Any]) -> str:
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    
    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )
    return encoded_jwt

def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        raise AuthenticationError("Invalid token")

def generate_api_key(service_name: str) -> str:
    """Generate a secure API key"""
    # Format: uls_<random_32_chars>
    random_part = ''.join(
        secrets.choice(string.ascii_letters + string.digits)
        for _ in range(settings.API_KEY_LENGTH)
    )
    return f"{settings.API_KEY_PREFIX}{random_part}"

def validate_api_key_format(key: str) -> bool:
    """Validate API key format"""
    if not key.startswith(settings.API_KEY_PREFIX):
        return False
    if len(key) != len(settings.API_KEY_PREFIX) + settings.API_KEY_LENGTH:
        return False
    return True

class TokenPayload:
    """Token payload structure"""
    def __init__(self, user_id: int, username: str, role: str):
        self.user_id = user_id
        self.username = username
        self.role = role
        self.exp = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

def get_token_payload(credentials: HTTPAuthCredentials) -> Dict[str, Any]:
    """Extract and verify token payload from credentials"""
    token = credentials.credentials
    try:
        payload = verify_token(token)
        username: str = payload.get("sub")
        if username is None:
            raise AuthenticationError("Invalid token: no username")
        return payload
    except JWTError:
        raise AuthenticationError("Invalid token")

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)) -> Dict[str, Any]:
    """Get current authenticated user"""
    return get_token_payload(credentials)

async def get_current_admin(
    current_user: Dict[str, Any] = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current admin user"""
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can access this resource"
        )
    return current_user

async def verify_api_key(api_key: str) -> Dict[str, Any]:
    """Verify API key and return service info"""
    if not validate_api_key_format(api_key):
        raise AuthenticationError("Invalid API key format")
    
    # This will be implemented in the main app to query database
    # Returns: {"service_name": str, "user_id": int}
    return {"api_key": api_key}
