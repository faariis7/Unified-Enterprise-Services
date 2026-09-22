# Local Development Checklist

**Purpose:** Validate local development environment is properly configured and operational  
**Platform:** Windows with Docker Desktop  
**Prerequisites:** Node.js v20+, Docker Desktop, Git

---

## Pre-Flight Checks

### System Requirements

- [ ] **Windows 10/11 Pro or Enterprise** (for Hyper-V support)
- [ ] **Docker Desktop installed and running**
  - [ ] Docker Desktop version 4.20+ 
  - [ ] WSL 2 backend enabled
  - [ ] At least 8GB RAM allocated to Docker
- [ ] **Node.js v20+ installed**
  ```bash
  node --version  # Should show v20.x.x or higher
  ```
- [ ] **npm installed**
  ```bash
  npm --version  # Should show 9.x.x or higher
  ```
- [ ] **Git installed**
  ```bash
  git --version
  ```
- [ ] **At least 10GB free disk space**

---

## Infrastructure Startup

### Step 1: Start Docker Containers

```bash
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

**Expected Output:**
```
✔ Container unified-esm-postgres    Started
✔ Container unified-esm-redis       Started
✔ Container unified-esm-minio       Started
✔ Container unified-esm-mailhog     Started
✔ Container unified-esm-clamav      Started
```

### Step 2: Verify Container Health

```bash
docker-compose -f docker-compose.dev.yml ps
```

**Expected Status:** All containers should show `healthy` or `running`

| Container | Port | Status Check |
|-----------|------|--------------|
| postgres | 5432 | `docker exec unified-esm-postgres pg_isready -U postgres` |
| redis | 6379 | `docker exec unified-esm-redis redis-cli ping` |
| minio | 9000/9001 | Browser: http://localhost:9001 |
| mailhog | 1025/8025 | Browser: http://localhost:8025 |
| clamav | 3310 | `docker exec unified-esm-clamav clamdscan --ping=true` |

**Troubleshooting:**
- If postgres fails: Check port 5432 not in use by another service
- If redis fails: Restart container `docker restart unified-esm-redis`
- If minio fails: Check ports 9000/9001 available
- If mailhog fails: Check ports 1025/8025 available
- If clamav fails: Wait 2-3 minutes for virus definitions to load

---

## Backend Setup

### Step 3: Install Dependencies

```bash
cd backend
npm install
```

**Expected Output:**
```
added XXX packages in XXs
```

**Troubleshooting:**
- If fails with ERESOLVE: Run `npm install --legacy-peer-deps`
- If fails with ENOENT: Ensure Node.js v20+ installed

### Step 4: Configure Environment

```bash
cp .env.example .env
```

**Verify .env file contains:**
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=unified_esm
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production
REDIS_HOST=localhost
REDIS_PORT=6379
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
```

### Step 5: Run Database Migrations

```bash
npm run db:migrate
```

**Expected Output:**
```
Running migration: 001_create_workspaces_table
Running migration: 002_create_users_table
Running migration: 003_create_requests_table
...
Migrations completed successfully
```

**Troubleshooting:**
- If "connection refused": Ensure PostgreSQL container is running
- If "database does not exist": Create database manually or check init-scripts
- If "migration already exists": Drop database and recreate

### Step 6: Seed Development Data

```bash
npm run db:seed
```

**Expected Output:**
```
Seeding workspaces...
Seeding users...
Seeding services...
Seed completed: 6 users created
```

**Test Users Created:**
| Email | Password | Role |
|-------|----------|------|
| admin@unified-esm.local | Password123! | Global Admin |
| manager@unified-esm.local | Password123! | Workspace Owner |
| agent@unified-esm.local | Password123! | Service Agent |
| requester@unified-esm.local | Password123! | Requester |

### Step 7: Start Backend Server

```bash
npm run dev
```

**Expected Output:**
```
{"level":30,"time":1234567890,"msg":"Server listening on port 3000"}
{"level":30,"time":1234567890,"msg":"Database connected"}
{"level":30,"time":1234567890,"msg":"Redis connected"}
```

**Verify Backend:**
- [ ] Open browser: http://localhost:3000/health
- [ ] Expected response: `{"status":"ok","timestamp":"..."}`
- [ ] Open API docs: http://localhost:3000/docs
- [ ] Verify Swagger UI loads

**Troubleshooting:**
- If port 3000 in use: Change PORT in .env file
- If database connection fails: Check DB_* variables in .env
- If Redis connection fails: Check REDIS_HOST/PORT variables

---

## Frontend Setup

### Step 8: Install Frontend Dependencies

```bash
cd /workspace
npm install
```

**Expected Output:**
```
added XXXX packages in XXs
```

**Note:** This may take 2-5 minutes on first install

**Troubleshooting:**
- If fails with ERESOLVE: Run `npm install --legacy-peer-deps`
- If fails with memory error: Increase Node memory `node --max-old-space-size=4096`

### Step 9: Start Frontend Development Server

```bash
npm run dev
```

**Expected Output:**
```
  VITE v7.3.2  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Verify Frontend:**
- [ ] Open browser: http://localhost:5173/
- [ ] Verify homepage loads without errors
- [ ] Open browser DevTools (F12)
- [ ] Check Console tab - no red errors
- [ ] Check Network tab - all requests return 200 OK

---

## Integration Verification

### Step 10: Test Database Connectivity

**From Backend:**
```bash
curl http://localhost:3000/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "storage": "connected"
  }
}
```

### Step 11: Test File Storage (MinIO)

**Access MinIO Console:**
- [ ] Open browser: http://localhost:9001
- [ ] Login with: `minioadmin` / `minioadmin`
- [ ] Verify `unified-esm-files` bucket exists (or can be created)

**Test Upload (future):**
```bash
curl -X POST http://localhost:3000/api/files \
  -H "Authorization: Bearer TOKEN" \
  -F "file=@test.pdf"
