# Backend-Only Deployment Guide

## 🚀 Deploy TaskFlow Backend Only

### Option 1: Railway (Recommended for Backend)

1. **Create Railway Account**: Go to [railway.app](https://railway.app)
2. **New Project**: Click "Deploy from GitHub repo"
3. **Select Repository**: Choose your TaskFlow repository
4. **Configure Root Directory**: 
   - Set root directory to `backend`
   - Or deploy from backend folder specifically

#### Railway Environment Variables:
```bash
NODE_ENV=production
PORT=$PORT
MONGODB_URI=your-mongodb-atlas-connection-string
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
JWT_EXPIRE=30d
JWT_COOKIE_EXPIRE=30
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_EMAIL=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
CLIENT_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

### Option 2: Render

1. **Create Render Account**: Go to [render.com](https://render.com)
2. **New Web Service**: Connect your GitHub repo
3. **Configuration**:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: 18

### Option 3: Heroku

1. **Install Heroku CLI**
2. **From your backend directory**:
```bash
cd backend
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your-mongodb-connection
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_EMAIL=your-email@gmail.com
heroku config:set SMTP_PASSWORD=your-app-password
git push heroku main
```

### Option 4: DigitalOcean App Platform

1. **Create DigitalOcean Account**
2. **App Platform**: Create new app from GitHub
3. **Configure**:
   - **Source Directory**: `/backend`
   - **Build Command**: `npm ci`
   - **Run Command**: `npm start`

## Prerequisites for Backend Deployment

### 1. MongoDB Atlas Setup
```bash
# Create free cluster at https://mongodb.com/atlas
# Get connection string:
mongodb+srv://username:password@cluster.mongodb.net/taskflow
```

### 2. Gmail App Password
```bash
# Enable 2FA on Gmail
# Generate App Password at: https://myaccount.google.com/apppasswords
# Use 16-character password in SMTP_PASSWORD
```

### 3. Test Backend Locally
```bash
cd backend
npm install
npm start
# Visit: http://localhost:5001/api/health
```

## Backend API Endpoints

Once deployed, your backend will provide:

- `GET /api/health` - Health check
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Get current user
- `GET /api/projects` - Get projects
- `GET /api/tasks` - Get tasks
- And more...

## Testing Your Deployed Backend

### 1. Health Check
```bash
curl https://your-backend-url.railway.app/api/health
```

### 2. Test Registration
```bash
curl -X POST https://your-backend-url.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## Common Backend-Only Deployment Issues

### Issue: "Cannot GET /"
**Solution**: Your backend doesn't serve the root route. Use `/api/health` instead.

### Issue: CORS Errors
**Solution**: Update `CLIENT_URL` and `FRONTEND_URL` environment variables.

### Issue: Database Connection Failed
**Solution**: 
- Check MongoDB Atlas network access (allow all IPs: 0.0.0.0/0)
- Verify connection string format
- Ensure database user has read/write permissions

### Issue: Email Service Not Working
**Solution**:
- Verify Gmail 2FA is enabled
- Generate new App Password
- Check SMTP environment variables

## Backend Deployment Checklist

- [ ] MongoDB Atlas database created
- [ ] Gmail App Password generated  
- [ ] Environment variables configured
- [ ] Backend builds and starts locally
- [ ] Health endpoint responds
- [ ] CORS configured for your frontend domain
- [ ] Database user has proper permissions
- [ ] Network access configured in MongoDB Atlas

Your backend will be accessible at the provided URL and can be used by any frontend application!