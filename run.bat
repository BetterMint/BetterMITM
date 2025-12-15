@echo off
SETLOCAL
chcp 65001 >nul

echo ========================================
echo Setting up BetterMITM
echo ========================================
echo.

echo [0/4] Checking for uv...
where uv >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo uv not found. Installing uv...
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install uv
        echo Please install uv manually: pip install uv
        pause
        exit /b 1
    )
    echo Adding uv to PATH...
    set "PATH=%USERPROFILE%\.cargo\bin;%PATH%"
) else (
    echo uv is already installed.
)
echo.

echo [1/4] Installing Python dependencies...
cd /d "%~dp0"
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Could not cd into root folder
    pause
    exit /b 1
)
if not exist ".venv" (
    echo Installing Python dependencies...
    uv sync
    if %ERRORLEVEL% NEQ 0 (
        echo ERROR: Failed to install Python dependencies
        pause
        exit /b 1
    )
) else (
    echo Python dependencies already installed.
)
echo.

echo [2/4] Checking for Node.js...
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo Node.js is installed.
)
echo.

echo [3/4] Building web frontend...

REM --- change to the web frontend folder ---
cd /d "%~dp0web"
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Could not cd into web folder "%~dp0web"
  pause
  exit /b 1
)

REM --- install dependencies (always run to ensure new packages are installed) ---
echo Installing/updating npm dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed.
    cd /d "%~dp0"
    pause
    exit /b %ERRORLEVEL%
)

REM --- run vite build (outputs directly to BetterMITM/tools/web/static) ---
echo Building web frontend with Vite...
call npx vite build
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Build failed.
  cd /d "%~dp0"
  pause
  exit /b %ERRORLEVEL%
)

REM --- verify build output exists ---
set STATIC_DIR=%~dp0BetterMITM\tools\web\static
if not exist "%STATIC_DIR%" (
  echo ERROR: Build output directory not found: %STATIC_DIR%
  cd /d "%~dp0"
  pause
  exit /b 1
)
echo Build completed successfully!

REM --- copy docs.md to static directory if it exists ---
if exist "%~dp0docs.md" (
    copy /Y "%~dp0docs.md" "%STATIC_DIR%\docs.md" >nul 2>&1
    echo Documentation file copied to static directory.
)

echo.
echo [4/4] Starting BetterMITM...
echo.
echo ========================================
echo BetterMITM is starting...
echo Open the URL shown below in your browser
echo ========================================
echo.

REM --- run mitmweb from root directory (where pyproject.toml is) ---
cd /d "%~dp0"
if %ERRORLEVEL% NEQ 0 (
  echo ERROR: Could not return to root directory
  pause
  exit /b 1
)

REM --- run mitmweb using uv run with explicit module path ---
uv run python -m BetterMITM.tools.main mitmweb
if %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: Failed to start mitmweb.
  pause
  exit /b %ERRORLEVEL%
)

ENDLOCAL
pause
