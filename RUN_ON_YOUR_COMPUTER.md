# 🚀 Quick Start Guide - Unified ESM

This guide will help you set up and run the entire system on your local computer.

## Prerequisites

Install these tools first:

1. **Node.js v20+** (includes npm)
   - Download: https://nodejs.org/
   - Verify: `node --version` (should show v20.x or higher)

2. **Docker Desktop** (for database and services)
   - Download: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop
   - Verify: `docker --version` and `docker-compose --version`

3. **Git** (to clone the repository)
   - Download: https://git-scm.com/
   - Verify: `git --version`

---

## Step-by-Step Setup

### Step 1: Clone Repository (if not already done)

```bash
git clone <your-repo-url> unified-esm
cd unified-esm
```

### Step 2: Start Infrastructure Services

This starts PostgreSQL, Redis, MinIO (file storage), MailHog (email testing), and ClamAV (virus scanning).

```bash
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

**Verify services are running:**
```bash
docker-compose -f docker-compose.dev.yml ps
```

You should see all 5 services as "running".

### Step 3: Setup Backend

```bash
cd ../../backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Run database migrations
npm run db:migrate

# Seed test data (creates workspaces and test users)
npm run db:seed
```

### Step 4: Start Backend Server

```bash
# Start in development mode with auto-reload
npm run dev
```

You should see: `Server listening on http://localhost:3000`

Keep this terminal open. The backend is now running!

### Step 5: Start Frontend (New Terminal)

Open a **new terminal window** and run:

```bash
cd /workspace  # or cd path/to/unified-esm

# Install dependencies (first time only)
npm install

# Start development server
npm run dev
```

You should see: `Local: http://localhost:5173/`

---

## Access the Application

| Service | URL | Credentials |
|---------|-----|-------------|
| **Frontend** | http://localhost:5173 | See test users below |
| **Backend API** | http://localhost:3000 | - |
| **API Documentation** | http://localhost:3000/docs | - |
| **MailHog (Email)** | http://localhost:8025 | - |
| **MinIO (Files)** | http://localhost:9001 | minioadmin / minioadmin |

---

## Test Users (Pre-seeded)

| Email | Password | Role | Workspace |
|-------|----------|------|-----------|
| admin@unified-esm.local | Password123! | Super Admin | All |
| it.admin@unified-esm.local | Password123! | Workspace Admin | IT Services |
| hr.manager@unified-esm.local | Password123! | Manager | HR Services |
| john.requester@unified-esm.local | Password123! | End User | IT Services |
| jane.approver@unified-esm.local | Password123! | Approver | IT Services |
| auditor@unified-esm.local | Password123! | Auditor | All |

---

## First Steps After Login

1. **Login** with `admin@unified-esm.local` / `Password123!`
2. **Browse Workspaces** - See all 7 departmental workspaces
3. **Create a Request** - Try creating an IT service request
4. **View API Docs** - Visit http://localhost:3000/docs to explore API endpoints

---

## Common Commands

### Backend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run test         # Run tests
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed test data
npm run lint         # Check code quality
```

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Check code quality
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

---

## Troubleshooting

### Port Already in Use
If you get "port already in use" errors:
- Port 3000: Backend API
- Port 5173: Frontend
- Port 5432: PostgreSQL
- Port 6379: Redis
- Port 9000/9001: MinIO
- Port 8025: MailHog

Stop conflicting services or change ports in `.env` files.

### Database Connection Failed
1. Ensure Docker is running
2. Check PostgreSQL is up: `docker-compose -f docker-compose.dev.yml ps`
3. Verify connection in `backend/.env`

### Frontend Won't Start
1. Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
2. Clear Vite cache: `rm -rf node_modules/.vite`

### Backend Won't Start
1. Ensure database migrations ran: `npm run db:migrate`
2. Check `.env` file exists with correct values
3. Verify PostgreSQL is accessible

---

## Development Workflow

1. **Make changes** to frontend or backend code
2. **Auto-reload** - Both servers automatically reload on file changes
3. **Test** your changes in the browser
4. **Commit** to Git when ready

---

## Next Steps

Now that your system is running:

1. ✅ Explore the frontend UI
2. ✅ Test creating requests
3. ✅ Review API documentation at http://localhost:3000/docs
4. ✅ Read `STRATEGIC_BUILD_PLAN.md` for the roadmap
5. ✅ Start building features following the plan!

---

## Production Deployment (Later)

When ready for production:

**Option A: Traditional Hosting (No Docker)**
- Install PostgreSQL, Redis directly on server
- Deploy backend with PM2 or similar
- Deploy frontend to static hosting (Vercel, Netlify)

**Option B: Docker in Production**
- Use `docker-compose.prod.yml` (to be created)
- Deploy to any cloud provider supporting Docker

**Option C: Platform-as-a-Service**
- Deploy to Render, Railway, or similar
- Zero server management required

See `STRATEGIC_BUILD_PLAN.md` Phase 5 for detailed deployment guides.

---

**Need Help?**
- Check `QUICKSTART.md` for detailed setup instructions
- Review `IMPLEMENTATION_SUMMARY.md` for technical details
- Read `STRATEGIC_BUILD_PLAN.md` for the complete roadmap
