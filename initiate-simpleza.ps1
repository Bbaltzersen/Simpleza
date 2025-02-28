# Start Redis server in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command redis-server"

# Wait a moment to ensure Redis starts
Start-Sleep -Seconds 2

# Define project paths relative to this script's folder
$AuthAPIPath = Join-Path $PSScriptRoot "simp-api-auth"
$IngredientAPIPath = Join-Path $PSScriptRoot "simp-api-ingredients"

# Start Auth API in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd '$AuthAPIPath'; & venv\Scripts\Activate; uvicorn main:app --reload`""

# Start Ingredient API in a new PowerShell window
Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd '$IngredientAPIPath'; & venv\Scripts\Activate; uvicorn main:app --reload`""
