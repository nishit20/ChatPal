# MongoDB Setup for Persistent Data Storage

## Problem
Your app currently uses **in-memory MongoDB** which loses all data when the server restarts. This is why users can't login after logging out - their account data is lost.

## Solution: Use MongoDB Atlas (Free Cloud Database)

### Quick Setup (5 minutes):

1. **Go to MongoDB Atlas**: https://www.mongodb.com/cloud/atlas

2. **Create Free Account** (if you don't have one)
   - Sign up with email
   - Create password

3. **Create a Free Cluster**
   - Click "Create" after login
   - Choose "Free" tier (M0)
   - Select your preferred region
   - Wait for cluster to be created (5 minutes)

4. **Get Connection String**
   - Click "Connect" button
   - Choose "Drivers"
   - Copy the connection string that looks like:
     ```
     mongodb+srv://username:password@cluster0.mongodb.net/mydb?retryWrites=true&w=majority
     ```

5. **Update .env File**
   - Open `backend/.env`
   - Replace `MONGO_URI=` with your connection string:
     ```
     MONGO_URI=mongodb+srv://username:password@cluster0.mongodb.net/chatpal?retryWrites=true&w=majority
     ```

6. **Restart Backend**
   - Stop the running backend server
   - Run: `npm run dev` in the backend folder
   - The server will connect to your MongoDB Atlas database

7. **Test It**
   - Create an account in the app
   - Login successfully
   - Logout
   - Login again - your account should still exist!

## After Setup
- All user accounts will be saved permanently
- Groups and messages will persist even after server restarts
- You can manage your data from MongoDB Atlas dashboard

## Important Notes
- Free MongoDB Atlas has 512MB storage limit (plenty for testing)
- The connection string includes your username and password - never commit it to Git
- Keep `.env` file out of version control
