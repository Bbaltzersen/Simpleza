Write-Host "Stopping Redis processes..."
Get-Process | Where-Object { $_.ProcessName -match "redis" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "Stopping Uvicorn processes..."
Get-Process | Where-Object { $_.ProcessName -match "python" -or $_.ProcessName -match "uvicorn" } | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "All Redis and Uvicorn processes have been stopped."
