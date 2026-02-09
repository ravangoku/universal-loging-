# Universal Logging System (UI + API)

A modern, enterprise-grade dark-themed web application for managing system initiatives and displaying centralized logging data. Built with HTML5, CSS3, Python Flask, and Java.

## 🎯 Project Overview

The Universal Logging System is a full-stack application that demonstrates:
- **Modern dark-themed UI** with responsive design
- **RESTful API backend** for managing initiatives
- **Centralized logging service** that collects logs from multiple sources
- **Real-time log display** with live updates

### Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | HTML5, CSS3 | Dark-themed responsive dashboard |
| **Backend API** | Python Flask, Flask-CORS | REST API for initiatives & logs |
| **Logging Service** | Java | Simulates server logs, sends to API |
| **Database** | JSON Files | Data persistence (SQLite optional) |

## 📁 Project Structure

```
Universal-Logging-System/
├── frontend/
│   ├── index.html           # Main dashboard HTML
│   ├── styles.css           # Dark theme CSS styles
│   └── script.js            # Frontend API communication
├── backend/
│   ├── app.py              # Flask application
│   └── requirements.txt      # Python dependencies
├── java-service/
│   ├── LoggingService.java  # Java logging service
│   ├── run.bat              # Windows build/run script
│   ├── run.sh               # Unix/Linux build/run script
└── README.md                # This file
```

## ✨ Features

