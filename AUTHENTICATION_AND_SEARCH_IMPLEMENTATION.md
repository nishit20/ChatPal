# Authentication and User Search Implementation

## Overview
This document describes the complete implementation of email/mobile authentication and Telegram-style user search with chat initiation.

---

## PART 1: AUTHENTICATION SYSTEM

### 1. User Model (`backend/models/User.js`)

**Updated Schema:**
- `fullName` (string, required) - User's full name
- `username` (string, required, unique) - Unique username
- `email` (string, unique, optional) - Email address
- `phoneNumber` (string, unique, optional) - Phone number
- `passwordHash` (string, required) - Bcrypt hashed password
- `avatar` (string, default: '') - Profile picture URL
- `bio` (string, default: '') - User bio
- `isOnline` (boolean, default: false) - Online status
- `lastSeen` (Date) - Last seen timestamp

**Validation Rules:**
- Either `email` OR `phoneNumber` must exist
- `username` must always exist and be unique
- Unique indexes on `email`, `phoneNumber`, and `username`

**Backward Compatibility:**
- Pre-save middleware syncs old field names (`name`, `profilePicture`, `password`, `onlineStatus`) with new ones

### 2. Register API (`POST /api/auth/register`)

**Request Body:**
```json
{
  "fullName": "John Doe",
  "username": "johndoe",
  "email": "john@example.com",  // Optional
  "phoneNumber": "+1234567890",  // Optional
  "password": "securepassword"
}
```

**Logic:**
1. Validates required fields (fullName, username, password)
2. Ensures either email OR phoneNumber is provided
3. Validates email/phone format
4. Checks for existing user (username, email, or phone)
5. Hashes password using bcrypt (10 rounds)
6. Creates user with `isOnline: false` and `lastSeen: now`
7. Returns JWT token and user profile

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "avatar": "",
    "bio": "",
    "isOnline": false,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

### 3. Login API (`POST /api/auth/login`)

**Request Body:**
```json
{
  "identifier": "john@example.com",  // OR phone OR username
  "password": "securepassword"
}
```

**Logic:**
1. Accepts `identifier` field (email, phone, or username)
2. Searches user by:
   - `username == identifier`
   - `email == identifier`
   - `phoneNumber == identifier` (if formatted as phone)
3. Compares password using bcrypt
4. Updates `isOnline: true` and `lastSeen: now`
5. Returns JWT token and user profile

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user_id",
    "fullName": "John Doe",
    "username": "johndoe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "avatar": "",
    "bio": "",
    "isOnline": true,
    "lastSeen": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Auth Middleware (`backend/middleware/auth.js`)

**Functionality:**
- Reads JWT from `Authorization: Bearer <token>` header
- Verifies token using JWT_SECRET
- Attaches `req.user` (full user object) to request
- Protects private routes

**Usage:**
```javascript
router.get('/protected', auth, (req, res) => {
  // req.user is available here
});
```

### 5. Frontend Login Page (`client/src/views/LoginPage.jsx`)

**Features:**
- Single input field: "Email / Phone number / Username"
- Password input
- Login button
- Clean Telegram-style UI
- Error handling
- Saves JWT in localStorage via AuthContext
- Redirects to chat page on success

**Login Flow:**
1. User enters identifier (email/phone/username) and password
2. Calls `POST /api/auth/login` with `{ identifier, password }`
3. On success, saves token and user to localStorage
4. Redirects to chat interface

---

## PART 2: TELEGRAM-STYLE USER SEARCH

### 1. Search API (`GET /api/users/search?q=<query>`)

**Query Parameters:**
- `q` (string, min 2 chars) - Search query

**Logic:**
1. Validates query length (minimum 2 characters)
2. Excludes current logged-in user
3. Performs MongoDB search:
   - **Partial match** (case-insensitive regex) on:
     - `fullName`
     - `username`
   - **Exact match** on:
     - `phoneNumber` (if query looks like phone)
4. Returns maximum 20 users
5. Returns formatted user objects

**Response:**
```json
{
  "success": true,
  "users": [
    {
      "userId": "user_id",
      "fullName": "John Doe",
      "username": "johndoe",
      "avatar": "url_or_empty",
      "isOnline": true,
      "phoneNumber": "+1234567890",
      "email": "john@example.com"
    }
  ]
}
```

