@echo off
echo Starting HMI Agent...
echo.

echo Starting Backend Server...
start "Backend" cmd /k "cd backend && npm start"

echo Waiting for backend to start...
timeout /t 3 /nobreak > nul

echo Starting Frontend Server...
start "Frontend" cmd /k "cd frontend && npm start"

echo.
echo ✅ Both servers are starting!
echo.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause > nul 