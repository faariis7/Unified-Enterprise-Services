# 🚀 Quick Start Guide - Unified ESM

## Prerequisites

Before you begin, ensure you have the following installed on your computer:

### Required Software
1. **Node.js** (v20 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version` (should show v20.x.x or higher)

2. **Docker Desktop** (for database and services)
   - Download from: https://www.docker.com/products/docker-desktop/
   - Verify: `docker --version` and `docker-compose --version`

3. **Git** (to clone the repository)
   - Download from: https://git-scm.com/
   - Verify: `git --version`

## Step-by-Step Setup

### 1. Clone and Navigate to Project

```bash
# Clone the repository (if you haven't already)
git clone <your-repo-url>
cd unified-esm

# Or if you downloaded as ZIP, extract it and open terminal in the project folder
cd /path/to/unified-esm
```

### 2. Start Infrastructure Services (Database, Redis, etc.)

```bash
# Navigate to infrastructure folder
cd infrastructure/docker

# Start all services (PostgreSQL, Redis, MinIO, MailHog, ClamAV)
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose -f docker-compose.dev.yml ps
```

**Expected Output:**
- PostgreSQL running on port 5432
- Redis running on port 6379
- MinIO running on ports 9000 (API) and 9001 (Console)
- MailHog running on ports 1025 (SMTP) and 8025 (Web UI)
- ClamAV running on port 3310

### 3. Setup Backend

```bash
# Navigate to backend folder
cd ../../backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# The .env file is already configured for local development
# You can edit it if you need to change ports or credentials
```

### 4. Run Database Migrations

```bash
# Still in backend folder, run migrations
npm run db:migrate
```

**Expected Output:**
```
🔄 Running database migrations...
⏳ Running migration: 001_create-workspaces-table
✅ Migration completed: 001_create-workspaces-table
⏳ Running migration: 002_create-users-table
✅ Migration completed: 002_create-users-table
... (more migrations)
🎉 All migrations completed successfully!
```

### 5. Seed Test Data

```bash
# Create test users and workspaces
npm run db:seed
```

**Expected Output:**
```
🌱 Seeding database...
✅ Created workspace: IT Services
✅ Created workspace: HR Services
... (more workspaces)
✅ Created user: System Administrator (ADMIN)
✅ Created user: John Doe (END_USER)
... (more users)

📋 Test Credentials:
   Email: admin@unified-esm.local
   Password: Password123!
```

### 6. Start Backend Server

```bash
# Start development server with hot-reload
npm run dev
```

**Expected Output:**
```
🚀 Server running at http://0.0.0.0:3000
📚 API Documentation at http://0.0.0.0:3000/docs
💾 Database: unified_esm@localhost:5432
```

### 7. Start Frontend (React App)

```bash
# Open a new terminal window
# Navigate to project root
cd /path/to/unified-esm

# Install frontend dependencies (if not already done)
npm install

# Start frontend development server
npm run dev
```

**Expected Output:**
```
  VITE v7.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

## Access the Application

### Backend API
- **API Server**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

### Frontend Application
- **Main App**: http://localhost:5173

### Supporting Services
- **MinIO Console** (File Storage): http://localhost:9001
  - Username: `minioadmin`
  - Password: `minioadmin`
  
- **MailHog** (Email Testing): http://localhost:8025
  - View all emails sent by the application

## Test Users (Hardcoded for Development)

All users use password: `Password123!`

| Email | Role | Workspace |
|-------|------|-----------|
| admin@unified-esm.local | ADMIN | All |
| john.doe@unified-esm.local | END_USER | IT Services |
| jane.smith@unified-esm.local | MANAGER | IT Services |
| bob.approver@unified-esm.local | APPROVER | IT Services |
| alice.analyst@unified-esm.local | ANALYST | All |
| service.provider@unified-esm.local | SERVICE_PROVIDER | IT Services |

## Common Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed test data
npm run typecheck    # Type check TypeScript
npm run lint         # Run linter
```

### Infrastructure
```bash
# Stop all services
docker-compose -f docker-compose.dev.yml down

# Stop and remove all data (fresh start)
docker-compose -f docker-compose.dev.yml down -v

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Restart a specific service
docker-compose -f docker-compose.dev.yml restart postgres
```

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
```bash
# Find what's using the port (e.g., 3000)
# Windows:
netstat -ano | findstr :3000

# Mac/Linux:
lsof -i :3000

# Kill the process or change the port in .env
```

### Docker Issues
```bash
# Restart Docker Desktop
# Or from command line:
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d
```

### Database Connection Failed
1. Ensure Docker containers are running: `docker-compose -f docker-compose.dev.yml ps`
2. Check PostgreSQL logs: `docker-compose -f docker-compose.dev.yml logs postgres`
3. Verify .env settings match docker-compose configuration

### Migration Errors
```bash
# Drop all tables and re-run migrations
# WARNING: This deletes all data!
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
npm run db:migrate
npm run db:seed
```

## Next Steps

1. **Explore API Documentation**: Visit http://localhost:3000/docs to see all available endpoints
2. **Test Login**: Use the test credentials above to login
3. **Create Requests**: Try creating service requests through the API or UI
4. **Read Documentation**: Check `/workspace/STRATEGIC_BUILD_PLAN.md` for the full roadmap

## Architecture Overview

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Frontend  │────▶│   Backend    │────▶│   PostgreSQL    │
│  (React)    │     │   (Fastify)  │     │   (Database)    │
│ :5173       │     │   :3000      │     │   :5432         │
└─────────────┘     └──────────────┘     └─────────────────┘
                           │
                    ┌──────┴──────┐
                    ▼             ▼
            ┌───────────┐  ┌───────────┐
            │   Redis   │  │   MinIO   │
            │   :6379   │  │   :9000   │
            └───────────┘  └───────────┘
```

## Need Help?

- Check the logs in your terminal
- Review error messages carefully
- Ensure all prerequisites are installed correctly
- Verify Docker containers are running
- Check that .env file exists and has correct values
