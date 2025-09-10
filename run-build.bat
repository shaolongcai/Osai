@echo off
chcp 65001
setlocal

echo [INFO] Building Electron Application with Forge...

REM --- Check Node.js ---
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM --- Install dependencies if needed ---
if not exist "node_modules" (
    echo [INFO] Installing Electron dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Electron dependencies
        pause
        exit /b 1
    )
)

REM --- Install frontend dependencies ---
pushd "%~dp0frontend"
if not exist "node_modules" (
    echo [INFO] Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install frontend dependencies
        popd
        pause
        exit /b 1
    )
)
popd


REM --- Compile TypeScript files ---
echo [INFO] Compiling TypeScript files...
call cd frontend
call npx tsc
if %errorlevel% neq 0 (
    echo [ERROR] TypeScript compilation failed
    pause
    exit /b 1
)

REM --- Build frontend ---
echo [INFO] Building frontend...
pushd "%~dp0frontend"
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed
    popd
    pause
    exit /b 1
)
popd

REM --- Clean previous build ---
if exist "out" (
    echo [INFO] Cleaning previous build...
    rmdir /s /q "out"
)

REM --- Make Electron app with Forge ---
echo [INFO] Making Electron application with Forge...
echo This may take several minutes...
echo.

call cd ..
call npm run make
@REM call npm run package
if %errorlevel% neq 0 (
    echo [ERROR] Electron Forge make failed
    pause
    exit /b 1
)

echo.
echo [SUCCESS] Build completed successfully!
echo.
echo Built files are located in: out\
echo.
echo You can find the installer in the out directory.
echo The application will include:
echo - Frontend (React + Vite)
echo - Backend (Python + FastAPI)
echo - Dependency installer UI
echo - Automatic Python environment setup
echo.

REM --- Show build results ---
if exist "out" (
    echo [INFO] Build contents:
    dir "out" /b
    echo.
)

echo [INFO] Build process completed!
echo.
echo IMPORTANT NOTES:
echo 已完成打包，安装包位于 out 目录
echo.

endlocal
pause