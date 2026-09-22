@echo off
REM ============================================================================
REM Unified ESM - Start Development Servers
REM ============================================================================
REM This script starts both backend and frontend development servers
REM Run this after setup.bat has been executed successfully
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo  Unified ESM - Starting Development Servers
echo ============================================================================
echo.

REM Check if Docker containers are running
echo Checking Docker containers...
docker ps | findstr "unified-esm-postgres" >nul 2>&1
if %errorlevel% neq 0 (
    echo WARNING: Docker containers not running. Starting infrastructure...
    cd /d "%~dp0..\infrastructure\docker"
    docker-compose -f docker-compose.dev.yml up -d
    echo Waiting for containers to start...
    timeout /t 10 /nobreak >nul
    cd /d "%~dp0.."
)

REM Start backend in background
echo.
echo Starting backend server...
cd /d "%~dp0..\backend"

if not exist ".env" (
    echo ERROR: .env file not found. Run setup.bat first.
    exit /b 1
)

start "Unified ESM Backend" cmd /k "npm run dev"
echo Backend server starting in new window...

REM Wait a moment for backend to initialize
timeout /t 3 /nobreak >nul

REM Start frontend
echo.
echo Starting frontend server...
cd /d "%~dp0.."

start "Unified ESM Frontend" cmd /k "npm run dev"
echo Frontend server starting in new window...

echo.
echo ============================================================================
echo  Development Servers Started!
echo ============================================================================
echo.
echo Two new terminal windows have been opened:
echo   - Unified ESM Backend (port 3000)
echo   - Unified ESM Frontend (port 5173)
echo.
echo Access points:
echo   Frontend:    http://localhost:5173
echo   Backend API: http://localhost:3000
echo   API Docs:    http://localhost:3000/docs
echo.
echo To stop servers:
echo   - Close the terminal windows, or
echo   - Press Ctrl+C in each window
echo.
echo Infrastructure (Docker):
echo   PostgreSQL: localhost:5432
echo   Redis:      localhost:6379
echo   MinIO:      localhost:9000 (API), localhost:9001 (Console)
echo   MailHog:    localhost:8025
echo   ClamAV:     localhost:3310
echo.
echo ============================================================================
echo.

endlocal
