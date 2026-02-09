"""
Database Models for Universal Logging System
Using SQLAlchemy ORM for data persistence
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Float, Boolean, Index, ForeignKey, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum

Base = declarative_base()

class LogLevel(str, enum.Enum):
    """Log level enumeration"""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"

class User(Base):
    """User model for authentication"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(255), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    role = Column(String(50), default="developer")  # admin, developer, viewer
    is_active = Column(Boolean, default=True)
    api_key = Column(String(255), unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    logs = relationship("LogEntry", back_populates="user")
    alerts = relationship("Alert", back_populates="user")
    
    def __repr__(self):
        return f"<User {self.username}>"

class LogEntry(Base):
    """Log entry model"""
    __tablename__ = "logs"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    service_name = Column(String(255), index=True, nullable=False)
    log_level = Column(String(20), index=True, nullable=False)
    message = Column(Text, nullable=False)
    server_id = Column(String(255), index=True, nullable=True)
    trace_id = Column(String(255), unique=True, index=True, nullable=True)
    request_id = Column(String(255), index=True, nullable=True)
    user_id = Column(String(255), index=True, nullable=True)
    error_code = Column(String(50), index=True, nullable=True)
    stack_trace = Column(Text, nullable=True)
    metadata = Column(Text, nullable=True)  # JSON string
    response_time_ms = Column(Float, nullable=True)
    user = relationship("User", back_populates="logs")
    
    # Indexes for performance
    __table_args__ = (
        Index('idx_timestamp_service', 'timestamp', 'service_name'),
        Index('idx_timestamp_level', 'timestamp', 'log_level'),
        Index('idx_service_level', 'service_name', 'log_level'),
        Index('idx_trace_id', 'trace_id'),
    )
    
    def __repr__(self):
        return f"<LogEntry {self.id} - {self.service_name} [{self.log_level}]>"

class ApiKey(Base):
    """API Key model for service authentication"""
    __tablename__ = "api_keys"
    
    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    service_name = Column(String(255), index=True, nullable=False)
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    
    def __repr__(self):
        return f"<ApiKey {self.name} - {self.service_name}>"

class AlertRule(Base):
    """Alert rule model for automated alerts"""
    __tablename__ = "alert_rules"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    service_name = Column(String(255), index=True, nullable=True)
    log_level = Column(String(20), nullable=False)  # ERROR, CRITICAL, etc.
    error_code = Column(String(50), nullable=True)
    keyword_match = Column(String(255), nullable=True)
    threshold = Column(Integer, default=1)  # Alert after N matches
    time_window_seconds = Column(Integer, default=60)
    alert_type = Column(String(50), default="email")  # email, slack, webhook
    alert_target = Column(String(255), nullable=False)  # Email or webhook URL
    created_by = Column(Integer, ForeignKey('users.id'), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="alerts")
    
    def __repr__(self):
        return f"<AlertRule {self.name}>"

class Alert(Base):
    """Alert notification model"""
    __tablename__ = "alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey('alert_rules.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    triggered_at = Column(DateTime, default=datetime.utcnow, index=True)
    log_entry_id = Column(Integer, ForeignKey('logs.id'), nullable=True)
    message = Column(Text, nullable=False)
    sent_to = Column(String(255), nullable=False)
    is_resolved = Column(Boolean, default=False)
    resolved_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="alerts")
    
    def __repr__(self):
        return f"<Alert {self.id}>"

class LogExport(Base):
    """Track exported logs"""
    __tablename__ = "log_exports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    export_type = Column(String(20), nullable=False)  # csv, json
    filters = Column(Text, nullable=True)  # JSON string of applied filters
    row_count = Column(Integer, nullable=False)
    file_path = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<LogExport {self.id}>"

class SystemMetric(Base):
    """System health and performance metrics"""
    __tablename__ = "system_metrics"
    
    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    service_name = Column(String(255), index=True, nullable=False)
    error_count = Column(Integer, default=0)
    warning_count = Column(Integer, default=0)
    info_count = Column(Integer, default=0)
    debug_count = Column(Integer, default=0)
    avg_response_time_ms = Column(Float, nullable=True)
    unique_trace_ids = Column(Integer, default=0)
    
    __table_args__ = (
        Index('idx_metric_timestamp_service', 'timestamp', 'service_name'),
    )
    
    def __repr__(self):
        return f"<SystemMetric {self.service_name}>"
