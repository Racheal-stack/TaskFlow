@echo off
echo.
echo 🚀 TaskFlow Backend Deployment Setup
echo.
echo 📋 Pre-deployment Checklist:
echo   □ MongoDB Atlas database created
echo   □ Gmail app password generated  
echo   □ All environment variables ready
echo.
echo 🎯 Quick Deployment Options:
echo.
echo 1️⃣  RAILWAY (Recommended)
echo    - Go to https://railway.app
echo    - New Project → Deploy from GitHub
echo    - Select TaskFlow repository
echo    - Set Root Directory: backend
echo    - Add environment variables
echo    - Deploy!
echo.
echo 2️⃣  RENDER
echo    - Go to https://render.com
echo    - New Web Service
echo    - Connect TaskFlow repository
echo    - Root Directory: backend
echo    - Build Command: npm install
echo    - Start Command: npm start
echo.
echo 📝 Required Environment Variables:
echo    NODE_ENV=production
echo    PORT=$PORT
echo    MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/taskflow
echo    JWT_SECRET=your-32-character-secret-key
echo    JWT_EXPIRE=30d
echo    JWT_COOKIE_EXPIRE=30
echo    SMTP_HOST=smtp.gmail.com
echo    SMTP_PORT=587
echo    SMTP_EMAIL=your-email@gmail.com
echo    SMTP_PASSWORD=your-gmail-app-password
echo    CLIENT_URL=http://localhost:3000
echo    FRONTEND_URL=http://localhost:3000
echo.
echo ✅ Files ready for deployment:
echo    ✓ package.json (with engines)
echo    ✓ server.js (main entry point)
echo    ✓ Dockerfile (for containerized deployment)
echo    ✓ railway.toml (Railway configuration)
echo.
echo 🧪 After deployment, test with:
echo    Visit: https://your-backend-url.com/api/health
echo.
echo 📖 Full deployment guide: BACKEND-DEPLOYMENT.md
pause