### 2. Search Controller (`backend/controllers/userController.js`)

**Implementation:**
- Uses MongoDB `$regex` for name/username search
- Uses exact match for phone numbers
- Filters out current user with `_id: { $ne: currentUserId }`
- Limits results to 20 users
- Returns only necessary fields (excludes password)

### 3. Frontend Search UI (`client/src/components/UserSearch.jsx`)

**Features:**
- Telegram-style search bar at top of sidebar
- **Debounced input** (300ms delay)
- Shows results while typing
- User cards display:
  - Avatar (or initial letter)
  - Full name
  - Username
  - Phone number (if available)
  - Online indicator
- Click on user triggers chat creation

**Debouncing:**
- Uses `useCallback` and `setTimeout` for 300ms delay
- Clears previous timer on each keystroke
- Prevents excessive API calls

### 4. Create or Get Chat API (`POST /api/chats/createOrGet`)

**Request Body:**
```json
{
  "userId": "target_user_id"
}
```

**Logic:**
1. Validates userId is provided
2. Checks if 1-on-1 chat already exists between current user and target user
3. If exists → returns existing chat
4. If not → creates new 1-on-1 chat with both users as members
5. Returns chat object with populated members

**Response:**
```json
{
  "success": true,
  "chat": {
    "_id": "chat_id",
    "isGroup": false,
    "members": [
      { "_id": "user1_id", "fullName": "User 1", ... },
      { "_id": "user2_id", "fullName": "User 2", ... }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "chatId": "chat_id",
  "isNew": true
}
```

### 5. Chat Flow Integration

**Frontend Flow (`client/src/views/ChatLayout.jsx`):**
1. User searches for friend using `UserSearch` component
2. User clicks on search result
3. `handleNewChat` is called with user object
4. Calls `POST /api/chats/createOrGet` with `{ userId }`
5. On success:
   - Adds chat to chats list (if new)
   - Opens chat window
   - Loads message history
   - Ready to send messages

**Integration Points:**
- `UserSearch` component in `EnhancedSidebar`
- `handleNewChat` in `ChatLayout` handles API call
- Chat window opens automatically after creation

---

## PART 3: SOCKET.IO INTEGRATION

### Socket Events

**Client → Server:**
- `join_chat` - Join a chat room
- `send_message` - Send a message
- `typing` - User is typing
- `stop_typing` - User stopped typing

**Server → Client:**
- `receive_message` - New message received
- `user_online` - User came online
- `user_offline` - User went offline

### User Online Status (`backend/server.js`)

**On Connection:**
- Sets `isOnline: true` in database
- Updates `lastSeen: now`
- Emits `user_online` event to all clients

**On Disconnect:**
- Sets `isOnline: false` in database
- Updates `lastSeen: now`
- Emits `user_offline` event to all clients

**Implementation:**
```javascript
io.on('connection', async (socket) => {
  if (socket.user?.id) {
    await User.findByIdAndUpdate(socket.user.id, { 
      isOnline: true, 
      lastSeen: new Date() 
    });
    io.emit('user_online', { userId: socket.user.id });
  }
  
  socket.on('disconnect', async () => {
    if (socket.user?.id) {
      await User.findByIdAndUpdate(socket.user.id, { 
        isOnline: false, 
        lastSeen: new Date() 
      });
      io.emit('user_offline', { userId: socket.user.id });
    }
  });
});
```

---

## FILE SUMMARY

### Backend Files Modified/Created:

1. **`backend/models/User.js`**
   - Updated schema with new field names
   - Added pre-save middleware for backward compatibility
   - Added unique indexes

2. **`backend/controllers/authController.js`**
   - Updated `register` to use `fullName` and `passwordHash`
   - Updated `login` to accept `identifier` field

3. **`backend/controllers/userController.js`**
   - Updated `searchUsers` to:
     - Exclude current user
     - Limit to 20 results
     - Return formatted user objects

4. **`backend/controllers/chatController.js`**
   - Added `createOrGetChat` function

5. **`backend/routes/chats.js`**
   - Added `POST /chats/createOrGet` route

