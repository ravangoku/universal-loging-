# API Documentation

## Base URL
```
http://localhost:5000
```

## Response Format

All responses are in JSON format with the following structure:

### Success Response
```json
{
  "status": "success",
  "data": {...},
  "message": "Optional message"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description"
}
```

## HTTP Status Codes
- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Initiatives Endpoints

### GET /api/initiatives
**Description**: Retrieve all initiatives

**URL**: `http://localhost:5000/api/initiatives`

**Method**: GET

**Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/initiatives
```

**Example Response** (200 OK):
```json
{
  "status": "success",
  "initiatives": [
    {
      "id": 0,
      "category": "Improve Efficiency",
      "name": "Universal Logging System (UI + API)",
      "problem": "Logs are scattered across servers and databases, making debugging difficult.",
      "created_at": "2026-02-09T10:30:45.123456"
    }
  ],
  "count": 1
}
```

---

### POST /api/initiatives
**Description**: Create a new initiative

**URL**: `http://localhost:5000/api/initiatives`

**Method**: POST

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "category": "string (required)",
  "name": "string (required)",
  "problem": "string (required)"
}
```

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/initiatives \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Security Enhancement",
    "name": "Implement Multi-Factor Authentication",
    "problem": "User accounts lack sufficient protection against unauthorized access"
  }'
```

**Example Response** (201 Created):
```json
{
  "status": "success",
  "initiative": {
    "id": 1,
    "category": "Security Enhancement",
    "name": "Implement Multi-Factor Authentication",
    "problem": "User accounts lack sufficient protection against unauthorized access",
    "created_at": "2026-02-09T10:31:00.654321"
  }
}
```

**Validation Errors** (400 Bad Request):
```json
{
  "status": "error",
  "message": "Missing required fields: category, name, problem"
}
```

---

### DELETE /api/initiatives/{id}
**Description**: Delete an initiative by ID

**URL**: `http://localhost:5000/api/initiatives/{id}`

**Method**: DELETE

**URL Parameters**:
- `id` (integer, required) - Index of the initiative to delete

**Example Request**:
```bash
curl -X DELETE http://localhost:5000/api/initiatives/0
```

**Example Response** (200 OK):
```json
{
  "status": "success",
  "message": "Initiative deleted successfully",
  "deleted": {
    "id": 0,
    "category": "Improve Efficiency",
    "name": "Universal Logging System (UI + API)",
    "problem": "Logs are scattered across servers and databases, making debugging difficult.",
    "created_at": "2026-02-09T10:30:45.123456"
  }
}
```

**Not Found Error** (404):
```json
{
  "status": "error",
  "message": "Initiative not found"
}
```

---

## Logs Endpoints

### GET /api/logs
**Description**: Retrieve all logs with optional limit

**URL**: `http://localhost:5000/api/logs`

**Method**: GET

**Query Parameters**:
- `limit` (integer, optional, default: 100) - Maximum number of logs to return

**Example Requests**:
```bash
# Get all logs (up to 100)
curl http://localhost:5000/api/logs

# Get last 50 logs
curl http://localhost:5000/api/logs?limit=50

# Get last 10 logs
curl http://localhost:5000/api/logs?limit=10
```

**Example Response** (200 OK):
```json
{
  "status": "success",
  "logs": [
    {
      "timestamp": "2026-02-09T10:35:12.345678",
      "level": "INFO",
      "message": "User authentication successful",
      "source": "AuthService"
    },
    {
      "timestamp": "2026-02-09T10:35:14.456789",
      "level": "WARNING",
      "message": "High CPU usage detected",
      "source": "SystemMonitor"
    },
    {
      "timestamp": "2026-02-09T10:35:16.567890",
      "level": "ERROR",
      "message": "Database connection failed",
      "source": "DatabaseService"
    }
  ],
  "count": 3
}
```

---

### POST /api/logs
**Description**: Add a new log entry (typically called by logging services)

**URL**: `http://localhost:5000/api/logs`

**Method**: POST

**Headers**:
```
Content-Type: application/json
```

**Request Body**:
```json
{
  "level": "string (optional, default: INFO)",
  "message": "string (required)",
  "source": "string (optional, default: Unknown)"
}
```

**Valid Log Levels**:
- `INFO` - Informational messages
- `WARNING` - Warning messages
- `ERROR` - Error messages

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": "ERROR",
    "message": "Database connection timeout after 30 seconds",
    "source": "DatabaseService"
  }'
