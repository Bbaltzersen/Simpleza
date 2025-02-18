# Start Redis server in a background process
Start-Process powershell -ArgumentList "-NoExit", "-Command redis-server"

# Wait a moment to ensure Redis starts
Start-Sleep -Seconds 2

# Define project path
$projectPath = "C:\Users\Original\Desktop\Git\Simpleza\simp-api-auth"

# Start FastAPI in a new terminal with virtual environment activated
Start-Process powershell -ArgumentList "-NoExit", "-Command `"cd '$projectPath'; & venv\Scripts\Activate; uvicorn main:app --reload`""
