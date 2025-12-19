# ChatPal Deployment Guide

## Step 1: MongoDB Atlas Setup (FREE)
✅ **Already created an account?**

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or login
3. Create a new project
4. Click "Build a Database"
5. Select **FREE tier (M0 Cluster)**
6. Choose your nearest region
7. Wait for cluster to be ready (2-3 min)
8. Click "CONNECT"
9. Choose "Drivers"
10. Copy your connection string

**YOUR CONNECTION STRING WILL LOOK LIKE:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/chatpal?retryWrites=true&w=majority
```

## Step 2: Add MongoDB URI to Backend

After getting your connection string:

1. Open `backend/.env`
2. Find the line: `MONGO_URI=`
3. Paste your connection string there
4. **IMPORTANT:** Make sure username and password are correct
5. Save the file

## Step 3: Test Locally

Run the backend:
```
cd backend
npm start
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

## Step 4: Deploy Backend (Render.com - FREE)

1. Go to https://render.com
2. Sign up with GitHub (or email)
3. Click "New +" → "Web Service"
4. Connect your GitHub repo (or upload manually)
5. Fill in:
   - **Name:** chatpal-backend
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
6. Click "Advanced"
7. Add Environment Variable:
   - **Key:** `MONGO_URI`
   - **Value:** Paste your MongoDB connection string
8. Also add:
   - **Key:** `JWT_SECRET`
   - **Value:** `supersecret_jwt_key_12345`
9. Click "Create Web Service"
10. Wait for deployment (5-10 min)
11. Copy the deployed URL (e.g., `https://chatpal-backend.onrender.com`)

## Step 5: Update Frontend API URL

1. Open `client/.env` (create if doesn't exist)
2. Add:
```
VITE_API_BASE_URL=https://your-deployed-backend-url
```

Replace with your actual Render.com URL.

3. Open `client/src/services/api.js` (or where API calls are made)
4. Update the base URL to use your Render deployment

## Step 6: Deploy Frontend (Vercel - FREE)

1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repo (or upload)
5. Select "Create React App" (or Vite)
6. Fill in:
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
7. Add Environment Variable:
   - **Name:** `VITE_API_BASE_URL`
   - **Value:** Your Render backend URL
8. Click "Deploy"
9. Wait for build (3-5 min)
10. Get your Vercel URL (e.g., `https://chatpal.vercel.app`)

## Done! 🎉

Your app is now live at:
- **Frontend:** https://chatpal.vercel.app (or your Vercel URL)
- **Backend:** https://chatpal-backend.onrender.com (or your Render URL)
- **Database:** MongoDB Atlas (FREE tier)

## Troubleshooting

**"Invalid credentials" on login?**
- Make sure MongoDB URI is correct in backend .env
- Check username/password matches your MongoDB Atlas setup

**"Cannot reach backend" on frontend?**
- Check VITE_API_BASE_URL is correct
- Make sure Render deployment is active

**Need help?**
- Check Render logs: Dashboard → Your Service → Logs
- Check Vercel logs: Dashboard → Your Project → Deployments
- Check MongoDB Atlas status: Atlas Dashboard → Database Status
