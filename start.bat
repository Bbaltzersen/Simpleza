@echo off
REM 
cd /d "%~dp0"
REM 
powershell.exe -ExecutionPolicy Bypass -File "initiate-simpleza.ps1"
exit