```

**Example Response** (201 Created):
```json
{
  "status": "success",
  "log": {
    "timestamp": "2026-02-09T10:36:00.789012",
    "level": "ERROR",
    "message": "Database connection timeout after 30 seconds",
    "source": "DatabaseService"
  }
}
```

**Validation Error** (400 Bad Request):
```json
{
  "status": "error",
  "message": "Missing required field: message"
}
```

---

### POST /api/logs/clear
**Description**: Clear all log entries

**URL**: `http://localhost:5000/api/logs/clear`

**Method**: POST

**Parameters**: None

**Example Request**:
```bash
curl -X POST http://localhost:5000/api/logs/clear
```

**Example Response** (200 OK):
```json
{
  "status": "success",
  "message": "All logs cleared"
}
```

---

## Health Check Endpoint

### GET /api/health
**Description**: Check if the API is running and healthy

**URL**: `http://localhost:5000/api/health`

**Method**: GET

**Parameters**: None

**Example Request**:
```bash
curl http://localhost:5000/api/health
```

**Example Response** (200 OK):
```json
{
  "status": "success",
  "message": "Universal Logging System API is running",
  "timestamp": "2026-02-09T10:30:00.000000"
}
```

---

## Common Use Cases

### Get Recent Errors Only
```bash
# Get all logs and filter client-side or:
curl http://localhost:5000/api/logs?limit=100 \
  | grep -i "ERROR"
```

### Monitor System in Real-Time
```bash
# Poll every 2 seconds
watch -n 2 'curl -s http://localhost:5000/api/logs?limit=10'
```

### Create Dashboard Data
```bash
# Get initiatives for report
curl http://localhost:5000/api/initiatives | python -m json.tool

# Get statistics
curl http://localhost:5000/api/logs | wc -l
```

---

## Error Handling

### Network Errors
If you receive connection errors:
1. Verify the API is running: `http://localhost:5000/api/health`
2. Check firewall settings
3. Verify port 5000 is not in use: `netstat -ano | findstr :5000`

### CORS Errors
If frontend receives CORS errors:
1. Ensure Flask-CORS is installed
2. Check that API is responding with CORS headers

### Data Validation
All inputs are validated:
- Required fields must not be empty
- Strings are trimmed of whitespace
- Special characters are properly escaped

---

## Rate Limiting

Currently, there is no rate limiting. For production, implement:
- Request throttling (max requests per second)
- IP-based rate limiting
- User-based rate limiting

---

## Data Persistence

### File Locations
- Initiatives: `backend/initiatives.json`
- Logs: `backend/logs.json`

### Data Format

**initiatives.json**:
```json
[
  {
    "id": 0,
    "category": "string",
    "name": "string",
    "problem": "string",
    "created_at": "ISO timestamp"
  }
]
```

**logs.json**:
```json
[
  {
    "timestamp": "ISO timestamp",
    "level": "INFO|WARNING|ERROR",
    "message": "string",
    "source": "string"
  }
]
```

---

## Testing

### Using cURL

```bash
# Test API health
curl http://localhost:5000/api/health

# Create initiative
curl -X POST http://localhost:5000/api/initiatives \
  -H "Content-Type: application/json" \
  -d '{"category":"Test","name":"Test Initiative","problem":"Test problem"}'

# Get all initiatives
curl http://localhost:5000/api/initiatives

# Add log
curl -X POST http://localhost:5000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"level":"INFO","message":"Test log","source":"Test"}'

# Get logs
curl http://localhost:5000/api/logs?limit=10

# Clear logs
curl -X POST http://localhost:5000/api/logs/clear
```

### Using Python

```python
import requests

BASE_URL = "http://localhost:5000"

# Get initiatives
response = requests.get(f"{BASE_URL}/api/initiatives")
print(response.json())

# Create initiative
data = {
    "category": "Test",
    "name": "Test Initiative",
    "problem": "Test problem"
}
response = requests.post(f"{BASE_URL}/api/initiatives", json=data)
print(response.json())

# Add log
log_data = {
    "level": "INFO",
    "message": "Test message",
    "source": "TestApp"
}
response = requests.post(f"{BASE_URL}/api/logs", json=log_data)
print(response.json())
```

---

## API Changelog

### Version 1.0 (Current)
- Initial release
- Initiatives CRUD endpoints
- Logs GET/POST endpoints
- Health check endpoint
- CORS support
