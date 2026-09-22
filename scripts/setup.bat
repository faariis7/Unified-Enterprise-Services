@echo off
REM ============================================================================
REM Unified ESM - Setup Script for Windows
REM ============================================================================
REM This script sets up the complete development environment:
REM - Verifies Docker Desktop availability
REM - Starts Docker containers
REM - Installs backend and frontend dependencies
REM - Runs database migrations and seeds
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo  Unified ESM - Development Environment Setup
echo ============================================================================
echo.

REM Check if Docker is running
echo [1/8] Checking Docker Desktop availability...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running or not installed
    echo Please start Docker Desktop and try again
    exit /b 1
)
echo OK: Docker Desktop is running

REM Navigate to infrastructure directory
echo.
echo [2/8] Starting Docker containers...
cd /d "%~dp0..\infrastructure\docker"

docker-compose -f docker-compose.dev.yml up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start Docker containers
    exit /b 1
)

echo Waiting for containers to be healthy...
timeout /t 10 /nobreak >nul

REM Verify container health
echo.
echo [3/8] Verifying container health...
docker-compose -f docker-compose.dev.yml ps
if %errorlevel% neq 0 (
    echo WARNING: Some containers may not be healthy
    echo Check 'docker-compose ps' output above
)

REM Navigate to backend directory
echo.
echo [4/8] Installing backend dependencies...
cd /d "%~dp0..\backend"

if not exist "node_modules\" (
    echo Installing backend dependencies (this may take a few minutes)...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        exit /b 1
    )
) else (
    echo Backend dependencies already installed
)

REM Setup environment file
echo.
echo [5/8] Configuring environment...
if not exist ".env" (
    copy .env.example .env >nul
    echo Created .env from .env.example
) else (
    echo .env file already exists
)

REM Run database migrations
echo.
echo [6/8] Running database migrations...
call npm run db:migrate
if %errorlevel% neq 0 (
    echo ERROR: Database migrations failed
    echo Make sure PostgreSQL container is running
    exit /b 1
)

REM Seed development data
echo.
echo [7/8] Seeding development data...
call npm run db:seed
if %errorlevel% neq 0 (
    echo WARNING: Database seeding failed
    echo You can run 'npm run db:seed' manually later
)

REM Navigate to root and install frontend dependencies
echo.
echo [8/8] Installing frontend dependencies...
cd /d "%~dp0.."

if not exist "node_modules\" (
    echo Installing frontend dependencies (this may take a few minutes)...
    call npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        exit /b 1
    )
) else (
    echo Frontend dependencies already installed
)

REM Summary
echo.
echo ============================================================================
echo  Setup Complete!
echo ============================================================================
echo.
echo Your development environment is ready. Next steps:
echo.
echo 1. Start the backend server:
echo    cd backend
echo    npm run dev
echo.
echo 2. In a new terminal, start the frontend:
echo    cd /workspace
echo    npm run dev
echo.
echo 3. Access the application:
echo    - Frontend: http://localhost:5173
echo    - Backend API: http://localhost:3000
echo    - API Docs: http://localhost:3000/docs
echo    - MinIO Console: http://localhost:9001
echo    - MailHog: http://localhost:8025
echo.
echo Test users:
echo    admin@unified-esm.local / Password123!
echo    manager@unified-esm.local / Password123!
echo    agent@unified-esm.local / Password123!
echo    requester@unified-esm.local / Password123!
echo.
echo For more information, see docs/LOCAL_DEV_CHECKLIST.md
echo ============================================================================
echo.

endlocal
