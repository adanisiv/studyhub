@echo off
echo ========================================
echo    StudyHub - Starting all services
echo ========================================
echo.

echo [1/3] Starting MongoDB...
start "MongoDB" cmd /k "mongod"
timeout /t 3 /nobreak >nul

echo [2/3] Starting Server (port 5000)...
start "Server" cmd /k "cd /d C:\Users\adanisiv\studyhub-run\server && npm start"
timeout /t 3 /nobreak >nul

echo [3/3] Starting Client (port 3000)...
start "Client" cmd /k "cd /d C:\Users\adanisiv\studyhub-run\client && npm run dev"
timeout /t 4 /nobreak >nul

echo.
echo ========================================
echo  Done! Open: http://localhost:3000
echo ========================================
echo.
start http://localhost:3000
pause
