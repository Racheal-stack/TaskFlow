# 🚀 TaskFlow Deployment Guide

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) [RECOMMENDED]

#### Backend Deployment on Railway:
1. **Create Railway Account:** Go to [railway.app](https://railway.app) and sign up
2. **Connect GitHub:** Link your GitHub repository
3. **Create New Project:** 
   - Click "Deploy from GitHub repo"
   - Select your TaskFlow repository
   - Choose the `backend` folder as root directory
4. **Add Environment Variables:**
   ```
   NODE_ENV=production
   PORT=5001
   MONGODB_URI=your-mongodb-atlas-uri
   JWT_SECRET=your-secure-jwt-secret
   JWT_EXPIRE=30d
   JWT_COOKIE_EXPIRE=30
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   CLIENT_URL=https://your-frontend-url.vercel.app
   FRONTEND_URL=https://your-frontend-url.vercel.app
   ```
5. **Deploy:** Railway will automatically build and deploy

#### Frontend Deployment on Vercel:
1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```
2. **Login to Vercel:**
   ```bash
   vercel login
   ```
3. **Deploy from frontend directory:**
   ```bash
   cd frontend
   vercel --prod
   ```
4. **Add Environment Variables in Vercel Dashboard:**
   - `VITE_API_URL=https://your-backend-url.railway.app/api`

### Option 2: Docker Deployment

#### Prerequisites:
- Docker and Docker Compose installed
- MongoDB Atlas account (or local MongoDB)

#### Steps:
1. **Create docker-compose.yml:**
   ```yaml
   version: '3.8'
   services:
     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       ports:
         - "5001:5001"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=your-mongodb-uri
         - JWT_SECRET=your-jwt-secret
         - CLIENT_URL=http://localhost:3000
       volumes:
         - ./backend/uploads:/app/uploads
     
     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       ports:
         - "3000:3000"
       environment:
         - VITE_API_URL=http://localhost:5001/api
       depends_on:
         - backend
   ```

2. **Deploy:**
   ```bash
   docker-compose up --build -d
   ```

### Option 3: Render (Full Stack)

#### Backend on Render:
1. **Create Render Account:** Go to [render.com](https://render.com)
2. **New Web Service:** Connect GitHub repository
3. **Configuration:**
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Add Environment Variables** (same as Railway)

#### Frontend on Render:
1. **New Static Site:** Connect same repository
2. **Configuration:**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Publish Directory: `dist`

## Database Setup (MongoDB Atlas)

### Required for Production:
1. **Create MongoDB Atlas Account:** [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. **Create Cluster:** Choose free tier
3. **Database Access:** Create user with read/write permissions
4. **Network Access:** Add your deployment platform IPs (or 0.0.0.0/0 for Railway/Vercel)
5. **Get Connection String:** Copy the connection URI
6. **Update Environment Variables:** Use the connection string in `MONGODB_URI`

## Pre-deployment Checklist

### Code Preparation:
- [ ] All environment variables configured
- [ ] MongoDB Atlas database set up
- [ ] Gmail app password generated
- [ ] Build passes locally (`npm run build` in frontend)
- [ ] Backend health check working (`/api/health`)

### Security:
- [ ] Strong JWT secret (minimum 32 characters)
- [ ] Production MongoDB credentials
- [ ] CORS origins properly configured
- [ ] Rate limiting enabled
- [ ] Helmet security headers configured

### Testing:
- [ ] Local build works
- [ ] API endpoints respond correctly
- [ ] Database connection successful
- [ ] Email service functional
- [ ] Socket.io connections work

## Environment Variables Reference

### Backend (.env):
```bash
NODE_ENV=production
PORT=5001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/taskflow
JWT_SECRET=your-very-long-and-secure-secret-key-here
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-16-char-app-password
CLIENT_URL=https://your-app.vercel.app
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env):
```bash
VITE_API_URL=https://your-backend.railway.app/api
```

## Quick Deploy Commands

### Railway (Backend):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway link
railway up
```

### Vercel (Frontend):
```bash
# From frontend directory
cd frontend
vercel --prod
```

## Monitoring & Logs

### Railway:
- Dashboard: Check deployment status and logs
- Metrics: Monitor CPU, memory, and network usage

### Vercel:
- Functions: Monitor serverless function performance
- Analytics: Track frontend performance

### MongoDB Atlas:
- Monitoring: Database performance metrics
- Alerts: Set up alerts for connection issues

## Common Deployment Issues

### Backend Issues:
- **Port binding:** Ensure `process.env.PORT` is used
- **MongoDB connection:** Check connection string and network access
- **Environment variables:** Verify all required vars are set
- **CORS errors:** Update CLIENT_URL and FRONTEND_URL

### Frontend Issues:
- **API calls failing:** Check VITE_API_URL environment variable
- **Build failures:** Verify all dependencies are installed
- **Routing issues:** Ensure SPA fallback is configured

### Database Issues:
- **Connection timeout:** Check MongoDB Atlas network access
- **Authentication failed:** Verify database user credentials
- **Database not found:** Ensure database name is correct

## Post-deployment

### Verify Deployment:
1. **Frontend:** Check if app loads at deployed URL
2. **Backend:** Test `/api/health` endpoint
3. **Database:** Try registering a new user
4. **Email:** Test password reset functionality
5. **Real-time:** Test task updates with multiple browser tabs

### Performance Optimization:
- Enable gzip compression
- Set up CDN for static assets
- Implement database indexing
- Monitor and optimize API response times

---

Need help with deployment? Check the troubleshooting section or create an issue on GitHub!