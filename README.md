# TaskFlow

A comprehensive full-stack project and task management application built with the MERN stack (MongoDB, Express.js, React, Node.js).

## Overview

TaskFlow is a project management platform I built for teams to collaborate effectively. It combines real-time updates, task management, and analytics to streamline workflows. The application supports multiple workspaces, role-based access control, real-time notifications, file uploads, and meeting management.

**Repository Information:**
- **Primary Languages:** JavaScript (React, Node.js)
- **Lines of Code:** 2,200,000+
- **Architecture:** Full-stack web application with RESTful API and WebSocket support

## Features

- **Project Management** - Create and organize projects with custom statuses
- **Task Tracking** - Kanban board with drag-and-drop
- **Real-time Notifications** - WebSocket-based instant updates
- **Team Collaboration** - Workspace management and real-time sync
- **User Authentication** - JWT-based auth with email verification
- **Analytics & Caching** - Redis-powered dashboard for performance
- **File Uploads** - Attachment support for tasks
- **Meeting Management** - Schedule team meetings
- **Email Notifications** - Bull queue-based email system
- **Advanced Search** - Full-text search with autocomplete
- **RBAC** - Role-based access control
- **Dark/Light Mode** - Theme customization

## Tech Stack

**Frontend:**
- React 18 with Vite
- TailwindCSS for styling
- @dnd-kit for drag-and-drop
- Socket.io for real-time updates
- React Router for navigation

**Backend:**
- Node.js 18 with Express
- MongoDB with Mongoose
- JWT authentication
- Socket.io for WebSocket connections
- Nodemailer for email services
- Bull & Redis for job queues
- Multer for file uploads

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Racheal-stack/TaskFlow.git
   cd TaskFlow
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Frontend setup**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

4. **Configure environment variables**
   
   Backend `.env`:
   ```env
   NODE_ENV=development
   PORT=5001
   MONGODB_URI=mongodb://localhost:27017/taskflow
   JWT_SECRET=your-jwt-secret-key
   SMTP_EMAIL=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   CLIENT_URL=http://localhost:3000
   ```

   Frontend `.env`:
   ```env
   VITE_API_URL=http://localhost:5001/api
   ```

5. **Start the application**
   
   Backend:
   ```bash
   cd backend
   npm run dev
   ```

   Frontend:
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001/api

## Deployment

### Railway (Recommended)
1. Connect your GitHub repository to Railway
2. Deploy backend from `/backend` folder
3. Set environment variables in Railway dashboard
4. Deploy frontend to Vercel or Netlify

### Docker
```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Manual Deployment
- Backend: Deploy to Railway, Render, or Heroku
- Frontend: Deploy to Vercel, Netlify, or similar
- Database: Use MongoDB Atlas for production

## Project Structure

```
TaskFlow/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   └── utils/          # Utility functions
│   ├── server.js          # Main server file
│   └── package.json       # Dependencies
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React contexts
│   │   ├── services/       # API services
│   │   └── hooks/          # Custom hooks
│   └── package.json       # Dependencies
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/me` - Get current user

### Projects
- `GET /api/projects` - Get user projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get tasks
- `POST /api/tasks` - Create task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Workspaces
- `GET /api/workspaces` - Get workspaces
- `POST /api/workspaces` - Create workspace
- `PUT /api/workspaces/:id` - Update workspace

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and commit: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please create an issue on GitHub.