```

### Step 12: Test Email (MailHog)

**Access MailHog UI:**
- [ ] Open browser: http://localhost:8025
- [ ] Verify "No messages yet" or test emails appear

**Test Email Send (future):**
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Hello"}'
```

### Step 13: Test Authentication (when implemented)

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@unified-esm.local","password":"Password123!"}'
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "email": "admin@unified-esm.local",
    "name": "Admin User"
  }
}
```

### Step 14: Test Request Creation (when implemented)

**Create Request:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workspaceId": "...",
    "serviceId": "...",
    "title": "Test Request",
    "description": "This is a test"
  }'
```

**Expected Response:**
```json
{
  "id": "...",
  "requestNumber": "IT-2024-00001",
  "status": "new",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

## Health Check Summary

Run the automated health check script:

```bash
scripts/health-check.bat  # Windows
```

**Manual Verification Checklist:**

| Service | URL | Expected Result | Status |
|---------|-----|-----------------|--------|
| **PostgreSQL** | localhost:5432 | Connection successful | ☐ |
| **Redis** | localhost:6379 | PONG response | ☐ |
| **MinIO** | localhost:9001 | Console loads | ☐ |
| **MailHog** | localhost:8025 | UI loads | ☐ |
| **ClamAV** | localhost:3310 | Ping successful | ☐ |
| **Backend API** | localhost:3000/health | status: ok | ☐ |
| **API Docs** | localhost:3000/docs | Swagger UI | ☐ |
| **Frontend** | localhost:5173 | App loads | ☐ |

---

## Common Issues & Solutions

### Issue: Docker Containers Won't Start

**Symptoms:**
```
Error starting userland proxy: listen tcp4 0.0.0.0:5432: bind: address already in use
```

**Solutions:**
1. Find process using port:
   ```bash
   netstat -ano | findstr :5432
   ```
2. Stop conflicting service or change port in docker-compose.yml
3. Restart Docker Desktop

### Issue: Database Migration Fails

**Symptoms:**
```
error: database "unified_esm" does not exist
```

**Solutions:**
1. Check init-scripts ran:
   ```bash
   docker logs unified-esm-postgres
   ```
2. Manually create database:
   ```bash
   docker exec -it unified-esm-postgres psql -U postgres -c "CREATE DATABASE unified_esm;"
   ```
3. Re-run migrations

### Issue: Backend Won't Start

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solutions:**
1. Verify PostgreSQL container running:
   ```bash
   docker ps | grep postgres
   ```
2. Check .env file has correct DB_HOST (should be `localhost` not `postgres`)
3. Test connection:
   ```bash
   psql -h localhost -U postgres -d unified_esm
   ```

### Issue: Frontend Shows Blank Page

**Symptoms:** White screen, console errors

**Solutions:**
1. Check console for specific errors
2. Clear browser cache (Ctrl+Shift+Delete)
3. Delete node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
4. Verify vite.config.ts has correct base path

### Issue: Hot Reload Not Working

**Symptoms:** Changes don't reflect in browser

**Solutions:**
1. Check Vite server output for file watch errors
2. Increase WSL file watcher limit:
   ```bash
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   ```
3. Restart dev server
4. Try `npm run dev -- --force`

### Issue: TypeScript Errors

**Symptoms:** Red underlines in IDE, build fails

**Solutions:**
1. Run typecheck to see all errors:
   ```bash
   npm run typecheck
   ```
2. Fix reported errors
3. If false positives, restart TypeScript server in IDE
4. Ensure all dependencies installed

---

## Post-Setup Tasks

After successful setup, complete these tasks:

### First-Time Configuration

- [ ] Change default JWT_SECRET in .env to a random secure string
- [ ] Update test user passwords if needed
- [ ] Explore API documentation at http://localhost:3000/docs
- [ ] Review seed data in database
- [ ] Familiarize with project structure

### Development Workflow

1. **Start your day:**
   ```bash
   cd infrastructure/docker && docker-compose up -d
   cd ../../backend && npm run dev
   # New terminal: cd /workspace && npm run dev
   ```

2. **Make changes:**
   - Edit code in your IDE
   - Frontend auto-reloads on save
   - Backend auto-restarts on save (tsx watch)

3. **Run tests:**
   ```bash
   cd backend && npm test
   ```

4. **Check types:**
   ```bash
   npm run typecheck
   ```

5. **End of day:**
   ```bash
   docker-compose stop  # Or leave running for faster startup tomorrow
   ```

---

## Success Criteria

Your local development environment is ready when:

✅ All 5 Docker containers are healthy  
✅ Backend starts without errors on port 3000  
✅ Frontend starts without errors on port 5173  
✅ http://localhost:3000/health returns `{"status":"ok"}`  
✅ http://localhost:5173/ loads the application  
✅ No console errors in browser DevTools  
✅ Database migrations ran successfully  
✅ Seed data loaded (6 test users)  
✅ MinIO console accessible  
✅ MailHog UI accessible  

---

## Next Steps

Once environment is validated:

1. Read `/docs/AGENT_CONTEXT.md` for development guidelines
2. Review `/docs/PROJECT_STATUS.md` for current state
3. Check `/docs/ARCHITECTURE_REVIEW.md` for architecture details
4. Pick first task from `/docs/AGENT_TASK_QUEUE.md`
5. Start coding!

**Need Help?**
- Check troubleshooting section above
- Review backend logs: `docker logs unified-esm-backend`
- Review frontend output in terminal
- Consult project documentation in `/docs`
