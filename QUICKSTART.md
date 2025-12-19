# 🎯 Telegram Clone - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ (with npm)
- **Port 3000** (frontend) and **5000** (backend) available
- **Windows PowerShell** or any terminal

### Installation & Running

#### 1️⃣ **Backend Setup**
```powershell
cd "c:\chatgpt pal project\backend"
npm install
node server.js
```

**Expected Output:**
```
Starting in-memory MongoDB for development...
MongoDB URI created, connecting...
✅ In-memory MongoDB connected (development mode)

🚀 Server running on port 5000
📡 API: http://localhost:5000/api
🔍 Health: http://localhost:5000/health
```

#### 2️⃣ **Frontend Setup** (in new terminal)
```powershell
cd "c:\chatgpt pal project\client"
npm install
npm run dev
```

**Expected Output:**
```
VITE v5.4.21  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### 3️⃣ **Open in Browser**
```
👉 http://localhost:3000
```

---

## 📝 Testing the Features

### **Step 1: Register Your First Account**
1. Open http://localhost:3000
2. Click **"New to Telegram Clone?"** → **"Create Account"**
3. Fill in:
   - **Name**: John Doe
   - **Username**: johndoe (must be unique)
   - **Phone**: +1234567890
   - **Password**: password123
4. Click **"Register"**
5. ✅ Redirected to chat interface with greeting

### **Step 2: Register a Second Account** (for testing chat)
- Open another browser tab (or private window)
- Repeat registration with different credentials:
  - **Name**: Jane Smith
  - **Username**: janesmith
  - **Phone**: +0987654321
  - **Password**: password123

### **Step 3: Test Direct Messaging**
1. **In First Account (John)**:
   - Click search bar at top of sidebar
   - Type "jane" (search for Jane)
   - Click on "Jane Smith" in results
   - Type message: "Hi Jane!"
   - Press Enter or click 📤 button
   - ✅ Message appears on right side (blue bubble)

2. **In Second Account (Jane)**:
   - Chat appears in sidebar automatically
   - Message appears on left side (gray bubble)
   - Type reply: "Hi John!"
   - ✅ Real-time sync - message appears in John's window instantly

### **Step 4: Test Message Actions** (hover over message)
When you hover over any message, a menu appears:
- **😊** - Open emoji reactions
- **↩️** - Reply to message
- **✏️** - Edit message (only your own)
- **🗑️** - Delete message (only your own)
- **↗️** - Forward message

**Try it:**
1. Hover over any message
2. Click 😊 to open reactions
3. Select ❤️ - reaction count shows on message
4. Click ↩️ - reply preview appears above input
5. Click ✏️ (on your own message) - edit text
6. Click 🗑️ - message shows "[deleted]"

### **Step 5: Test Typing Indicators**
1. In one account, start typing in message input
2. ✅ Other account shows "is typing..." animation
3. Stop typing for 3 seconds
4. ✅ Typing indicator disappears

### **Step 6: Test Online Status** 🟢
- Green dot next to user name = Online
- Gray dot = Offline
- Visible in sidebar, header, and search results
- Updates when user joins/leaves

### **Step 7: Test Group Chat**
1. Click **➕** button in sidebar header
2. "New Group" modal opens
3. Enter **Group Name**: "My Squad"
4. In search, type username (e.g., "jane")
5. Click user to add (checkbox appears)
6. Click **"Create Group"**
7. ✅ New group appears in chat list
8. Select it and send messages
9. Messages show sender name in group chat

### **Step 8: Test File Upload**
1. Click **📎** attachment button in message input
2. Select an image file
3. ✅ Image preview appears above input
4. Click **X** to remove or leave to send
5. Click **📤** Send
6. ✅ Image displays in message bubble

### **Step 9: Test Dark Mode** 🌙
- Click **🌙** button in header
- ✅ All colors invert to dark theme
- Click again to toggle back to light
- Theme persists after refresh

### **Step 10: Test Message Status** ✓
- After sending message, shows ✓ (sent)
- After recipient receives, shows ✓✓ (delivered)
- After recipient reads, shows ✓✓ in blue (read)

---

## 🎮 Interactive Demo Script

**Open 2 browser windows/tabs side by side:**

```
LEFT WINDOW: John's Account    |    RIGHT WINDOW: Jane's Account
├─ Login as johndoe             |    ├─ Login as janesmith
├─ Search "jane" → click Jane   |    ├─ See chat appear in sidebar
├─ Type: "Hey, how are you?"    |    ├─ See message appear (left)
├─ Press Enter → Message sent   |    ├─ Type: "Great! You?"
└─ See reply appear instantly   |    └─ See message in John's window

[Continue conversation to test all features]
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────┐
│           Browser (Port 3000)           │
│  ┌────────────────────────────────────┐ │
│  │  React App (ChatLayout + Components)  │
│  │  ├─ Sidebar (chats, search, groups)   │
│  │  ├─ ChatWindow (messages, header)     │
│  │  ├─ MessageList (with actions)        │
│  │  └─ MessageInput (type, attach)       │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
  │ REST API (/api)         │ WebSocket (Socket.IO)
  │ (HTTP)                  │ (Real-time events)
  ▼                         ▼
