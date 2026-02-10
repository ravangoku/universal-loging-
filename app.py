import os
import json
import csv
import io
from datetime import datetime
from flask import Flask, request, jsonify, send_file, Response
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

app = Flask(__name__)
# Enable CORS for all roots and all origins
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# ===============================
# CONFIG
# ===============================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOGS_FILE = os.path.join(BASE_DIR, "logs.json")

API_KEY = "uls_demo_key_12345"
API_HEADER = "X-API-KEY"

# ===============================
# ERROR HANDLERS (JSON ONLY)
# ===============================
@app.errorhandler(Exception)
def handle_exception(e):
    """Handle all exceptions and return JSON instead of HTML."""
    if isinstance(e, HTTPException):
        return jsonify({
            "status": "error",
            "message": e.description
        }), e.code
    return jsonify({
        "status": "error",
        "message": "Internal Server Error"
    }), 500

@app.errorhandler(404)
def resource_not_found(e):
    return jsonify({
        "status": "error", 
        "message": "The requested URL was not found on the server."
    }), 404

# ===============================
# HELPERS
# ===============================
def ensure_logs_file():
    """Create logs.json if it doesn't exist."""
    if not os.path.exists(LOGS_FILE):
        with open(LOGS_FILE, "w") as f:
            json.dump([], f)

def load_logs():
    """Load logs from file safely."""
    ensure_logs_file()
    try:
        with open(LOGS_FILE, "r") as f:
            data = json.load(f)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, IOError):
        return []

def save_logs(logs):
    """Save logs to file safely."""
    try:
        with open(LOGS_FILE, "w") as f:
            json.dump(logs, f, indent=2)
    except IOError:
        pass

def validate_api_key():
    """Check if X-API-KEY header matches the expected value."""
    key = request.headers.get(API_HEADER)
    if key != API_KEY:
        return False
    return True

# ===============================
# ROUTES
# ===============================

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint (no API key required)."""
    return jsonify({
        "status": "success",
        "message": "API running"
    })

@app.route("/api/logs", methods=["GET"])
def get_logs():
    """Retrieve all logs (requires API key)."""
    if not validate_api_key():
        return jsonify({"status": "error", "message": "Invalid API key"}), 401

    logs = load_logs()
    
    # Optional sorting: latest logs first
    try:
        logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    except Exception:
        pass

    return jsonify({
        "status": "success",
        "logs": logs,
        "results": logs,  # For frontend compatibility
        "count": len(logs)
    }), 200

@app.route("/api/logs", methods=["POST"])
def submit_log():
    """Add a new log entry (requires API key)."""
    if not validate_api_key():
        return jsonify({"status": "error", "message": "Invalid API key"}), 401

    data = request.get_json(silent=True) or {}
    
    # Map both frontend schemas to the stored schema
    log_entry = {
        "timestamp": data.get("timestamp") or datetime.now().isoformat(),
        "service": data.get("service") or data.get("service_name") or "Unknown",
        "level": data.get("level") or data.get("log_level") or "INFO",
        "message": data.get("message", ""),
        "server": data.get("server") or data.get("server_id") or "Server-1",
        "trace_id": data.get("trace_id", "")
    }

    logs = load_logs()
    logs.append(log_entry)
    save_logs(logs)

    return jsonify({
        "status": "success",
        "message": "Log saved",
        "log": log_entry
    }), 201

# -------- CSV EXPORT ROUTES --------
@app.route("/api/logs/export", methods=["GET"])
@app.route("/api/logs/export-csv", methods=["GET"])
@app.route("/api/logs/export/csv", methods=["GET"])
@app.route("/api/logs/csv", methods=["GET"])
def export_logs():
    """Export all logs to a CSV file (requires API key)."""
    if not validate_api_key():
        return jsonify({"status": "error", "message": "Invalid API key"}), 401

    logs = load_logs()
    
    output = io.StringIO()
    writer = csv.DictWriter(
        output, 
        fieldnames=["timestamp", "service", "level", "message", "server", "trace_id"]
    )
    writer.writeheader()
    writer.writerows(logs)
    
    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=logs.csv"}
    )

@app.route("/api/logs/clear", methods=["POST"])
def clear_logs():
    """Clear all stored logs (requires API key)."""
    if not validate_api_key():
        return jsonify({"status": "error", "message": "Invalid API key"}), 401

    save_logs([])
    return jsonify({
        "status": "success", 
        "message": "Logs cleared"
    }), 200

# ===============================
# START SERVER
# ===============================
if __name__ == "__main__":
    ensure_logs_file()
    print("====================================")
    print("  Universal Logging System Backend  ")
    print("====================================")
    print("API URL : http://localhost:5000")
    print("API KEY :", API_KEY)
    print("====================================")
    # Host 0.0.0.0 is critical for accessibility in some environments
    app.run(host="0.0.0.0", port=5000, debug=True)