### Frontend Dashboard
- **Dark professional theme** (#0b0f1a background)
- **Responsive table layout** with scrolling support
- **Initiative management** (Add, view, delete)
- **Real-time log display** with structured formatting
- **Statistics section** showing system metrics
- **Mobile-responsive design** for all screen sizes
- **Modern UI elements**:
  - Rounded corners with subtle shadows
  - High contrast text for readability
  - Smooth hover animations
  - Clean enterprise layout

### Backend API
- **RESTful endpoints**:
  - `GET /api/initiatives` - Fetch all initiatives
  - `POST /api/initiatives` - Create new initiative
  - `DELETE /api/initiatives/<id>` - Delete initiative
  - `GET /api/logs` - Fetch all logs
  - `POST /api/logs` - Add log entry
  - `GET /api/health` - Health check
- **JSON-based storage** (extensible to databases)
- **CORS enabled** for frontend communication
- **Error handling & validation**

### Java Logging Service
- **Simulates realistic logs** from multiple services:
  - AuthService
  - DatabaseService
  - APIGateway
  - CacheService
  - NotificationService
  - UserService
  - AnalyticsService
- **Multiple log levels**: INFO, WARNING, ERROR
- **HTTP API integration** (sends logs to Python backend)
- **Realistic log messages** for different source services

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**: Download from [python.org](https://www.python.org/downloads/)
- **Java JDK 11+**: Download from [oracle.com](https://www.oracle.com/java/technologies/downloads/) or install OpenJDK
- **Modern web browser**: Chrome, Firefox, Edge, or Safari

### Step 1: Install Python Dependencies

```bash
cd backend
pip install -r requirements.txt
```

If you're using a virtual environment (recommended):

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Start the Python Backend API

```bash
cd backend
python app.py
```

You should see:
```
======================================================================
Universal Logging System - Python Flask Backend
======================================================================
API Server running on: http://localhost:5000
```

**Important**: Keep this terminal open while using the application.

### Step 3: Open the Frontend Dashboard

Open the frontend in your browser:

```
file:///path-to-project/frontend/index.html
```

Or use a local web server (recommended):

```bash
cd frontend
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

### Step 4: Run the Java Logging Service

In a new terminal, navigate to the java-service directory:

**On Windows:**
```bash
cd java-service
run.bat
```

**On macOS/Linux:**
```bash
cd java-service
chmod +x run.sh
./run.sh
```

The service will automatically:
1. Compile the Java code
2. Connect to the API on port 5000
3. Send 50 simulated log entries
4. Display progress for each log

## 📊 Using the Application

### Adding Initiatives

1. Fill in the form at the top of the dashboard:
   - **Category**: Initiative category (e.g., "Improve Efficiency")
   - **Initiative Name**: Name of the initiative
   - **Problem Statement**: Description of the problem

2. Click **"Add Initiative"** button

3. The initiative appears in the table below

### Viewing Initiatives

The initiatives table displays all created initiatives with:
- Category (highlighted in blue)
- Initiative Name
- Problem Statement
- Action buttons (Delete)

### Viewing Logs

The "Recent Logs" section shows real-time logs from the Java service:
- **Color-coded by level**:
  - Blue: INFO messages
  - Yellow: WARNING messages
  - Red: ERROR messages
- **Structured format**: `[Time] [Level] Source: Message`
- **Scrollable container** with last 50 entries

### Statistics

The dashboard displays key metrics:
- **Total Initiatives**: Number of created initiatives
- **Logs Processed**: Total logs received
- **System Status**: Current API status

## 🔌 API Endpoints Reference

### Initiatives Endpoints

#### GET /api/initiatives
**Fetch all initiatives**

```bash
curl http://localhost:5000/api/initiatives
```

Response:
```json
{
  "status": "success",
  "initiatives": [
    {
      "id": 0,
      "category": "Improve Efficiency",
      "name": "Universal Logging System",
      "problem": "Logs are scattered across servers...",
      "created_at": "2026-02-09T10:30:00.000000"
    }
  ],
  "count": 1
}
```

#### POST /api/initiatives
**Create a new initiative**

```bash
curl -X POST http://localhost:5000/api/initiatives \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Security",
    "name": "Implement MFA",
    "problem": "Users accounts are vulnerable to password attacks"
  }'
```

#### DELETE /api/initiatives/<id>
**Delete an initiative**

```bash
curl -X DELETE http://localhost:5000/api/initiatives/0
```

### Logs Endpoints

#### GET /api/logs
**Fetch all logs (optional limit parameter)**

```bash
curl http://localhost:5000/api/logs?limit=50
```

#### POST /api/logs
**Add a new log entry**

```bash
curl -X POST http://localhost:5000/api/logs \
  -H "Content-Type: application/json" \
  -d '{
    "level": "ERROR",
    "message": "Database connection failed",
    "source": "DatabaseService"
  }'
```

#### POST /api/logs/clear
**Clear all logs**

```bash
curl -X POST http://localhost:5000/api/logs/clear
```

### Health Check

#### GET /api/health
**Check API status**

```bash
curl http://localhost:5000/api/health
```

## 🎨 UI Details

### Color Scheme
- **Primary Background**: #0b0f1a (Deep blue-black)
- **Secondary Background**: #151b2b (Slightly lighter)
- **Tertiary Background**: #1f2937 (Dark gray)
- **Accent Blue**: #60a5fa (Light blue)
- **Text Primary**: #e8f0fe (Off-white)
- **Text Secondary**: #a0aec0 (Gray)
- **Border**: #2d3748 (Dark gray)

### Responsive Breakpoints
- **Desktop**: Full layout
- **Tablet** (≤768px): Adjusted grid layouts
- **Mobile** (≤480px): Single column, compact styling

### Interactive Elements
- **Hover effects** on rows and buttons
- **Smooth transitions** (300ms default)
- **Focus states** with visible outlines
- **Loading states** for form submission

## 📝 Code Organization

### Frontend (script.js)
- `loadInitiatives()` - Fetch initiatives from API
- `renderInitiatives()` - Display initiatives in table
- `addInitiative()` - Create new initiative
- `deleteInitiative()` - Delete initiative
- `fetchLogs()` - Get logs from API
- `addLogToDisplay()` - Add log to UI
- Helper functions for HTML escaping and polling

### Backend (app.py)
- REST endpoint handlers (GET, POST, DELETE)
- Data persistence (JSON file operations)
- CORS support for cross-origin requests
- Logging and validation
- Health check endpoint

### Java Service (LoggingService.java)
- `LoggingService` - Main service class
- `LogGenerator` - Generates realistic logs
- `LogEntry` - Log data structure
- HTTP communication with API
- Simulates multiple service sources

## 🔧 Configuration

### Backend Configuration (app.py)
Edit the following in `backend/app.py`:

```python
# Data file paths
INITIATIVES_FILE = 'initiatives.json'
LOGS_FILE = 'logs.json'
```

### Frontend Configuration (script.js)
Edit the following in `frontend/script.js`:

```javascript
// API Configuration
const API_BASE_URL = 'http://localhost:5000';
const LOGS_POLLING_INTERVAL = 2000; // milliseconds
```

### Java Service Configuration (LoggingService.java)
Edit the following in `java-service/LoggingService.java`:

```java
// Configuration
private static final String API_BASE_URL = "http://localhost:5000";
private static final int LOG_INTERVAL = 2000; // milliseconds
private static final int TOTAL_LOGS = 50; // Total logs to send
```

## 🐛 Troubleshooting

### "Cannot GET /api/initiatives"
- **Issue**: Python backend is not running
- **Solution**: Start the Flask app: `python backend/app.py`

### "Failed to load initiatives. Make sure the backend API is running"
- **Issue**: Frontend cannot connect to API (CORS issue or API not running)
- **Solution**: 
  - Ensure backend is running on port 5000
  - Check that Flask-CORS is installed
  - Verify frontend is accessing correct API URL

### "Error sending log to API"
- **Issue**: Java service cannot connect to API
- **Solution**:
  - Ensure Python API is running first
  - Check firewall settings
  - Verify localhost:5000 is accessible

### Port Already in Use
If port 5000 is already in use:

Edit `backend/app.py`:
```python
app.run(debug=True, host='0.0.0.0', port=5001)  # Change port to 5001
```

Then update frontend and Java service to use new port.

### Java Compilation Issues
- **Issue**: "javac: command not found"
- **Solution**: Install Java JDK and add to PATH

## 📚 Sample Data

The application comes with sample initiatives:

| Category | Initiative Name | Problem Statement |
|----------|-----------------|-------------------|
| Improve Efficiency | Universal Logging System | Logs are scattered across servers and databases |
| Security Enhancement | Centralized Authentication | Multiple auth systems create security risks |
| Infrastructure | Cloud Migration | On-premise infrastructure is costly |

## 🔒 Security Notes

This is a **demo application**. For production use:

1. **Add authentication** (JWT, OAuth2)
2. **Validate all inputs** (already partially done)
3. **Use HTTPS** instead of HTTP
4. **Implement rate limiting**
5. **Add database** (PostgreSQL, MySQL) instead of JSON files
6. **Add logging** to server (for audit trails)
7. **Sanitize HTML** (XSS prevention - already done)
8. **Add database encryption**

## 📈 Performance Considerations

- **Log polling interval**: 2 seconds (adjustable)
- **Maximum displayed logs**: Last 50 entries
- **Initiative display**: Real-time updates
- **Responsive table**: Handles 1000+ rows efficiently

## 🤝 Contributing

To extend this application:

1. **Add more log sources** in `LoggingService.java`
2. **Implement database** in `backend/app.py`
3. **Add authentication** to all endpoints
4. **Create advanced filters** in frontend
5. **Add log analytics** and dashboards

## 📄 License

This is a demonstration project. Use freely for educational and commercial purposes.

## 👨‍💻 Author

Created: February 2026  
Universal Logging System Team

---

## ❓ FAQ

**Q: Can I change the port numbers?**  
A: Yes, edit the port configuration in each component (Flask app.py, JavaScript, Java service).

**Q: Can I use a real database?**  
A: Yes, update the backend to use SQLAlchemy with PostgreSQL, MySQL, or other databases.

**Q: How do I deploy this to production?**  
A: Use a WSGI server (Gunicorn), containerize with Docker, and deploy to cloud platforms.

**Q: Can I add more log sources?**  
A: Yes, edit the `LOG_SOURCES` and `LOG_MESSAGES` arrays in `LoggingService.java`.

**Q: Is the dark theme customizable?**  
A: Yes, edit the CSS variables in `:root` section of `styles.css`.

---

**Enjoy the Universal Logging System!** 🚀
