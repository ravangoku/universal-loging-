# Configuration Guide

This document explains how to customize the Universal Logging System.

## Frontend Configuration

### File: `frontend/script.js`

#### API Connection Settings
```javascript
// Line 8-9
const API_BASE_URL = 'http://localhost:5000';
const LOGS_POLLING_INTERVAL = 2000; // milliseconds
```

**Options:**
- `API_BASE_URL`: Change this to point to a different backend server
- `LOGS_POLLING_INTERVAL`: How often to check for new logs (2000ms = 2 seconds)

**Example - External API:**
```javascript
const API_BASE_URL = 'http://api.example.com:5000';
```

**Example - Slower Log Polling:**
```javascript
const LOGS_POLLING_INTERVAL = 5000; // Check every 5 seconds
```

---

## Backend Configuration

### File: `backend/app.py`

#### Data Storage
```python
# Lines 13-14
INITIATIVES_FILE = 'initiatives.json'
LOGS_FILE = 'logs.json'
```

**Options:**
- Store in different directory: `'data/initiatives.json'`
- Use different names: `'initiatives_backup.json'`

**Example:**
```python
INITIATIVES_FILE = './data/initiatives.json'
LOGS_FILE = './data/logs.json'
```

#### Server Settings
```python
# Last line ~230
app.run(debug=True, host='0.0.0.0', port=5000)
```

**Options:**
- `debug=False` - Disable debug mode for production
- `host='0.0.0.0'` - Accept connections from anywhere (use '127.0.0.1' for localhost only)
- `port=5000` - Change to any available port

**Example - Production Settings:**
```python
app.run(debug=False, host='127.0.0.1', port=5000)
```

**Example - Different Port:**
```python
app.run(debug=True, host='0.0.0.0', port=8080)
```

#### Sample Data
To disable auto-loading of sample initiatives, comment out lines ~218-231:

```python
# Comment the block below to disable sample data
# if len(initiatives) == 0:
#     sample_initiatives = [...]
#     save_initiatives(sample_initiatives)
```

---

## Java Service Configuration

### File: `java-service/LoggingService.java`

#### API Connection
```java
// Lines 15-16
private static final String API_BASE_URL = "http://localhost:5000";
private static final String LOGS_ENDPOINT = "/api/logs";
```

**Example - Different Server:**
```java
private static final String API_BASE_URL = "http://api.example.com:5000";
```

#### Log Generation Settings
```java
// Lines 17-19
private static final int LOG_INTERVAL = 2000; // milliseconds
private static final int TOTAL_LOGS = 50; // Total logs to send
```

**Options:**
- `LOG_INTERVAL`: Delay between log entries (lower = faster)
- `TOTAL_LOGS`: How many logs to generate

**Example - Fast Testing:**
```java
private static final int LOG_INTERVAL = 100; // Send logs every 100ms
private static final int TOTAL_LOGS = 100;    // Send 100 logs total
```

**Example - Realistic Simulation:**
```java
private static final int LOG_INTERVAL = 5000; // One log every 5 seconds
private static final int TOTAL_LOGS = 100;     // Total 500 seconds of logs
```

#### Log Sources
```java
// Lines 22-30
private static final String[] LOG_SOURCES = {
    "AuthService",
    "DatabaseService",
    "APIGateway",
    // ...
};
```

**To Add New Source:**
```java
private static final String[] LOG_SOURCES = {
    "AuthService",
    "DatabaseService",
    "APIGateway",
    "CacheService",
    "NotificationService",
    "UserService",
    "AnalyticsService",
    "NewCustomService"  // Add here
};
```

#### Log Messages
```java
// Lines 32-60
private static final String[][] LOG_MESSAGES = {
    { "message1", "message2", ... },  // For source 0
    { "message1", "message2", ... },  // For source 1
    // ...
};
```

**To Add Messages for New Source:**
```java
private static final String[][] LOG_MESSAGES = {
    // ... existing messages ...
    {
        "Custom message 1",
        "Custom message 2",
        "Custom message 3"
    }
};
```

---

## CSS Customization

### File: `frontend/styles.css`

