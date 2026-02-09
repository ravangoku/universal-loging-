"""
Universal Logging System - Python Flask Backend API
Provides REST endpoints for managing initiatives and logs
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import json
import os

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable CORS for frontend communication

# Data file paths
INITIATIVES_FILE = 'initiatives.json'
LOGS_FILE = 'logs.json'

# Initialize data files
def initialize_data():
    """Initialize data files if they don't exist"""
    if not os.path.exists(INITIATIVES_FILE):
        with open(INITIATIVES_FILE, 'w') as f:
            json.dump([], f)
    if not os.path.exists(LOGS_FILE):
        with open(LOGS_FILE, 'w') as f:
            json.dump([], f)

# Load initiatives from file
def load_initiatives():
    """Load initiatives from JSON file"""
    try:
        with open(INITIATIVES_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# Save initiatives to file
def save_initiatives(initiatives):
    """Save initiatives to JSON file"""
    with open(INITIATIVES_FILE, 'w') as f:
        json.dump(initiatives, f, indent=2)

# Load logs from file
def load_logs():
    """Load logs from JSON file"""
    try:
        with open(LOGS_FILE, 'r') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

# Save logs to file
def save_logs(logs):
    """Save logs to JSON file"""
    with open(LOGS_FILE, 'w') as f:
        json.dump(logs, f, indent=2)

# ============================================================================
# REST API Endpoints
# ============================================================================

@app.route('/api/initiatives', methods=['GET'])
def get_initiatives():
    """
    GET /api/initiatives
    Fetch all initiatives
    Returns: JSON array of initiatives
    """
    initiatives = load_initiatives()
    return jsonify({
        'status': 'success',
        'initiatives': initiatives,
        'count': len(initiatives)
    }), 200

@app.route('/api/initiatives', methods=['POST'])
def create_initiative():
    """
    POST /api/initiatives
    Create a new initiative
    Body: { 'category': str, 'name': str, 'problem': str }
    Returns: JSON of created initiative
    """
    data = request.get_json()
    
    # Validate request
    if not data or not all(key in data for key in ['category', 'name', 'problem']):
        return jsonify({
            'status': 'error',
            'message': 'Missing required fields: category, name, problem'
        }), 400
    
    # Create new initiative
    initiatives = load_initiatives()
    new_initiative = {
        'id': len(initiatives),
        'category': data['category'],
        'name': data['name'],
        'problem': data['problem'],
        'created_at': datetime.now().isoformat()
    }
    
    initiatives.append(new_initiative)
    save_initiatives(initiatives)
    
    # Log the action
    log_event(f'Initiative created: {data["name"]}', 'INFO', 'API')
    
    return jsonify({
        'status': 'success',
        'initiative': new_initiative
    }), 201

@app.route('/api/initiatives/<int:initiative_id>', methods=['DELETE'])
def delete_initiative(initiative_id):
    """
    DELETE /api/initiatives/<id>
    Delete an initiative by index
    Returns: JSON response
    """
    initiatives = load_initiatives()
    
    if initiative_id < 0 or initiative_id >= len(initiatives):
        return jsonify({
            'status': 'error',
            'message': 'Initiative not found'
        }), 404
    
    deleted = initiatives.pop(initiative_id)
    save_initiatives(initiatives)
    
    # Log the action
    log_event(f'Initiative deleted: {deleted["name"]}', 'INFO', 'API')
    
    return jsonify({
        'status': 'success',
        'message': 'Initiative deleted successfully',
        'deleted': deleted
    }), 200

@app.route('/api/logs', methods=['GET'])
def get_logs():
    """
    GET /api/logs
    Fetch all logs
    Optional query parameter: ?limit=n (default 100)
    Returns: JSON array of logs
    """
    limit = request.args.get('limit', 100, type=int)
    logs = load_logs()
    
    # Return latest logs (limit to specified count)
    return jsonify({
        'status': 'success',
        'logs': logs[-limit:] if logs else [],
        'count': len(logs)
    }), 200

@app.route('/api/logs', methods=['POST'])
def add_log():
    """
    POST /api/logs
    Add a new log entry (typically called by Java service)
    Body: { 'level': str, 'message': str, 'source': str }
    Returns: JSON of created log
    """
    data = request.get_json()
    
    # Validate request
    if not data or 'message' not in data:
        return jsonify({
            'status': 'error',
            'message': 'Missing required field: message'
        }), 400
    
    # Create log entry
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'level': data.get('level', 'INFO'),
        'message': data.get('message', ''),
        'source': data.get('source', 'Unknown')
    }
    
    # Add to logs file
    logs = load_logs()
    logs.append(log_entry)
    save_logs(logs)
    
    return jsonify({
        'status': 'success',
        'log': log_entry
    }), 201

@app.route('/api/logs/clear', methods=['POST'])
def clear_logs():
    """
    POST /api/logs/clear
    Clear all logs
    Returns: JSON response
    """
    save_logs([])
    return jsonify({
        'status': 'success',
        'message': 'All logs cleared'
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    """
    GET /api/health
    Health check endpoint
    Returns: JSON with API status
    """
    return jsonify({
        'status': 'success',
        'message': 'Universal Logging System API is running',
        'timestamp': datetime.now().isoformat()
    }), 200

# ============================================================================
# Helper functions
# ============================================================================

def log_event(message, level='INFO', source='System'):
    """
    Helper function to log events internally
    
    Args:
        message (str): Log message
        level (str): Log level (INFO, WARNING, ERROR)
        source (str): Source of the log
    """
    logs = load_logs()
    log_entry = {
        'timestamp': datetime.now().isoformat(),
        'level': level,
        'message': message,
        'source': source
    }
    logs.append(log_entry)
    save_logs(logs)

# ============================================================================
# Application Bootstrap
# ============================================================================

if __name__ == '__main__':
    # Initialize data files
    initialize_data()
    
    # Add sample data if file is empty
    initiatives = load_initiatives()
    if len(initiatives) == 0:
        sample_initiatives = [
            {
                'id': 0,
                'category': 'Improve Efficiency',
                'name': 'Universal Logging System (UI + API)',
                'problem': 'Logs are scattered across servers and databases, making debugging difficult.',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': 1,
                'category': 'Security Enhancement',
                'name': 'Centralized Authentication',
                'problem': 'Multiple authentication systems across different services create security risks.',
                'created_at': datetime.now().isoformat()
            },
            {
                'id': 2,
                'category': 'Infrastructure',
                'name': 'Cloud Migration',
                'problem': 'Current on-premise infrastructure is costly and hard to maintain.',
                'created_at': datetime.now().isoformat()
            }
        ]
        save_initiatives(sample_initiatives)
    
    # Log startup
    log_event('Universal Logging System API started', 'INFO', 'System')
    
    # Start Flask application
    print("=" * 70)
    print("Universal Logging System - Python Flask Backend")
    print("=" * 70)
    print("API Server running on: http://localhost:5000")
    print("Available endpoints:")
    print("  GET    /api/initiatives       - Get all initiatives")
    print("  POST   /api/initiatives       - Create new initiative")
    print("  DELETE /api/initiatives/<id>  - Delete initiative")
    print("  GET    /api/logs              - Get all logs")
    print("  POST   /api/logs              - Add log entry")
    print("  GET    /api/health            - Health check")
    print("=" * 70)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
