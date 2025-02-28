# Start Redis server in a new PowerShell window
Write-Host "Starting Redis..."
Start-Process powershell -ArgumentList "-NoExit", "-Command redis-server"
Start-Sleep -Seconds 2  # Wait for Redis to start

# Define project paths
$AuthAPIPath = Join-Path $PSScriptRoot "simp-api-auth"
$IngredientAPIPath = Join-Path $PSScriptRoot "simp-api-ingredients"

Write-Host "Starting FastAPI instances..."

# Start Auth API
Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd '$AuthAPIPath'; & venv\Scripts\Activate; uvicorn main:app --reload`""

# Start Ingredient API
Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd '$IngredientAPIPath'; & venv\Scripts\Activate; uvicorn main:app --reload`""

Write-Host "All services started successfully."