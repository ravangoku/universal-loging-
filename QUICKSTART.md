# Quick Start Guide

## ⚡ Get Running in 5 Minutes

### Prerequisites Check
- ✅ Python 3.8+ installed
- ✅ Java JDK 11+ installed
- ✅ Modern web browser

### Start Here

#### Terminal 1: Start Python Backend (Keep Open)
```bash
cd backend
pip install -r requirements.txt
python app.py
```

Wait for message:
```
API Server running on: http://localhost:5000
```

#### Terminal 2: Open Frontend
```bash
cd frontend
python -m http.server 8000
```

Then open browser:
```
http://localhost:8000
```

#### Terminal 3: Send Logs (Java Service)
```bash
cd java-service
run.bat          # Windows
./run.sh         # macOS/Linux
```

### That's It! 🎉

You should now see:
- Dashboard loading
- Form to add initiatives
- Real-time logs appearing in the "Recent Logs" section
- Statistics updating

---

## 🎯 What to Do Next

### Add an Initiative
1. Fill in the form at the top
2. Click "Add Initiative"
3. See it appear in the table

### Check Logs
Watch the logs update as the Java service runs

### Explore API
```bash
curl http://localhost:5000/api/initiatives
curl http://localhost:5000/api/logs?limit=10
curl http://localhost:5000/api/health
```

---

## 🆘 Quick Troubleshooting

**Python not found?**
```bash
python3 -m pip install -r requirements.txt
python3 app.py
```

**Port 5000 in use?**
Edit `backend/app.py` last line, change port 5000 to 5001

**Java won't compile?**
- Install Java JDK (not JRE)
- Add Java bin folder to PATH

**Can't access dashboard?**
- Ensure all 3 services are running
- Check browser console (F12)

---

## 📞 Need Help?

See detailed docs:
- `README.md` - Full documentation
- `SETUP.md` - Installation guide
- `API_DOCUMENTATION.md` - API reference

---

## 🎨 Customizing

### Change Colors
Edit `frontend/styles.css` - Look for `:root` section

### Change Port
Edit `backend/app.py` - Last line:
```python
app.run(debug=True, host='0.0.0.0', port=5001)
```

### Change Log Frequency
Edit `java-service/LoggingService.java` - Line:
```java
private static final int LOG_INTERVAL = 2000; // Change this
```

---

Enjoy! 🚀
