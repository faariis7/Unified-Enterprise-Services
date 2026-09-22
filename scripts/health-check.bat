@echo off
REM ============================================================================
REM Unified ESM - Health Check Script
REM ============================================================================
REM This script verifies all services are running and accessible
REM ============================================================================

setlocal enabledelayedexpansion

echo.
echo ============================================================================
echo  Unified ESM - Health Check
echo ============================================================================
echo.

set ERRORS=0

REM Check PostgreSQL
echo [1/8] Checking PostgreSQL...
docker exec unified-esm-postgres pg_isready -U postgres >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: PostgreSQL is healthy
) else (
    echo ERROR: PostgreSQL is not responding
    set /a ERRORS+=1
)

REM Check Redis
echo.
echo [2/8] Checking Redis...
docker exec unified-esm-redis redis-cli ping | findstr "PONG" >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Redis is healthy
) else (
    echo ERROR: Redis is not responding
    set /a ERRORS+=1
)

REM Check MinIO
echo.
echo [3/8] Checking MinIO...
curl -s http://localhost:9000/minio/health/live >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: MinIO is healthy
) else (
    echo ERROR: MinIO is not responding
    set /a ERRORS+=1
)

REM Check MailHog
echo.
echo [4/8] Checking MailHog...
curl -s http://localhost:8025 >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: MailHog is accessible
) else (
    echo ERROR: MailHog is not accessible
    set /a ERRORS+=1
)

REM Check ClamAV
echo.
echo [5/8] Checking ClamAV...
docker exec unified-esm-clamav clamdscan --ping=true >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: ClamAV is healthy
) else (
    echo WARNING: ClamAV may still be initializing
)

REM Check Backend API
echo.
echo [6/8] Checking Backend API...
curl -s http://localhost:3000/health | findstr "ok" >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Backend API is healthy
) else (
    echo ERROR: Backend API is not responding
    set /a ERRORS+=1
)

REM Check API Documentation
echo.
echo [7/8] Checking API Documentation...
curl -s http://localhost:3000/docs >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: API documentation is accessible
) else (
    echo WARNING: API documentation may not be available
)

REM Check Frontend
echo.
echo [8/8] Checking Frontend...
curl -s http://localhost:5173 >nul 2>&1
if %errorlevel% equ 0 (
    echo OK: Frontend is accessible
) else (
    echo ERROR: Frontend is not accessible
    set /a ERRORS+=1
)

REM Summary
echo.
echo ============================================================================
if %ERRORS% equ 0 (
    echo  All health checks passed!
    echo.
    echo  Your development environment is fully operational.
    echo.
    echo  Access points:
    echo    Frontend:         http://localhost:5173
    echo    Backend API:      http://localhost:3000
    echo    API Docs:         http://localhost:3000/docs
    echo    MinIO Console:    http://localhost:9001
    echo    MailHog UI:       http://localhost:8025
    echo  ============================================================================
    exit /b 0
) else (
    echo  %ERRORS% health check(s) failed
    echo.
    echo  Troubleshooting tips:
    echo    1. Ensure Docker Desktop is running
    echo    2. Run: docker-compose -f docker-compose.dev.yml ps
    echo    3. Check logs: docker logs ^<container-name^>
    echo    4. Restart containers: docker-compose restart
    echo  ============================================================================
    exit /b 1
)

endlocal
