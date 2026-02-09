# Setup Instructions

## System Requirements

- **OS**: Windows, macOS, or Linux
- **Memory**: 512MB minimum
- **Disk Space**: 500MB for dependencies

## Quick Setup Guide

### Step 1: Install Dependencies

#### Python (Backend)
```bash
cd backend
pip install -r requirements.txt
```

#### Java
- Download Java JDK 11+ from [oracle.com](https://www.oracle.com/java/technologies/downloads/)
- Add Java bin directory to your system PATH

### Step 2: Start Services

**Terminal 1 - Python Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
python -m http.server 8000
# Open browser: http://localhost:8000
```

**Terminal 3 - Java Service:**
```bash
cd java-service
# Windows
run.bat

# macOS/Linux
chmod +x run.sh
./run.sh
```

## Port Configuration

- **Backend API**: http://localhost:5000
- **Frontend Server**: http://localhost:8000
- **Java Service**: Connects to localhost:5000

## Troubleshooting

### Port Already in Use
```bash
# Windows - Find what's using port 5000
netstat -ano | findstr :5000

# Kill process
taskkill /PID <PID> /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

### Dependencies Not Installing
```bash
# Use pip with upgrade
pip install --upgrade -r requirements.txt

# Or use specific Python version
python3 -m pip install -r requirements.txt
```

### Java Not Found
- Add Java installation directory to PATH
- Test: `java -version`

## File Descriptions

### Frontend Only
- `frontend/index.html` - Main HTML
- `frontend/styles.css` - Styling
- `frontend/script.js` - JavaScript logic

### Backend Only
- `backend/app.py` - Flask application
- `backend/requirements.txt` - Python packages

### Java Service Only
- `java-service/LoggingService.java` - Main application
- `java-service/run.bat` - Windows build script
- `java-service/run.sh` - Unix build script

## Data Files (Auto-Generated)

After running the backend, these files are created:
- `backend/initiatives.json` - Stored initiatives
- `backend/logs.json` - Stored logs

## Next Steps

1. ✅ Install dependencies
2. ✅ Start Python backend
3. ✅ Open frontend in browser
4. ✅ Run Java service to generate logs
5. ✅ View initiatives and logs in dashboard

For detailed information, see README.md
