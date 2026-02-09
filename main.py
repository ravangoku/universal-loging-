"""
Universal Logging System - FastAPI Application
Production-grade logging platform with authentication, real-time streaming, and analytics
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from sqlalchemy import create_engine, desc, func, and_
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
import json
import csv
import io
from pathlib import Path
import logging

# Import project modules
from config import get_settings
from models import Base, User, LogEntry, ApiKey, AlertRule, Alert, LogExport, SystemMetric, LogLevel
from auth import (
    hash_password, verify_password, create_access_token, create_refresh_token,
    verify_token, generate_api_key, get_current_user, get_current_admin,
    AuthenticationError
)

# Configuration
settings = get_settings()

# Database setup
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables
Base.metadata.create_all(bind=engine)

# Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Centralized logging platform for distributed systems"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# WebSocket connection manager
class ConnectionManager:
    """Manage WebSocket connections for real-time log streaming"""
    def __init__(self):
        self.active_connections: List[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting message: {e}")

manager = ConnectionManager()

def get_db():
    """Database dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ============================================================================
# Pydantic Schemas
# ============================================================================

from pydantic import BaseModel, EmailStr

class LogEntryCreate(BaseModel):
    """Schema for creating log entries"""
    timestamp: Optional[datetime] = None
    service_name: str
    log_level: str
    message: str
    server_id: Optional[str] = None
    trace_id: Optional[str] = None
    request_id: Optional[str] = None
    user_id: Optional[str] = None
    error_code: Optional[str] = None
    stack_trace: Optional[str] = None
    metadata: Optional[str] = None
    response_time_ms: Optional[float] = None

class LogEntryResponse(BaseModel):
    """Schema for returning log entries"""
    id: int
    timestamp: datetime
    service_name: str
    log_level: str
    message: str
    server_id: Optional[str]
    trace_id: Optional[str]
    request_id: Optional[str]
    error_code: Optional[str]
    response_time_ms: Optional[float]
    
    class Config:
        from_attributes = True

class UserCreate(BaseModel):
    """Schema for creating users"""
    username: str
    email: EmailStr
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    """Schema for returning user info"""
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: str
    is_active: bool
    
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class LoginRequest(BaseModel):
    """Schema for login request"""
    username: str
    password: str

class ApiKeyResponse(BaseModel):
    """Schema for API key response"""
    key: str
    name: str
    service_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class AlertRuleCreate(BaseModel):
    """Schema for creating alert rules"""
    name: str
    description: Optional[str] = None
    service_name: Optional[str] = None
    log_level: str
    error_code: Optional[str] = None
    keyword_match: Optional[str] = None
    threshold: int = 1
    time_window_seconds: int = 60
    alert_type: str = "email"
    alert_target: str

class AlertRuleResponse(BaseModel):
    """Schema for returning alert rules"""
    id: int
    name: str
    service_name: Optional[str]
    log_level: str
    threshold: int
    alert_type: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class LogStatsResponse(BaseModel):
    """Schema for log statistics"""
    total_logs: int
    error_count: int
    warning_count: int
    info_count: int
    debug_count: int
    critical_count: int
    services: List[str]
    error_rate: float  # percentage
    avg_response_time_ms: Optional[float]

# ============================================================================
# Authentication Endpoints
# ============================================================================

