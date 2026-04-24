@echo off
setlocal

cd /d "%~dp0"

start "Salt n Pepper Preview" powershell -NoExit -Command "Set-Location '%~dp0'; node preview-server.js"

ping 127.0.0.1 -n 3 >nul

start "" "http://127.0.0.1:4173/"
