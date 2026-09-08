@echo off
title Wi-Fi Security Analyzer

echo ============================================
echo   WI-FI SECURITY ANALYZER
echo ============================================
echo.

if not exist "venv\Scripts\python.exe" (
    echo [INFO] Creating virtual environment...
    python -m venv venv

    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
)

echo [INFO] Installing dependencies...
venv\Scripts\python.exe -m pip install -r requirements.txt --quiet

if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

echo.
echo ============================================
echo   WI-FI SECURITY ANALYZER
echo   Server running at:
echo   http://127.0.0.1:5000
echo ============================================
echo.
echo Press CTRL+C to stop the server.
echo.

venv\Scripts\python.exe app.py

pause