#### Theme Colors
```css
:root {
    --bg-primary: #0b0f1a;      /* Main background */
    --bg-secondary: #151b2b;     /* Card background */
    --bg-tertiary: #1f2937;      /* Hover background */
    --text-primary: #e8f0fe;     /* Main text */
    --text-secondary: #a0aec0;   /* Secondary text */
    --accent-blue: #60a5fa;      /* Primary accent */
    --accent-light: #93c5fd;     /* Light accent */
    /* ... other colors ... */
}
```

**Example - Light Theme:**
```css
:root {
    --bg-primary: #ffffff;
    --bg-secondary: #f5f5f5;
    --bg-tertiary: #eeeeee;
    --text-primary: #1a1a1a;
    --text-secondary: #666666;
    --accent-blue: #0066cc;
    --accent-light: #3399ff;
    --border-color: #cccccc;
}
```

**Example - Green Theme:**
```css
:root {
    --accent-blue: #10b981;
    --accent-light: #34d399;
}
```

#### Border Radius
```css
:root {
    --radius-sm: 6px;
    --radius-md: 8px;
    --radius-lg: 12px;
}
```

**Example - Sharper Corners:**
```css
--radius-sm: 2px;
--radius-md: 4px;
--radius-lg: 6px;
```

#### Shadows
```css
:root {
    --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
}
```

---

## Environment Variables (Advanced)

### Using Python Environment Variables

Edit `backend/app.py`:

```python
import os

# Read from environment
API_PORT = int(os.getenv('API_PORT', 5000))
API_HOST = os.getenv('API_HOST', '0.0.0.0')

app.run(debug=True, host=API_HOST, port=API_PORT)
```

Then run:
```bash
# Windows
set API_PORT=8080
python app.py

# macOS/Linux
export API_PORT=8080
python app.py
```

---

## Multiple Environments

### Development Setup
Edit three files to use port 5000:
- `backend/app.py` - port=5000
- `frontend/script.js` - API_BASE_URL='http://localhost:5000'
- `java-service/LoggingService.java` - API_BASE_URL="http://localhost:5000"

### Production Setup
1. Build database instead of JSON
2. Disable debug mode
3. Use HTTPS
4. Set host to specific IP or domain
5. Implement authentication

---

## Performance Tuning

### For High-Traffic Systems

**Backend (`app.py`):**
```python
# Increase log retention
MAX_LOGS = 10000  # Store more logs

# Add connection pooling
# Implement caching
```

**Frontend (`script.js`):**
```javascript
// Increase polling interval to reduce server load
const LOGS_POLLING_INTERVAL = 5000; // 5 seconds instead of 2
```

**Java Service:**
```java
// Adjust batch sizes
private static final int TOTAL_LOGS = 1000;
private static final int LOG_INTERVAL = 100;
```

---

## Debugging

### Enable Verbose Logging

**Backend:**
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend (Browser Console):**
```javascript
// Already includes console.log statements
// Open Developer Tools (F12) to see logs
```

**Java:**
```java
// Add debug prints
System.out.println("POST to: " + url);
System.out.println("Payload: " + jsonPayload);
```

---

## Database Migration

To use SQLite instead of JSON:

**File: `backend/app.py` - Replace data functions:**

```python
import sqlite3

def init_database():
    conn = sqlite3.connect('app.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE if not exists initiatives
                 (id INTEGER PRIMARY KEY, category TEXT, name TEXT, problem TEXT, created_at TEXT)''')
    conn.commit()
    conn.close()

def load_initiatives():
    conn = sqlite3.connect('app.db')
    c = conn.cursor()
    c.execute('SELECT * FROM initiatives')
    initiatives = c.fetchall()
    conn.close()
    return initiatives
```

---

## Common Customizations Checklist

- [ ] Change API port
- [ ] Customize theme colors
- [ ] Add new log sources
- [ ] Modify log generation frequency
- [ ] Update sample data
- [ ] Change polling interval
- [ ] Customize CSS animations
- [ ] Add custom log messages

---

For more help, see:
- `README.md` - Complete documentation
- `API_DOCUMENTATION.md` - API endpoints
