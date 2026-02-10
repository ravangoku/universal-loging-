# Deployment & Testing Guide

## Prerequisites

1. **Node.js** (v18+) & **npm** - [Download](https://nodejs.org/)
2. **MongoDB** - Either:
   - Local installation: [MongoDB Community](https://www.mongodb.com/try/download/community)
   - Cloud: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install all required packages including:
- express: Web framework
- mongoose: MongoDB ODM
- bcryptjs: Password hashing
- jsonwebtoken: JWT tokens
- socket.io: Real-time updates
- And more...

### 2. Configure Environment

Create/update `backend/.env`:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/uls
JWT_SECRET=your-super-secret-key-change-this
API_KEY=optional-api-key-for-direct-log-submission
RETENTION_DAYS=30
```

**For MongoDB Atlas** (cloud):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/uls?retryWrites=true&w=majority
```

### 3. Start MongoDB (if local)

**Windows (PowerShell as Admin)**:
```powershell
mongod
```

**Linux/Mac**:
```bash
mongod
```

MongoDB will run on `localhost:27017` by default.

### 4. Start Backend Server

```bash
npm start
```

Expected output:
```
ULS backend listening on 4000
MongoDB connected
```

Server will be available at: `http://localhost:4000`

## Testing the Authentication System

### 1. Open Frontend

Navigate to: `http://localhost:4000/`

### 2. Test Admin Login

**Demo Account**:
- Email: `sriram@gmail.com`
- Password: `ram557`

**Steps**:
1. Click "Sign In" tab
2. Enter credentials
3. Click "Sign In" button
4. Should see Admin Dashboard with stats

### 3. Test User Registration

**Steps**:
1. Click "Sign Up" tab
2. Fill in name, email, password
3. Click "Create Account"
4. Should be logged in as regular user
5. Should see User Dashboard with log submission form

### 4. Test Log Submission

**In User Dashboard**:
1. Fill in log form:
   - Service Name: e.g., "payment-service"
   - Log Level: Choose from dropdown
   - Server ID: e.g., "server-01"
   - Message: Any message
2. Click "Submit Log"
3. Click "Refresh Logs" to see submitted logs

### 5. Test Admin Stats

**As Admin User**:
1. Log in with admin account
2. View "Admin Dashboard" 
3. Stats should show:
   - Total Registered Users
   - Currently Logged In users
   - Active Sessions table with login times

### 6. Test Logout

1. Click "Logout" button in header
2. Should return to login page
3. Refresh page - should stay on login page (token cleared)

### 7. Test Session Persistence

1. Log in to application
2. Refresh page (F5)
3. Should remain logged in
4. Clear browser cookies/localStorage manually
5. Refresh page - should show login page

## API Endpoint Testing

Use **Postman** or **curl** to test APIs directly:

### Signup
```bash
curl -X POST http://localhost:4000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "token": "eyJhbGc...",
  "user": {
    "id": "65abc123...",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "user"
  }
}
```

### Login
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "sriram@gmail.com",
    "password": "ram557"
  }'
```

### Get Admin Stats (with token)
```bash
curl -X GET http://localhost:4000/api/admin/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

### Submit Log
```bash
curl -X POST http://localhost:4000/api/logs \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "timestamp": "2024-01-15T10:30:00Z",
    "service_name": "api-gateway",
    "log_level": "ERROR",
    "message": "Database connection timeout",
    "server_id": "prod-01",
    "trace_id": "abc-123-def"
  }'
```

### Get Logs with Filters
```bash
curl "http://localhost:4000/api/logs?service_name=api-gateway&log_level=ERROR" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE"
```

## Troubleshooting

### MongoDB Connection Error
```
MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: 
- Ensure MongoDB is running (`mongod`)
- Check `MONGODB_URI` in `.env`
- Verify MongoDB service is started

### Port 4000 Already in Use
```
listen EADDRINUSE :::4000
```
**Solution**:
- Change PORT in `.env`
- Or kill process: `npx kill-port 4000` (Windows) or `lsof -ti:4000 | xargs kill -9` (Linux/Mac)

### npm: command not found
**Solution**: 
- Install Node.js from https://nodejs.org/
- Restart terminal after installation

### CORS errors in console
**Solution**: 
- Backend must be running on `http://localhost:4000`
- Frontend must be accessed via `http://localhost:4000/` (not direct HTML file)

### Login fails with "Invalid email or password"
**Causes**:
- Wrong email/password (check demo: sriram@gmail.com / ram557)
- MongoDB not connected (check `MONGODB_URI`)
- Database empty - try signing up first

### Admin account not working
**Solution**:
- Admin is auto-created on first login attempt with email `sriram@gmail.com`
- Try logging in once to trigger creation
- Check MongoDB has User collection with admin account

## Development Workflow

### Hot Reload with Nodemon
```bash
npm run dev
```

Server will restart automatically when files change.

### Database Management

**View Collections** (MongoDB CLI):
```bash
mongo
> use uls
> db.users.find()
> db.sessions.find()
```

**Reset Database** (delete all data):
```bash
mongo
> use uls
> db.dropDatabase()
```

## Production Deployment Checklist

- [ ] Change `JWT_SECRET` to strong random value
- [ ] Set `MONGODB_URI` to production database
- [ ] Set `NODE_ENV=production`
- [ ] Ensure HTTPS is enabled
- [ ] Set up proper error logging
- [ ] Configure rate limiting
- [ ] Set up database backups
- [ ] Use environment variables for all secrets
- [ ] Set CORS origin to frontend domain
- [ ] Configure reverse proxy (nginx/Apache)
- [ ] Set up monitoring and alerts

## File Structure

```
sri/
├── backend/
│   ├── src/
│   │   ├── index.js           (Main server)
│   │   ├── config.js          (Configuration)
│   │   ├── middleware/
│   │   │   └── auth.js        (JWT verification)
│   │   ├── models/
│   │   │   ├── User.js        (NEW - User schema)
│   │   │   ├── Session.js     (NEW - Session tracking)
│   │   │   └── Log.js         (Log schema)
│   │   └── routes/
│   │       ├── auth.js        (UPDATED - Signup/Login/Logout)
│   │       ├── admin.js       (NEW - Admin endpoints)
│   │       └── logs.js        (Log submission/retrieval)
│   ├── package.json           (UPDATED - Added bcryptjs)
│   ├── .env                   (Configuration file)
│   └── README.md
├── frontend/
│   ├── index.html             (UPDATED - Demo credentials hint)
│   ├── style.css              (Unchanged)
│   └── script.js              (COMPLETELY REWRITTEN - Backend APIs)
└── AUTHENTICATION_GUIDE.md    (NEW - This file)
```

## Support & Troubleshooting

If you encounter issues:

1. Check browser console for JavaScript errors (F12)
2. Check backend terminal for server errors
3. Verify `.env` configuration
4. Check MongoDB is running and connected
5. Ensure all npm dependencies installed (`npm install`)
6. Restart backend server after changes
