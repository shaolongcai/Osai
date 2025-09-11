@echo off
chcp 65001
setlocal EnableDelayedExpansion

REM 颜色定义（Windows ANSI 转义序列）
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "BLUE=[94m"
set "NC=[0m"

REM 日志函数实现
set "log_info=echo %BLUE%[INFO]%NC%"
set "log_success=echo %GREEN%[SUCCESS]%NC%"
set "log_error=echo %RED%[ERROR]%NC%"
set "log_warning=echo %YELLOW%[WARNING]%NC%"

%log_info% Starting Electron Development Environment...

REM --- 检查 Node.js ---
node --version >nul 2>&1
if %errorlevel% neq 0 (
    %log_error% Node.js is not installed or not in PATH
    %log_error% Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM 显示 Node.js 版本
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
%log_info% Node.js version: !NODE_VERSION!

REM --- 安装根目录依赖 ---
if not exist "node_modules" (
    %log_info% Installing Electron dependencies...
    call npm install
    if %errorlevel% neq 0 (
        %log_error% Failed to install Electron dependencies
        pause
        exit /b 1
    )
) else (
    %log_info% Electron dependencies already installed
)

REM --- 安装前端依赖 ---
pushd "%~dp0frontend"
if not exist "node_modules" (
    %log_info% Installing frontend dependencies...
    call npm install
    if %errorlevel% neq 0 (
        %log_error% Failed to install frontend dependencies
        popd
        pause
        exit /b 1
    )
) else (
    %log_info% Frontend dependencies already installed
)
REM 返回根目录
popd

REM --- 编译TypeScript文件 ---
%log_info% Compiling TypeScript files...

REM REM 检查 npx 是否可用
call npx --version >nul 2>&1
if %errorlevel% equ 0 (
    REM 检查是否有 TypeScript 文件
    dir "electron\*.ts" >nul 2>&1
    if %errorlevel% equ 0 (
        %log_info% Found TypeScript files, compiling with tsconfig.json...
        call cd electron
        call npx tsc
        if %errorlevel% neq 0 (
            %log_error% Failed to compile TypeScript files
            pause
            exit /b 1
        )
        
        %log_success% TypeScript compilation completed

        
        cd ..
        
        REM --- 复制resources目录到dist-electron ---
        %log_info% Copying resources to dist-electron...
        
        REM 检查dist-electron目录是否存在
        if not exist "dist-electron" (
            %log_info% Creating dist-electron directory...
            mkdir "dist-electron"
        )
        
        REM 复制整个resources目录
        if exist "electron\resources" (
            %log_info% Copying electron/resources to dist-electron/resources...
            
            REM 如果目标目录存在，先删除
            if exist "dist-electron\resources" (
                rmdir /s /q "dist-electron\resources"
            )
            
            REM 复制整个resources目录
            xcopy "electron\resources" "dist-electron\resources" /E /I /Y >nul
            
            if %errorlevel% equ 0 (
                %log_success% Resources copied successfully
            ) else (
                %log_warning% Failed to copy some resources, but continuing...
            )
        ) else (
            %log_warning% electron/resources directory not found, skipping copy
        )
    ) else (
        %log_info% No TypeScript files found in electron directory
    )
) else (
    %log_warning% npx not found, skipping TypeScript compilation
    %log_warning% Please ensure TypeScript is compiled manually
)

%log_success% Environment setup complete!
%log_info% Starting Electron in development mode...
echo.
%log_info% Frontend will be available at: http://localhost:5173
%log_info% Electron app will launch automatically
echo.

REM --- 启动Electron开发环境 ---
set NODE_ENV=development
call npm run electron:dev

%log_info% Development session ended

endlocal
pause