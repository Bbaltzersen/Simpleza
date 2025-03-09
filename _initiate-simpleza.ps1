Write-Host "Starting services in separate Windows Terminal windows..."

# Start Redis in a new window
Start-Process wt.exe -ArgumentList "new-tab --title `"Redis Server`" cmd /k echo Starting Redis... ^& redis-server"

# Start Auth API in a new window
Start-Process wt.exe -ArgumentList "new-tab --title `"Auth API`" cmd /k echo Starting Auth API... ^& cd /d `"$PSScriptRoot\simp-api-auth`" ^& venv\Scripts\Activate ^& uvicorn main:app --host 127.0.0.1 --port 8000"

# Start Ingredient API in a new window
Start-Process wt.exe -ArgumentList "new-tab --title `"Ingredient API`" cmd /k echo Starting Ingredient API... ^& cd /d `"$PSScriptRoot\simp-api-ingredients`" ^& venv\Scripts\Activate ^& uvicorn main:app --host 127.0.0.1 --port 8010"

# Start Recipes API in a new window
Start-Process wt.exe -ArgumentList "new-tab --title `"Recipes API`" cmd /k echo Starting Recipes API... ^& cd /d `"$PSScriptRoot\simp-api-recipes`" ^& venv\Scripts\Activate ^& uvicorn main:app --host 127.0.0.1 --port 8020"

Write-Host "All services started successfully."