6. **`backend/server.js`**
   - Updated Socket.IO to set `isOnline` status on connect/disconnect

### Frontend Files Modified/Created:

1. **`client/src/views/LoginPage.jsx`**
   - Updated to use single `identifier` input
   - Updated register to use `fullName`

2. **`client/src/components/UserSearch.jsx`**
   - Added debouncing (300ms)
   - Telegram-style UI
   - Shows online status

3. **`client/src/views/ChatLayout.jsx`**
   - Updated `handleNewChat` to call `createOrGet` API

4. **`client/src/components/EnhancedSidebar.jsx`**
   - Added `UserSearch` component to header

---

## HOW IT WORKS - COMPLETE FLOW

### Registration Flow:
1. User fills form: fullName, username, email/phone, password
2. Frontend calls `POST /api/auth/register`
3. Backend validates, hashes password, creates user
4. Returns JWT token
5. Frontend saves token, redirects to chat

### Login Flow:
1. User enters identifier (email/phone/username) and password
2. Frontend calls `POST /api/auth/login` with `{ identifier, password }`
3. Backend finds user by identifier, verifies password
4. Updates `isOnline: true`
5. Returns JWT token and user profile
6. Frontend saves token, redirects to chat

### Search & Chat Flow:
1. User types in search bar (min 2 chars)
2. After 300ms debounce, calls `GET /api/users/search?q=query`
3. Backend searches users, excludes current user, returns max 20
4. Frontend displays results in dropdown
5. User clicks on a result
6. Frontend calls `POST /api/chats/createOrGet` with `{ userId }`
7. Backend checks for existing chat, creates if needed
8. Returns chat object
9. Frontend adds chat to list, opens chat window
10. User can now send messages

### Online Status Flow:
1. User connects via Socket.IO
2. Server sets `isOnline: true` in database
3. Emits `user_online` event
4. All clients update UI to show user as online
5. On disconnect, sets `isOnline: false`
6. Emits `user_offline` event

---

## TESTING CHECKLIST

### Authentication:
- [ ] Register with email
- [ ] Register with phone number
- [ ] Register fails if email/phone missing
- [ ] Login with email
- [ ] Login with phone
- [ ] Login with username
- [ ] Login fails with wrong password
- [ ] JWT token is saved in localStorage
- [ ] Protected routes require valid token

### User Search:
- [ ] Search by name (partial match)
- [ ] Search by username (partial match)
- [ ] Search by phone (exact match)
- [ ] Search excludes current user
- [ ] Search returns max 20 users
- [ ] Search requires min 2 characters
- [ ] Debouncing works (300ms delay)

### Chat Creation:
- [ ] Clicking user in search creates chat
- [ ] Existing chat is returned (not duplicated)
- [ ] New chat is created if doesn't exist
- [ ] Chat opens automatically after creation
- [ ] Messages can be sent in new chat

### Online Status:
- [ ] User shows as online when connected
- [ ] User shows as offline when disconnected
- [ ] `isOnline` updates in database
- [ ] Other users see online status changes

---

## API ENDPOINTS SUMMARY

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login with identifier |
| GET | `/api/users/search?q=query` | Yes | Search users |
| POST | `/api/chats/createOrGet` | Yes | Create or get 1-on-1 chat |

---

## SECURITY NOTES

1. **Password Hashing:** All passwords are hashed using bcrypt (10 rounds)
2. **JWT Tokens:** Tokens expire after 30 days
3. **Input Validation:** Email and phone formats are validated
4. **Unique Constraints:** Username, email, and phone are unique
5. **Auth Middleware:** All protected routes require valid JWT token

---

## DEPENDENCIES

**Backend:**
- `bcrypt` - Password hashing
- `jsonwebtoken` - JWT token generation
- `mongoose` - MongoDB ODM

**Frontend:**
- `axios` - HTTP client
- `framer-motion` - Animations
- `socket.io-client` - WebSocket client

---

## NOTES

- The implementation maintains backward compatibility with existing code
- User model syncs old field names (`name`, `profilePicture`, etc.) with new ones
- Search is case-insensitive for names/usernames
- Phone number search is exact match only
- All API responses follow consistent format with `success` flag

