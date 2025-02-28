@echo off
REM Navigate to the script's directory
cd /d "%~dp0"

REM Stop any running Redis and Uvicorn instances
powershell.exe -ExecutionPolicy Bypass -File "_stop-instances.ps1"

REM Start Redis in a new CMD window
start cmd /k redis-server

REM Wait for Redis to start
timeout /t 5

REM Start Auth API in a new CMD window
start cmd /k "cd /d simp-api-auth && venv\Scripts\Activate && uvicorn main:app --reload"

REM Start Ingredient API in a new CMD window
start cmd /k "cd /d simp-api-ingredients && venv\Scripts\Activate && uvicorn main:app --reload"

REM Exit batch script without closing new CMD windows
exit