@app.post("/api/v1/auth/register", response_model=TokenResponse)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    # Check if user exists
    existing_user = db.query(User).filter(
        (User.username == user_data.username) | (User.email == user_data.email)
    ).first()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists"
        )
    
    # Create new user
    hashed_password = hash_password(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_password,
        full_name=user_data.full_name,
        role="developer"  # Default role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Generate tokens
    access_token = create_access_token(
        data={"sub": db_user.username, "user_id": db_user.id, "role": db_user.role}
    )
    refresh_token = create_refresh_token(
        data={"sub": db_user.username, "user_id": db_user.id}
    )
    
    logger.info(f"New user registered: {user_data.username}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@app.post("/api/v1/auth/login", response_model=TokenResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    """Login user"""
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is disabled"
        )
    
    # Generate tokens
    access_token = create_access_token(
        data={"sub": user.username, "user_id": user.id, "role": user.role}
    )
    refresh_token = create_refresh_token(
        data={"sub": user.username, "user_id": user.id}
    )
    
    logger.info(f"User logged in: {user.username}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token
    )

@app.get("/api/v1/auth/me", response_model=UserResponse)
def get_current_user_info(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user information"""
    user = db.query(User).filter(User.id == current_user.get("user_id")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# ============================================================================
# Log Ingestion Endpoints
# ============================================================================

@app.post("/api/v1/logs/ingest")
def ingest_logs(
    logs: List[LogEntryCreate],
    api_key: str = Query(..., description="API key for authentication"),
    db: Session = Depends(get_db)
):
    """
    Ingest logs from applications/services
    Accepts both single logs and batches
    Requires valid API key
    """
    # Verify API key
    api_key_record = db.query(ApiKey).filter(
        (ApiKey.key == api_key) & (ApiKey.is_active == True)
    ).first()
    
    if not api_key_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or inactive API key"
        )
    
    # Insert logs
    inserted_count = 0
    for log_data in logs:
        # Set timestamp if not provided
        if not log_data.timestamp:
            log_data.timestamp = datetime.utcnow()
        
        db_log = LogEntry(
            timestamp=log_data.timestamp,
            service_name=log_data.service_name,
            log_level=log_data.log_level,
            message=log_data.message,
            server_id=log_data.server_id,
            trace_id=log_data.trace_id,
            request_id=log_data.request_id,
            user_id=log_data.user_id,
            error_code=log_data.error_code,
            stack_trace=log_data.stack_trace,
            metadata=log_data.metadata,
            response_time_ms=log_data.response_time_ms
        )
        db.add(db_log)
        inserted_count += 1
    
    db.commit()
    
    # Update API key's last used timestamp
    api_key_record.last_used = datetime.utcnow()
    db.commit()
    
    # Broadcast to WebSocket connections
    await_broadcast_message = {
        "type": "log_ingested",
        "service": api_key_record.service_name,
        "count": inserted_count,
        "timestamp": datetime.utcnow().isoformat()
    }
    
    logger.info(f"Ingested {inserted_count} logs from {api_key_record.service_name}")
    
    return {
        "status": "success",
        "message": f"Ingested {inserted_count} logs",
        "count": inserted_count
    }

# ============================================================================
# Log Query Endpoints
# ============================================================================

@app.get("/api/v1/logs", response_model=List[LogEntryResponse])
def get_logs(
    service_name: Optional[str] = Query(None),
    log_level: Optional[str] = Query(None),
    server_id: Optional[str] = Query(None),
    trace_id: Optional[str] = Query(None),
    error_code: Optional[str] = Query(None),
    search: Optional[str] = Query(None, description="Search in message"),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    limit: int = Query(100, le=10000),
    offset: int = Query(0, ge=0),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get logs with optional filters
    Supports filtering by service, level, server, trace_id, error_code
    Search capability in message field
    """
    query = db.query(LogEntry)
    
    # Apply filters
    if service_name:
        query = query.filter(LogEntry.service_name == service_name)
    if log_level:
        query = query.filter(LogEntry.log_level == log_level)
    if server_id:
        query = query.filter(LogEntry.server_id == server_id)
    if trace_id:
        query = query.filter(LogEntry.trace_id == trace_id)
    if error_code:
        query = query.filter(LogEntry.error_code == error_code)
    if search:
        query = query.filter(LogEntry.message.ilike(f"%{search}%"))
    if start_time:
        query = query.filter(LogEntry.timestamp >= start_time)
    if end_time:
        query = query.filter(LogEntry.timestamp <= end_time)
    
    # Get total count before pagination
    total_count = query.count()
    
    # Apply pagination and ordering
    logs = query.order_by(desc(LogEntry.timestamp)).limit(limit).offset(offset).all()
    
    return logs

@app.get("/api/v1/logs/stats", response_model=LogStatsResponse)
def get_log_statistics(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get log statistics and analytics"""
    query = db.query(LogEntry)
    
    # Time range filter
    if not start_time:
        start_time = datetime.utcnow() - timedelta(hours=24)
    if not end_time:
        end_time = datetime.utcnow()
    
    query = query.filter(
        and_(LogEntry.timestamp >= start_time, LogEntry.timestamp <= end_time)
    )
    
    total_logs = query.count()
    error_count = query.filter(LogEntry.log_level == "ERROR").count()
    warning_count = query.filter(LogEntry.log_level == "WARNING").count()
    info_count = query.filter(LogEntry.log_level == "INFO").count()
    debug_count = query.filter(LogEntry.log_level == "DEBUG").count()
    critical_count = query.filter(LogEntry.log_level == "CRITICAL").count()
    
    # Get unique services
    services = [
        row[0] for row in db.query(LogEntry.service_name).distinct().all()
    ]
    
    # Calculate error rate
    error_rate = (error_count / total_logs * 100) if total_logs > 0 else 0
    
    # Get average response time
    result = db.query(func.avg(LogEntry.response_time_ms)).scalar()
    avg_response_time = float(result) if result else None
    
    return LogStatsResponse(
        total_logs=total_logs,
        error_count=error_count,
        warning_count=warning_count,
        info_count=info_count,
        debug_count=debug_count,
        critical_count=critical_count,
        services=services,
        error_rate=round(error_rate, 2),
        avg_response_time_ms=avg_response_time
    )

@app.get("/api/v1/logs/{log_id}")
def get_log_detail(
    log_id: int,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information of a specific log"""
    log = db.query(LogEntry).filter(LogEntry.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Log not found")
    
    return {
        "id": log.id,
        "timestamp": log.timestamp,
        "service_name": log.service_name,
        "log_level": log.log_level,
        "message": log.message,
        "server_id": log.server_id,
        "trace_id": log.trace_id,
        "request_id": log.request_id,
        "user_id": log.user_id,
        "error_code": log.error_code,
        "stack_trace": log.stack_trace,
        "metadata": log.metadata,
        "response_time_ms": log.response_time_ms
    }

# ============================================================================
# Log Export Endpoints
# ============================================================================

@app.post("/api/v1/logs/export/csv")
def export_logs_csv(
    service_name: Optional[str] = Query(None),
    log_level: Optional[str] = Query(None),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export logs to CSV format"""
    query = db.query(LogEntry)
    
    # Apply filters
    if service_name:
        query = query.filter(LogEntry.service_name == service_name)
    if log_level:
        query = query.filter(LogEntry.log_level == log_level)
    if start_time:
        query = query.filter(LogEntry.timestamp >= start_time)
    if end_time:
        query = query.filter(LogEntry.timestamp <= end_time)
    
    logs = query.order_by(desc(LogEntry.timestamp)).all()
    
    # Create CSV
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'ID', 'Timestamp', 'Service', 'Level', 'Message', 
        'Server', 'TraceID', 'ErrorCode', 'ResponseTime'
    ])
    
    # Write data
    for log in logs:
        writer.writerow([
            log.id,
            log.timestamp,
            log.service_name,
            log.log_level,
            log.message,
            log.server_id,
            log.trace_id,
            log.error_code,
            log.response_time_ms
        ])
    
    output.seek(0)
    
    # Log export
    export_record = LogExport(
        user_id=current_user.get("user_id"),
        export_type="csv",
        row_count=len(logs),
        file_path=f"export_{datetime.utcnow().timestamp()}.csv"
    )
    db.add(export_record)
    db.commit()
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=logs.csv"}
    )

@app.post("/api/v1/logs/export/json")
def export_logs_json(
    service_name: Optional[str] = Query(None),
    log_level: Optional[str] = Query(None),
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export logs to JSON format"""
    query = db.query(LogEntry)
    
    # Apply filters
    if service_name:
        query = query.filter(LogEntry.service_name == service_name)
    if log_level:
        query = query.filter(LogEntry.log_level == log_level)
    if start_time:
        query = query.filter(LogEntry.timestamp >= start_time)
    if end_time:
        query = query.filter(LogEntry.timestamp <= end_time)
    
    logs = query.order_by(desc(LogEntry.timestamp)).all()
    
    # Create JSON
    logs_json = [
        {
            "id": log.id,
            "timestamp": log.timestamp.isoformat(),
            "service_name": log.service_name,
            "log_level": log.log_level,
            "message": log.message,
            "server_id": log.server_id,
            "trace_id": log.trace_id,
            "error_code": log.error_code,
            "response_time_ms": log.response_time_ms
        }
        for log in logs
    ]
    
    # Log export
    export_record = LogExport(
        user_id=current_user.get("user_id"),
        export_type="json",
        row_count=len(logs),
        file_path=f"export_{datetime.utcnow().timestamp()}.json"
    )
    db.add(export_record)
    db.commit()
    
    return JSONResponse(
        content={"logs": logs_json, "count": len(logs)},
        headers={"Content-Disposition": "attachment; filename=logs.json"}
    )

# ============================================================================
# API Key Management Endpoints
# ============================================================================

@app.post("/api/v1/api-keys", response_model=ApiKeyResponse)
def create_api_key(
    name: str = Query(...),
    service_name: str = Query(...),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new API key for a service"""
    key = generate_api_key(service_name)
    
    api_key = ApiKey(
        key=key,
        name=name,
        service_name=service_name,
        created_by=current_user.get("user_id")
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    
    logger.info(f"API key created for service: {service_name}")
    
    return api_key

@app.get("/api/v1/api-keys")
def list_api_keys(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all API keys created by current user"""
    api_keys = db.query(ApiKey).filter(
        ApiKey.created_by == current_user.get("user_id")
    ).all()
    
    # Don't return the full key, just the last 4 characters
    return [
        {
            "id": key.id,
            "name": key.name,
            "service_name": key.service_name,
            "key_preview": f"...{key.key[-4:]}",
            "created_at": key.created_at,
            "last_used": key.last_used,
            "is_active": key.is_active
        }
        for key in api_keys
    ]

# ============================================================================
# Alert Management Endpoints
# ============================================================================

@app.post("/api/v1/alerts/rules", response_model=AlertRuleResponse)
def create_alert_rule(
    rule_data: AlertRuleCreate,
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new alert rule"""
    rule = AlertRule(
        name=rule_data.name,
        description=rule_data.description,
        service_name=rule_data.service_name,
        log_level=rule_data.log_level,
        error_code=rule_data.error_code,
        keyword_match=rule_data.keyword_match,
        threshold=rule_data.threshold,
        time_window_seconds=rule_data.time_window_seconds,
        alert_type=rule_data.alert_type,
        alert_target=rule_data.alert_target,
        created_by=current_user.get("user_id")
    )
    db.add(rule)
    db.commit()
    db.refresh(rule)
    
    logger.info(f"Alert rule created: {rule.name}")
    
    return rule

@app.get("/api/v1/alerts/rules")
def list_alert_rules(
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List all alert rules for current user"""
    rules = db.query(AlertRule).filter(
        AlertRule.created_by == current_user.get("user_id")
    ).all()
    return rules

@app.get("/api/v1/alerts")
def get_alerts(
    start_time: Optional[datetime] = Query(None),
    end_time: Optional[datetime] = Query(None),
    is_resolved: Optional[bool] = Query(None),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get alerts triggered for current user"""
    query = db.query(Alert).filter(Alert.user_id == current_user.get("user_id"))
    
    if start_time:
        query = query.filter(Alert.triggered_at >= start_time)
    if end_time:
        query = query.filter(Alert.triggered_at <= end_time)
    if is_resolved is not None:
        query = query.filter(Alert.is_resolved == is_resolved)
    
    alerts = query.order_by(desc(Alert.triggered_at)).all()
    
    return [
        {
            "id": alert.id,
            "rule_id": alert.rule_id,
            "triggered_at": alert.triggered_at,
            "message": alert.message,
            "sent_to": alert.sent_to,
            "is_resolved": alert.is_resolved,
            "resolved_at": alert.resolved_at
        }
        for alert in alerts
    ]

# ============================================================================
# Real-time WebSocket Endpoints
# ============================================================================

@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    """
    WebSocket endpoint for real-time log streaming
    Clients receive log updates as they arrive
    """
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection open
            data = await websocket.receive_text()
            
            # Echo back or process commands
            if data == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("Client disconnected from WebSocket")

# ============================================================================
# Admin Endpoints
# ============================================================================

@app.delete("/api/v1/logs/old")
def cleanup_old_logs(
    days: int = Query(30, description="Delete logs older than N days"),
    current_user: Dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Delete logs older than specified days (Admin only)"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    deleted_count = db.query(LogEntry).filter(
        LogEntry.timestamp < cutoff_date
    ).delete()
    
    db.commit()
    
    logger.warning(f"Deleted {deleted_count} logs older than {days} days")
    
    return {
        "status": "success",
        "deleted_count": deleted_count,
        "message": f"Deleted {deleted_count} logs older than {days} days"
    }

@app.get("/api/v1/users")
def list_users(
    current_user: Dict = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """List all users (Admin only)"""
    users = db.query(User).all()
    return users

# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/")
def root():
    """Root endpoint with API info"""
    return {
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "status": "running"
    }

# ============================================================================
# Application startup/shutdown
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logger.info(f"{settings.APP_NAME} v{settings.APP_VERSION} started")
    
    # Create default admin user if not exists
    db = SessionLocal()
    admin = db.query(User).filter(User.role == "admin").first()
    if not admin:
        admin_user = User(
            username="admin",
            email="admin@logging-system.com",
            hashed_password=hash_password("admin123"),
            full_name="System Administrator",
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        logger.info("Default admin user created (username: admin, password: admin123)")
    db.close()

@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    logger.info(f"{settings.APP_NAME} shutting down")

# ============================================================================
# Main entry point
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    
    print("=" * 70)
    print(f"{settings.APP_NAME} v{settings.APP_VERSION}")
    print("=" * 70)
    print(f"Starting FastAPI server on http://0.0.0.0:8000")
    print("API Documentation: http://localhost:8000/docs")
    print("Alternative Docs: http://localhost:8000/redoc")
    print("=" * 70)
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
