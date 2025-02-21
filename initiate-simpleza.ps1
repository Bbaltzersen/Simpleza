# Start Redis server in a background process
Start-Process powershell -ArgumentList "-NoExit", "-Command redis-server"

# Wait a moment to ensure Redis starts
Start-Sleep -Seconds 2

# Define project path relative to this script's folder
$projectPath = Join-Path $PSScriptRoot "simp-api-auth"

# Build the command to start FastAPI with the virtual environment activated
$command = "cd '$projectPath'; & venv\Scripts\Activate; uvicorn main:app --reload"

# Start FastAPI in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", $command