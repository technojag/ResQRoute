@echo off
echo ========================================
echo ResQRoute Backend Server Starter
echo ========================================
echo.

echo Checking if .env file exists...
if not exist .env (
    echo .env file not found! Creating from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Edit .env file and add:
    echo - MONGODB_URI
    echo - JWT_SECRET
    echo.
    pause
)

echo.
echo Starting server...
echo.
echo Note: If you see MongoDB connection error, that's okay for testing.
echo The server will still start.
echo.

node src/server.js

pause