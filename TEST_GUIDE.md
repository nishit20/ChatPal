# Chat Application - Testing Guide

## ✅ Servers Running
- **Backend**: http://localhost:5000 (with in-memory MongoDB)
- **Frontend**: http://localhost:3000

## 🧪 Step-by-Step Testing

### 1. **Register New User**
- Go to http://localhost:3000
- Fill in the register form:
  - Full Name: `John Doe`
  - Username: `johndoe` (must be unique)
  - Phone Number: `+1234567890`
  - Password: `password123`
- Click **"Register"** button
- ✅ Expected: Form submits, user created, redirected to chat interface
- ❌ If error appears: Check browser console (F12) and backend terminal for error messages

### 2. **Login with Registered User**
- If redirected to login page, click **"Already have an account?"**
- Enter:
  - Username or Phone: `johndoe`
  - Password: `password123`
- Click **"Login"** button
- ✅ Expected: Redirected to chat interface with user name in header
- ❌ If error: Check if backend is responding (test health endpoint)

### 3. **Test Chat Interface**
Once logged in, you should see:
- **Sidebar** (left): Chats list, search bar, Contacts tab
- **Chat Window** (right): Message list, message input
- **Header**: User name, theme toggle button

### 4. **Open Browser Developer Tools** (F12)
Check:
- **Console**: Any errors? (look for red text)
- **Network**: Check `/api` requests to backend
- **Storage → LocalStorage**: Should see `user` and `token` keys

## 🔧 Debugging

### Backend Terminal Should Show:
```
✅ In-memory MongoDB connected (development mode)
🚀 Server running on port 5000
```

### Frontend Terminal Should Show:
```
VITE v5.4.21 ready in XXX ms
➜  Local:   http://localhost:3000/
```

### Test Backend Health Endpoint:
```powershell
curl http://127.0.0.1:5000/health
```

Should respond with:
```json
{"status":"ok","timestamp":"2025-12-15T..."}
```

### Test Login API Directly:
```powershell
$body = @{
    username = "johndoe"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://127.0.0.1:5000/api/auth/login" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

Should return JWT token and user data.

## 📋 Feature Checklist

- [ ] Register button works and creates user
- [ ] Login button works and redirects to chat
- [ ] Theme toggle button changes dark/light mode
- [ ] Chat list displays (may be empty initially)
- [ ] Can type in message input box
- [ ] Message bubbles appear when sent
- [ ] User search works
- [ ] Message timestamps display
- [ ] Read/unread status shows

## 🐛 Common Issues

**"Cannot POST /api/auth/register"**
- Backend not running - check port 5000

**"Cannot GET /api/chats"**
- Not authenticated - check if token is in localStorage
- Token expired - log out and login again

**"CORS error"**
- Vite proxy not working
- Check vite.config.js proxy target: `http://127.0.0.1:5000`

**"Module not found" in frontend**
- Run `npm install` in client folder

**"Cannot find module 'mongodb-memory-server'"**
- Run `npm install` in backend folder

## 🚀 Next Steps After Successful Testing

1. Test registering multiple users
2. Test message sending between users (requires two browser windows/tabs)
3. Implement real-time message updates (Socket.IO wiring)
4. Add message action buttons (reply, edit, delete, react)
5. Implement group chat UI
6. Add file upload preview

---

**Questions?** Check terminal outputs and browser console (F12) for error messages.
