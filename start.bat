@echo off
REM Navigate to the script's directory
cd /d "%~dp0"

REM Stop any running Redis, Uvicorn, or frontend instances
powershell.exe -ExecutionPolicy Bypass -File "_stop-instances.ps1"

REM Start Windows Terminal with multiple tabs
wt --window 0 ^
   new-tab --title "Redis Server" cmd /k "echo Starting Redis... && redis-server" ^
   ; new-tab --title "Auth API" cmd /k "echo Starting Auth API... && cd /d "%~dp0\simp-api-auth" && call venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8000 --reload" ^
   ; new-tab --title "Ingredient API" cmd /k "echo Starting Ingredient API... && cd /d "%~dp0\simp-api-ingredients" && call venv\Scripts\activate && python main.py --host 127.0.0.1 --port 8010" ^
   ; new-tab --title "Recipes API" cmd /k "echo Starting Recipes API... && cd /d "%~dp0\simp-api-recipes" && call venv\Scripts\activate && uvicorn main:app --host 127.0.0.1 --port 8020 --reload" ^
   ; new-tab --title "Frontend" cmd /k "echo Starting Frontend... && cd /d "%~dp0\simp-front-end" && npm run dev"

REM Exit batch script without closing new tabs
exit