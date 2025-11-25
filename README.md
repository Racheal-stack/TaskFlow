# TaskFlow - Team Task & Workflow Manager

A modern SaaS application for team task management and workflow optimization, built with the MERN stack.

![TaskFlow Logo](https://img.shields.io/badge/TaskFlow-Team%20Workflow%20Manager-blue)
![MERN Stack](https://img.shields.io/badge/Stack-MERN-green)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🚀 Features

### Core Functionality
- **Multi-tenant Architecture**: Workspace-based organization with subscription limits
- **Real-time Collaboration**: Socket.io powered live updates across teams
- **Kanban Task Management**: Drag-and-drop task boards with customizable workflows
- **Team Management**: Role-based permissions and user invitations
- **Project Organization**: Hierarchical structure (Workspace → Projects → Tasks)

### Advanced Features
- **Email Service**: Multi-provider email system with verification, notifications, and admin tools
- **Analytics Dashboard**: Comprehensive productivity insights and reporting
- **File Attachments**: Document uploads and task-related file management
- **Automation Rules**: Workflow automation for repetitive tasks
- **Subscription Management**: Stripe-powered billing with Free/Pro plans
- **Responsive Design**: Mobile-first UI with Tailwind CSS

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React.js, Vite, Tailwind CSS, React Query, React Router
- **Backend**: Node.js, Express.js, Socket.io, JWT Authentication
- **Database**: MongoDB with Mongoose ODM
- **Email**: Nodemailer with multi-provider support (Gmail, Outlook, SendGrid, etc.)
- **Payments**: Stripe integration for subscriptions
- **Real-time**: Socket.io for live collaboration features

### Project Structure
```
TaskFlow/
├── backend/                 # Express.js API server
│   ├── controllers/         # Route controllers
│   ├── middleware/          # Authentication & validation
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API endpoints
│   └── server.js           # Main server file
├── frontend/               # React.js application
│   ├── public/             # Static assets
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React context providers
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Application pages
│       ├── services/       # API service layer
│       └── utils/          # Helper functions
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

### Environment Variables

Create `.env` files in both backend and frontend directories:

#### Backend (.env)
```env
# Database
MONGODB_URI=mongodb://localhost:27017/taskflow
# or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/taskflow

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-refresh-token-secret-here

# Server Configuration
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Stripe Configuration (for subscription features)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Email Configuration (optional, for notifications)
EMAIL_FROM=noreply@taskflow.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

#### Frontend (.env)
```env
# API Configuration
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Environment
VITE_NODE_ENV=development
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TaskFlow
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up MongoDB**
   - Install MongoDB locally or create a MongoDB Atlas account
   - Update the `MONGODB_URI` in your backend `.env` file

5. **Configure Stripe (Optional)**
   - Create a Stripe account
   - Add your Stripe keys to the environment files
   - Set up webhook endpoints for subscription handling

## 🚀 Running the Application

### Development Mode

1. **Start the Backend Server**
   ```bash
   cd backend
   npm run dev
   ```
   Server will start on `http://localhost:5000`

2. **Start the Frontend Development Server**
   ```bash
   cd frontend
   npm run dev
   ```
   Application will be available at `http://localhost:3000`

### Production Build

1. **Build Frontend for Production**
   ```bash
   cd frontend
   npm run build
   ```

2. **Start Production Server**
   ```bash
   cd backend
   npm start
   ```

## 📱 Usage Guide

### Getting Started

1. **Sign Up**: Create a new account at `http://localhost:3000/register`
2. **Create Workspace**: Set up your team's workspace with subscription plan
3. **Invite Team Members**: Add colleagues to your workspace with appropriate roles
4. **Create Projects**: Organize work into projects with custom workflows
5. **Manage Tasks**: Create, assign, and track tasks through kanban boards

### Key Features

- **Dashboard**: Overview of all projects, tasks, and team activity
- **Projects**: Kanban-style boards for visual task management
- **Team**: Manage workspace members and their permissions
- **Analytics**: Track productivity metrics and project progress
- **Settings**: Configure workspace preferences and billing

### 📧 Email Configuration

TaskFlow includes a comprehensive email service for user verification and notifications:

#### Quick Setup (Development)
The system automatically creates test email accounts if no SMTP is configured. Check console logs for Ethereal test credentials.

#### Production Setup
Configure environment variables for your email provider:
```env
SMTP_HOST=smtp.gmail.com
SMTP_EMAIL=your-email@gmail.com  
SMTP_PASSWORD=your-app-password
```

#### Admin Testing
1. Make any user an admin: `node backend/make-admin.js user@example.com`
2. Login and go to Settings > Admin Tools
3. Test email service and send test emails

See [`EMAIL_SETUP_GUIDE.md`](./EMAIL_SETUP_GUIDE.md) for detailed configuration instructions.

## 🔧 API Documentation

The backend provides a comprehensive REST API. Key endpoints include:

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Workspaces
- `GET /api/workspaces` - List user workspaces
- `POST /api/workspaces` - Create new workspace
- `PUT /api/workspaces/:id` - Update workspace
- `DELETE /api/workspaces/:id` - Delete workspace

### Projects
- `GET /api/projects` - List workspace projects
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - List project tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Test Coverage
```bash
# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Recommended Platforms

1. **Vercel/Netlify** (Frontend)
2. **Heroku/Railway** (Backend)
3. **MongoDB Atlas** (Database)
4. **Stripe** (Payments)

### Environment Setup

Ensure all production environment variables are configured on your hosting platform.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join project discussions for questions and feature requests

## 🎯 Roadmap

### Upcoming Features
- [ ] Advanced reporting and analytics
- [ ] Third-party integrations (Slack, GitHub, etc.)
- [ ] Mobile applications (iOS/Android)
- [ ] Advanced automation workflows
- [ ] Time tracking functionality
- [ ] Gantt chart view
- [ ] Custom fields and templates

### Performance Improvements
- [ ] Database query optimization
- [ ] Caching implementation (Redis)
- [ ] CDN integration for file uploads
- [ ] Progressive Web App (PWA) support

---

**Built with ❤️ for productive teams**

*TaskFlow helps teams streamline their workflow and boost productivity through intuitive task management and real-time collaboration.*