#!/bin/bash
set -e

# 颜色定义（ANSI 转义序列）
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数实现
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_info "Starting Electron Development Environment..."

# --- 检查 Node.js ---
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed or not in PATH"
    log_error "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# 显示 Node.js 版本
NODE_VERSION=$(node --version)
log_info "Node.js version: $NODE_VERSION"

# --- 安装根目录依赖 ---
if [ ! -d "node_modules" ]; then
    log_info "Installing Electron dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Failed to install Electron dependencies"
        exit 1
    fi
else
    log_info "Electron dependencies already installed"
fi

# --- 安装前端依赖 ---
cd "$(dirname "$0")/frontend"
if [ ! -d "node_modules" ]; then
    log_info "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        log_error "Failed to install frontend dependencies"
        cd ..
        exit 1
    fi
else
    log_info "Frontend dependencies already installed"
fi
# 返回根目录
cd ..

# --- 清理之前编译的后端文件 ---
if [ -d "dist-electron" ]; then
    log_info "Cleaning previously compiled backend..."
    rm -rf "dist-electron"
fi

# --- 编译TypeScript文件 ---
log_info "Compiling TypeScript files..."

# 检查 npx 是否可用
if command -v npx &> /dev/null; then
    # 检查是否有 TypeScript 文件
    if ls electron/*.ts 1> /dev/null 2>&1; then
        log_info "Found TypeScript files, compiling with tsconfig.json..."
        cd electron
        npx tsc
        if [ $? -ne 0 ]; then
            log_error "Failed to compile TypeScript files"
            exit 1
        fi
        
        log_success "TypeScript compilation completed"
        
        cd ..
        
        # --- 复制resources目录到dist-electron ---
        log_info "Copying resources to dist-electron..."
        
        # 检查dist-electron目录是否存在
        if [ ! -d "dist-electron" ]; then
            log_info "Creating dist-electron directory..."
            mkdir -p "dist-electron"
        fi
        
        # 复制整个resources目录
        if [ -d "electron/resources" ]; then
            log_info "Copying electron/resources to dist-electron/resources..."
            
            # 如果目标目录存在，先删除
            if [ -d "dist-electron/resources" ]; then
                rm -rf "dist-electron/resources"
            fi
            
            # 复制整个resources目录
            cp -r "electron/resources" "dist-electron/resources"
            
            if [ $? -eq 0 ]; then
                log_success "Resources copied successfully"
            else
                log_warning "Failed to copy some resources, but continuing..."
            fi
        else
            log_warning "electron/resources directory not found, skipping copy"
        fi
    else
        log_info "No TypeScript files found in electron directory"
    fi
else
    log_warning "npx not found, skipping TypeScript compilation"
    log_warning "Please ensure TypeScript is compiled manually"
fi

log_success "Environment setup complete!"
log_info "Starting Electron in development mode..."
echo
log_info "Frontend will be available at: http://localhost:5173"
log_info "Electron app will launch automatically"
echo

# --- 启动Electron开发环境 ---
export NODE_ENV=development
npm run electron:dev

log_info "Development session ended"