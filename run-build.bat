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

REM --- Clean previous builds ---
if exist "out" (
    echo [INFO] Cleaning previous application build...
    rmdir /s /q "out"
)
if exist "dist-electron" (
    echo [INFO] Cleaning previously compiled backend...
    rmdir /s /q "dist-electron"
)

REM --- Compile Electron TypeScript files ---
echo [INFO] Compiling Electron TypeScript files...
pushd "%~dp0electron"
call npx tsc
if %errorlevel% neq 0 (
    echo [ERROR] Electron TypeScript compilation failed
    popd
    pause
    exit /b 1
)
popd
echo [SUCCESS] Electron TypeScript compilation completed.

REM --- Copy resources to dist-electron ---
echo [INFO] Copying resources to dist-electron...
if exist "electron\resources" (
    xcopy "electron\resources" "dist-electron\resources" /E /I /Y >nul
    if %errorlevel% equ 0 (
        echo [SUCCESS] Resources copied successfully.
    ) else (
        echo [WARNING] Failed to copy some resources, but continuing...
    )
) else (
    echo [WARNING] electron/resources directory not found, skipping copy.
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

REM --- Make Electron app with Forge ---
echo [INFO] Making Electron application with Forge...
echo This may take several minutes...
echo.

call npm run package
if %errorlevel% neq 0 (
    echo [ERROR] Electron Forge make failed
    pause
    exit /b 1
)

@REM call npm run make
@REM call npm run package
@REM if %errorlevel% neq 0 (
@REM     echo [ERROR] Electron Forge make failed
@REM     pause
@REM     exit /b 1
@REM )

echo.
echo [SUCCESS] Build completed successfully!
echo.
echo Built files are located in: out\
echo.
echo You can find the installer in the out directory.
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