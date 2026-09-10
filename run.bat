@echo off
REM ==========================================================
REM  WI-FI SECURITY ANALYZER - Local Windows Runner
REM ==========================================================

echo.
echo ============================================
echo   WI-FI SECURITY ANALYZER
echo ============================================
echo.

REM --- 1. Check Python is installed ---
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python was not found on this system.
    echo Please install Python 3 from https://www.python.org/downloads/
    echo and make sure "Add Python to PATH" is checked during install.
    pause
    exit /b 1
)

REM --- 2. Create virtual environment if missing ---
if not exist "venv\" (
    echo [INFO] Creating virtual environment...
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment.
        pause
        exit /b 1
    )
) else (
    echo [INFO] Virtual environment already exists.
)

REM --- 3. Activate virtual environment ---
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment.
    pause
    exit /b 1
)

REM --- 4. Install dependencies ---
echo [INFO] Installing dependencies...
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)

REM --- 5. Start the Flask server ---
echo.
echo ============================================
echo   WI-FI SECURITY ANALYZER
echo   Server running at:
echo   http://127.0.0.1:5000
echo ============================================
echo.
echo Press CTRL+C to stop the server.
echo.

python app.py

pause
