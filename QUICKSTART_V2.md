# Universal Logging System v2.0 - Quick Start Guide

## ⚡ Get Running in 5 Minutes

### System Requirements
- Python 3.8+
- Modern web browser (Chrome, Firefox, Safari, Edge)
- 2GB RAM minimum
- 500MB disk space

---

## 📋 Step-by-Step Setup

### 1️⃣ Install Backend Dependencies

```bash
cd backend
pip install -r requirements_enhanced.txt
```

**Expected output:**
```
Successfully installed fastapi-0.104.1 uvicorn-0.24.0 sqlalchemy-2.0.23 ...
```

### 2️⃣ Configure Environment (Optional)

```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults are fine for demo)
```

### 3️⃣ Start Backend API Server

```bash
cd backend
python main.py
```

**Expected output:**
```
======================================================================
Universal Logging System v2.0
======================================================================
Starting FastAPI server on http://0.0.0.0:8000
API Documentation: http://localhost:8000/docs
Alternative Docs: http://localhost:8000/redoc
======================================================================

INFO:     Started server process [1234]
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Backend is ready!**

### 4️⃣ Open Frontend Dashboard

In a new terminal:
```bash
cd frontend
python -m http.server 8000
```

Then open your browser:
```
http://localhost:8000/index_enhanced.html
```

### 5️⃣ Login to Dashboard

**Demo Credentials:**
- Username: `admin`
- Password: `admin123`

✅ **You're in!**

---

## 🎯 Next Steps

### Generate API Key for Your Service

1. Go to **API Keys** tab
2. Enter:
   - **Key Name**: "My Service"
   - **Service Name**: "auth-service"
3. Click **Generate Key**
4. Copy the key shown

### Send Test Logs

Using your API key, send logs to the system:

```bash
curl -X POST "http://localhost:8000/api/v1/logs/ingest?api_key=uls_xxxxx" \
  -H "Content-Type: application/json" \
  -d '[{
    "service_name": "auth-service",
    "log_level": "INFO",
    "message": "User authentication successful",
    "server_id": "server-01",
    "trace_id": "550e8400-e29b-41d4-a716-446655440000"
  }]'
```

### Create Alert Rule

1. Go to **Alerts** tab
2. Create rule:
   - **Name**: "High Error Rate"
   - **Level**: ERROR
   - **Alert Type**: Email
   - **Target**: your-email@example.com
3. Click **Create Alert Rule**

### View Logs & Analytics

1. **Dashboard** - See real-time overview
2. **Logs** - Search and filter logs
3. **Analytics** - View charts and statistics
4. **Settings** - Configure auto-refresh

---

## 🔧 Common Commands

### View API Documentation
```
http://localhost:8000/docs
```

### Check System Health
```bash
curl http://localhost:8000/health
```

### Get All Logs
```bash
curl "http://localhost:8000/api/v1/logs?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Export Logs to CSV
```bash
curl -X POST "http://localhost:8000/api/v1/logs/export/csv" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -o logs.csv
```

---

## 📱 Mobile App

The dashboard is fully responsive! Access on any device:
- Desktop: Full features
- Tablet: Optimized layout
- Mobile: Stack layout
- Offline: Limited functionality

---

## 🚀 Running Multiple Services

Example: If you have 3 services sending logs:

```javascript
// Service 1: Auth Service
const auth_logs = [{
  service_name: "auth-service",
  log_level: "INFO",
  message: "Token generated"
}];

// Service 2: Database Service
const db_logs = [{
  service_name: "database-service",
  log_level: "ERROR",
  message: "Connection timeout"
}];

// Service 3: API Gateway
const api_logs = [{
  service_name: "api-gateway",
  log_level: "WARNING",
  message: "Rate limit approaching"
}];
```

Each service sends to:
```
POST /api/v1/logs/ingest?api_key=SERVICE_API_KEY
```

---

## 🆘 Troubleshooting

### Problem: "Connection refused" to port 8000

**Solution:**
```bash
# Check if port 8000 is in use
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Use different port in main.py
# Change: app.run(port=8000) to app.run(port=8001)
```

### Problem: "Database is locked"

**Solution:**
```bash
# Close other connections
# Or delete and recreate database:
rm logging_system.db
python main.py
```

### Problem: Frontend shows "Connection failed"

**Solution:**
1. Ensure backend is running
2. Check CORS settings in `.env`
3. Try accessing http://localhost:8000/docs
4. Check browser console (F12) for errors

### Problem: API Key generation fails

**Solution:**
```bash
# Check database is initialized
python -c "from models import *; print('Database OK')"

# Verify token is valid
```

---

## 📊 Example Dashboard Data

After logging in, you'll see:
- ✅ **Statistics**: 0 Logs, 0 Errors (until you send logs)
- ✅ **Health**: 85% System Health
- ✅ **Recent Logs**: Empty (until logs arrive)
- ✅ **Services**: Ready to receive logs

Send some logs to see charts populate!

---

## 🎓 Learning Path

1. **Beginner**: Login → Generate API Key → Send test logs
2. **Intermediate**: Create alert rules → Configure filters → Export logs
3. **Advanced**: WebSocket integration → Multiple services → Custom analytics

---

## 📚 Full Documentation

For detailed information, see:
- `DOCUMENTATION_V2.md` - Complete reference
- `API_DOCUMENTATION.md` - All endpoints
- `CONFIGURATION.md` - Advanced configuration

---

## 💡 Tips & Tricks

**Tip 1**: Use trace IDs to track requests across logs
```json
{
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Processing request"
}
```

**Tip 2**: Batch logs for better performance
```
POST with 100-1000 logs per request
```

**Tip 3**: Use error codes for easier filtering
```json
{
  "error_code": "DB_TIMEOUT",
  "log_level": "ERROR"
}
```

**Tip 4**: Include metadata for context
```json
{
  "metadata": "{\"user_id\": 123, \"action\": \"login\"}",
  "message": "Action completed"
}
```

---

## 🎉 You're Ready!

Your Universal Logging System is running! 🚀

### What's Next?
- [ ] Login and explore dashboard
- [ ] Generate your first API key
- [ ] Send test logs
- [ ] Create an alert rule
- [ ] Export some logs
- [ ] Check out API documentation at `/docs`

---

## 🆘 Still Having Issues?

1. **Check logs**: `tail -f logs/app.log`
2. **Verify backend**: `curl http://localhost:8000/health`
3. **Test API**: `curl http://localhost:8000/docs`
4. **Review configuration**: `.env` file
5. **Check database**: `ls -la logging_system.db`

---

**Need help? Check DOCUMENTATION_V2.md for detailed information!**

Happy logging! 📝✨
