# Team Task Manager

A collaborative project & task management web application for teams.

A Team Task Manager web app helps organize team work by providing a central platform to create projects, assign tasks, and track progress. It improves accountability by clearly defining who is responsible for each task. With role-based access, admins manage tasks while members focus on execution, ensuring control and security. Overall, it increases productivity and reduces confusion.

## 🚀 Live Demo
- **Frontend**: [https://famous-beijinho-c82072.netlify.app](https://famous-beijinho-c82072.netlify.app)
- **Backend API**: [https://team-task-manager-production-4f23.up.railway.app](https://team-task-manager-production-4f23.up.railway.app)

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Recharts, Framer Motion, Socket.IO Client |
| Backend | Node.js, Express.js, Socket.IO, Sequelize ORM |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | JWT + bcrypt |
| Deployment | Netlify (frontend) + Railway (backend) |

## Getting Started

### Prerequisites
- Node.js 20+
- npm 9+

### Backend
```bash
cd backend
cp .env.example .env    # configure your environment
npm install
node server.js          # runs on http://localhost:5000
```

### Frontend
```bash
cd frontend
npm install
npm run dev             # runs on http://localhost:5173
```

## Project Structure
```
├── backend/
│   ├── config/         # Centralized configuration
│   ├── middleware/      # Auth, validation, rate limiting
│   ├── models/         # Sequelize models (User, Project, Task, etc.)
│   ├── routes/         # Express route handlers
│   ├── utils/          # Email, logging utilities
│   ├── server.js       # Application entry point
│   └── Dockerfile      # Container configuration
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable UI components
│   │   ├── pages/      # Route-level page components
│   │   ├── services/   # API abstraction layer
│   │   ├── hooks/      # Custom React hooks
│   │   └── config.js   # API URL configuration
│   └── netlify.toml    # Netlify deployment config
└── .github/workflows/  # CI/CD pipeline
```

## Features
- 🔐 JWT authentication with role-based access (Admin/Member)
- 📋 Kanban-style task board with drag-and-drop
- 📊 Real-time dashboard with analytics charts
- 👥 Team management with admin controls
- 💬 Task comments and file attachments
- 🔔 Real-time updates via WebSockets
- 📧 Email notifications on task assignment

## Author
**Saswat Kumar Das** — [LinkedIn](https://www.linkedin.com/in/saswat-kumar-das-069a51187)

## License
All rights reserved © 2026
