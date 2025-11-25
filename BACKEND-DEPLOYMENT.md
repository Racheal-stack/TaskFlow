# 🚀 TaskFlow Backend-Only Deployment Guide

## Quick Backend Deployment Options

### Option 1: Railway (Recommended for Backend)

#### Step 1: Prepare Backend for Deployment
```bash
cd backend
npm install
```

#### Step 2: Deploy to Railway
1. **Go to [railway.app](https://railway.app)** and create account
2. **New Project** → **Deploy from GitHub repo**
3. **Select Repository:** TaskFlow
4. **Root Directory:** Set to `backend`
5. **Add Environment Variables:**

**Required Environment Variables:**
```bash
NODE_ENV=production
PORT=$PORT
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

6. **Deploy** → Railway will build and deploy automatically

#### Step 3: Get Your API URL
- After deployment, Railway will provide a URL like: `https://taskflow-backend-production.up.railway.app`
- Your API will be available at: `https://your-app.railway.app/api`

---

### Option 2: Render (Backend Only)

#### Step 1: Go to [render.com](https://render.com)
1. **Create Account** and connect GitHub
2. **New Web Service** 
3. **Connect Repository:** TaskFlow
4. **Configuration:**
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node

#### Step 2: Environment Variables (Same as Railway)
Add all the environment variables listed above

#### Step 3: Deploy
- Click **Create Web Service**
- Render will build and deploy your backend

---

### Option 3: Heroku (Backend Only)

#### Prerequisites:
- Install [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)

#### Steps:
```bash
# Login to Heroku
heroku login

# Create app (from backend directory)
cd backend
heroku create taskflow-backend-your-name

# Add MongoDB Atlas addon or use existing MongoDB
heroku addons:create mongolab:sandbox

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=your-secret-key
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_EMAIL=your-email@gmail.com
heroku config:set SMTP_PASSWORD=your-app-password
heroku config:set CLIENT_URL=http://localhost:3000

# Deploy
git subtree push --prefix backend heroku main
```

---

## Database Setup (Required for All Options)

### MongoDB Atlas (Recommended)
1. **Create Account:** Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Create Cluster:** Choose free tier (M0)
3. **Database Access:** 
   - Create user with username/password
   - Set permissions to "Read and write to any database"
4. **Network Access:** 
   - Add IP address `0.0.0.0/0` (allows all IPs for cloud deployments)
5. **Connect:**
   - Click "Connect" → "Connect your application"
   - Copy connection string: `mongodb+srv://username:password@cluster.mongodb.net/taskflow`
   - Replace `<password>` with your actual password

---

## Testing Your Backend Deployment

### 1. Health Check
Visit: `https://your-backend-url.com/api/health`

Expected response:
```json
{
  "status": "OK",
  "message": "TaskFlow API is running",
  "timestamp": "2025-11-25T...",
  "version": "1.0.0"
}
```

### 2. Test Endpoints
- **GET** `/api/health` - Health check
- **POST** `/api/auth/register` - User registration
- **POST** `/api/auth/login` - User login
- **GET** `/api/users/me` - Get current user (requires auth)

### 3. Test with Frontend Locally
Update your frontend `.env` file:
```bash
VITE_API_URL=https://your-deployed-backend-url.com/api
```

---

## Backend-Only Deployment Files

### Create railway.toml (for Railway)
```toml
[build]
  builder = "NIXPACKS"

[deploy]
  startCommand = "npm start"
  restartPolicyType = "ON_FAILURE"
  restartPolicyMaxRetries = 10
```

### Update package.json (if needed)
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "build": "echo 'No build step required for backend'"
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
```

---

## Environment Variables Checklist

**Essential Variables:**
- [ ] `NODE_ENV=production`
- [ ] `PORT=$PORT` (Railway) or `PORT=5001` (others)
- [ ] `MONGODB_URI=mongodb+srv://...` (MongoDB Atlas)
- [ ] `JWT_SECRET=your-32-char-secret`
- [ ] `JWT_EXPIRE=30d`
- [ ] `JWT_COOKIE_EXPIRE=30`

**Email Variables (if using email features):**
- [ ] `SMTP_HOST=smtp.gmail.com`
- [ ] `SMTP_PORT=587`
- [ ] `SMTP_EMAIL=your-email@gmail.com`
- [ ] `SMTP_PASSWORD=your-app-password`

**CORS Variables:**
- [ ] `CLIENT_URL=http://localhost:3000` (for local frontend)
- [ ] `FRONTEND_URL=http://localhost:3000` (for local frontend)

---

## Troubleshooting Common Issues

### 1. Port Issues
**Error:** `Error: listen EADDRINUSE: address already in use`
**Solution:** Make sure your server.js uses `process.env.PORT`
```javascript
const PORT = process.env.PORT || 5001;
```

### 2. MongoDB Connection
**Error:** `MongoNetworkError: connection timed out`
**Solution:** 
- Check MongoDB Atlas network access (add 0.0.0.0/0)
- Verify connection string format
- Ensure username/password are correct

### 3. CORS Issues
**Error:** `Access to fetch at '...' from origin '...' has been blocked by CORS`
**Solution:** Update CORS configuration in server.js:
```javascript
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://your-frontend-url.com'
  ],
  credentials: true
}));
```

### 4. Environment Variables Not Loading
**Error:** `JWT_SECRET is not defined`
**Solution:** 
- Verify all environment variables are set in platform dashboard
- Check for typos in variable names
- Restart the service after adding variables

---

## Quick Deploy Commands

### Railway:
```bash
npm install -g @railway/cli
railway login
railway link
railway up
```

### Backend Test After Deployment:
```bash
# Test health endpoint
curl https://your-backend-url.com/api/health

# Test with your local frontend
# Update frontend/.env:
# VITE_API_URL=https://your-backend-url.com/api
```

---

Your backend will be accessible at the provided URL and ready to handle API requests from your local frontend or any other client!