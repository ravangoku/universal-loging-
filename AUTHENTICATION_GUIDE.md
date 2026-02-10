# Universal Logging System - Authentication System Summary

## ✅ Backend Authentication Implementation

### New Models Created

1. **User Model** (`backend/src/models/User.js`)
   - Fields: email (unique), name, password (bcrypt hashed), role (user/admin)
   - Pre-save hook: Automatically hashes passwords with bcryptjs
   - Method: `comparePassword()` for login validation

2. **Session Model** (`backend/src/models/Session.js`)
   - Tracks active user sessions
   - Fields: userId, email, name, role, loginTime, logoutTime, isActive
   - TTL index: Sessions auto-expire after 24 hours

### Authentication Endpoints

All endpoints return JWT tokens signed with `JWT_SECRET` for subsequent API requests.

#### POST `/api/auth/signup`
- **Request**: `{ name, email, password }`
- **Response**: `{ token, user: { id, email, name, role } }`
- **Features**: 
  - Validates email uniqueness
  - Hashes password with bcryptjs
  - Creates session automatically
  - Role defaults to 'user'

#### POST `/api/auth/login`
- **Request**: `{ email, password }`
- **Response**: `{ token, user: { id, email, name, role } }`
- **Features**:
  - Validates credentials against MongoDB User collection
  - Supports hardcoded admin account: `sriram@gmail.com / ram557`
  - Auto-creates admin user on first login if not found
  - Creates/updates session on successful login

#### POST `/api/auth/logout`
- **Auth Required**: Bearer token
- **Action**: Marks active sessions as inactive
- **Response**: `{ success: true }`

### Admin Endpoints

#### GET `/api/admin/stats`
- **Auth Required**: Bearer token (admin role only)
- **Response**:
  ```json
  {
    "totalUsers": 10,
    "activeUsers": 3,
    "sessions": [
      {
        "userId": "...",
        "email": "user@example.com",
        "name": "User Name",
        "loginTime": "2024-...",
        "duration": 3600000
      }
    ]
  }
  ```

## ✅ Frontend Integration

### Authentication Flow

1. **Signup**: `POST /api/auth/signup` → Stores JWT + user in localStorage → Shows dashboard
2. **Signin**: `POST /api/auth/login` → Stores JWT + user in localStorage → Shows dashboard  
3. **Session Persistence**: JWT and user object stored in localStorage across page refreshes
4. **Logout**: `POST /api/auth/logout` → Clears localStorage → Shows login page

### Key Frontend Changes (`frontend/script.js`)

- **Removed**: All localStorage-based user storage (no fake auth database)
- **Added**: Real API calls to backend endpoints
- **Added**: Proper JWT token management and Bearer token headers
- **Storage**: Only stores JWT token and user metadata in localStorage now
- **Admin Panel**: Fetches real stats from `GET /api/admin/stats` every 3 seconds

### Demo Credentials

**Email**: `sriram@gmail.com`  
**Password**: `ram557`

- Both user and admin can register via signup form
- Admin account is hardcoded and auto-created on first login
- All other signups create regular 'user' role accounts

## ✅ Configuration

### Required Environment Variables (`.env`)
```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/uls
JWT_SECRET=dev-secret
```

### Dependencies Added
- `bcryptjs`: Password hashing and comparison
- All other dependencies already in package.json

## ✅ Database Schema

### Users Collection
```
{
  _id: ObjectId,
  email: String (unique, lowercase),
  name: String,
  password: String (bcrypt hashed),
  role: String ("user" | "admin"),
  createdAt: Date
}
```

### Sessions Collection
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  email: String,
  name: String,
  role: String,
  loginTime: Date,
  logoutTime: Date (nullable),
  isActive: Boolean,
  createdAt: Date (TTL: 86400 seconds = 24 hours)
}
```

## ✅ Security Features

1. **Password Hashing**: bcryptjs with salt rounds (10)
2. **JWT Tokens**: Signed with JWT_SECRET, 12-hour expiration
3. **Session Tracking**: Server-side session management with TTL auto-cleanup
4. **Role-Based Access**: Admin-only endpoints validated via JWT payload
5. **Email Uniqueness**: MongoDB unique index prevents duplicate accounts

## 🚀 How to Deploy

1. Install dependencies: `npm install` in backend directory
2. Set MongoDB connection: Update `MONGODB_URI` in `.env`
3. Set JWT secret: Change `JWT_SECRET` to strong random value
4. Start server: `npm start` or `npm run dev` (development with nodemon)
5. Server runs on: `http://localhost:4000`
6. Frontend auto-served at root: `http://localhost:4000/`

## ✅ Complete Feature List

- [x] Email/password signup with validation
- [x] Email/password signin with validation
- [x] Password hashing with bcryptjs
- [x] JWT token generation and verification
- [x] Session tracking (login/logout with timestamps)
- [x] Role-based access control (user vs admin)
- [x] Admin analytics dashboard with active user counts
- [x] Session list with duration calculation
- [x] Auto-logout on session expiration
- [x] Hardcoded admin account with email/password
- [x] User registration prevention for duplicate emails
- [x] Full frontend-backend integration
- [x] localStorage persistence across page refreshes