┌─────────────────────────────────────────┐
│         Node.js Server (Port 5000)      │
│  ┌────────────────────────────────────┐ │
│  │  Express Routes (/api/*)           │ │
│  │  ├─ /auth (register, login)        │ │
│  │  ├─ /chats (messages, create)      │ │
│  │  ├─ /groups (create, members)      │ │
│  │  └─ /upload (files)                │ │
│  └────────────────────────────────────┘ │
│  ┌────────────────────────────────────┐ │
│  │  Socket.IO Server                  │ │
│  │  ├─ send_message                   │ │
│  │  ├─ receive_message                │ │
│  │  ├─ typing / stop_typing           │ │
│  │  ├─ react_message                  │ │
│  │  ├─ user_online / user_offline     │ │
│  │  └─ message_read / message_reacted │ │
│  └────────────────────────────────────┘ │
└─────────────────────────────────────────┘
  │
  ▼
┌─────────────────────────────────────────┐
│      MongoDB (In-Memory for Dev)        │
│  ├─ Users (name, username, phone, pwd)  │
│  ├─ Chats (members, messages, groups)   │
│  ├─ Messages (content, reactions, etc)  │
│  └─ Groups (name, members, admin)       │
└─────────────────────────────────────────┘
```

---

## 🔧 Troubleshooting

### **"Cannot GET /api"**
- ❌ Backend not running
- ✅ Run `node server.js` in backend folder
- ✅ Check port 5000 is listening

### **"This site can't be reached"**
- ❌ Frontend not running
- ✅ Run `npm run dev` in client folder
- ✅ Check port 3000 is listening

### **"Module not found"**
- ❌ Dependencies not installed
- ✅ Run `npm install` in project folder

### **Login always fails**
- ❌ Wrong credentials
- ✅ Check username and password match registered account
- ✅ Usernames are case-sensitive

### **Messages not appearing**
- ❌ Socket.IO connection failed
- ✅ Check browser console (F12) for errors
- ✅ Backend terminal should show "socket connected"

### **Port already in use**
- ❌ Process still running from before
- ✅ `Stop-Process -Name node -Force` to kill all node processes

---

## 🎨 UI Layout

```
┌──────────────────────────────────────────────────────┐
│  Telegram Clone                          🌙 ⚙️      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌──────────────────────────────┐  │
│  │   SIDEBAR   │  │      CHAT WINDOW            │  │
│  │             │  │ ┌────────────────────────────┤  │
│  │ 👤 Profile  │  │ │ User Info | Online Status │  │
│  │             │  │ ├────────────────────────────┤  │
│  │ 🔍 Search   │  │ │                            │  │
│  │             │  │ │   Message Bubbles          │  │
│  │ ➕ New Group│  │ │   - Left: Others (gray)    │  │
│  │             │  │ │   - Right: You (blue)      │  │
│  │ 💬 Chats    │  │ │   - Hover: Actions menu    │  │
│  │ 👥 Contacts │  │ │   - Status: ✓ ✓✓ ✓✓🔵    │  │
│  │             │  │ │                            │  │
│  │ ┌─────────┐ │  │ │                            │  │
│  │ │ Chat 1  │ │  │ ├────────────────────────────┤  │
│  │ │ Chat 2  │ │  │ │ ⌨️ Typing...              │  │
│  │ │ Group 1 │ │  │ ├────────────────────────────┤  │
│  │ │ Chat 3  │ │  │ │ 📎  [Type message...] 📤  │  │
│  │ └─────────┘ │  │ │ 😊                         │  │
│  │             │  │ └────────────────────────────┘  │
│  └─────────────┘  └──────────────────────────────────┘
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## ✨ Features Checklist

✅ **Messaging**
- Direct 1-to-1 chats
- Group chats
- Real-time message sync
- Message history

✅ **Message Actions**
- Reply with quote
- Edit messages
- Delete messages
- Emoji reactions (6 types)
- Forward (coming soon)

✅ **User Features**
- User search
- Online/offline status
- Typing indicators
- Profile display
- Last seen time

✅ **Files & Media**
- Image upload & preview
- File attachment
- Image display in chat

✅ **UI/UX**
- Dark/light mode
- Smooth animations
- Telegram Web design
- Responsive layout
- Error messages

---

## 📚 API Endpoints Reference

### Auth
```
POST   /api/auth/register    { name, username, phoneNumber, password }
POST   /api/auth/login       { credential, password }
```

### Chats
```
GET    /api/chats            Get all user's chats
POST   /api/chats/create     { members: [userId] }
GET    /api/chats/:id        Get specific chat
GET    /api/chats/:id/messages  Get chat messages
```

### Groups
```
POST   /api/groups/create    { name, members: [userId] }
POST   /api/groups/:id/addMember { userId }
```

### Users
```
GET    /api/users/:id        Get user profile
GET    /api/users/search?q=search_term  Search users
```

### Files
```
POST   /api/upload           Upload file (multipart/form-data)
```

---

## 🎓 Next Steps

1. **Invite friends** - Share your chat app with others
2. **Extend features** - Add voice/video calls, message search, etc.
3. **Production** - Deploy to cloud (Heroku, Vercel, etc.)
4. **Database** - Switch to MongoDB Atlas for production
5. **Security** - Add HTTPS, rate limiting, input validation

---

## 📞 Support

- Check **browser console** (F12) for error messages
- Check **backend terminal** for server logs
- Review `FEATURES.md` for technical details
- Check `TEST_GUIDE.md` for testing scenarios

---

**Made with ❤️ using React, Node.js, Socket.IO, and Tailwind CSS**
