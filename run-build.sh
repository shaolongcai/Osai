#!/bin/bash

# 如果任何命令失败，立即退出脚本
set -e

echo "[INFO] Building Electron Application for macOS..."

# --- 检查 Node.js 是否安装 ---
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed or not in PATH"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# --- 如果需要，安装根目录的依赖 ---
if [ ! -d "node_modules" ]; then
    echo "[INFO] Installing root dependencies..."
    npm install
fi

# --- 如果需要，安装前端依赖 ---
if [ ! -d "frontend/node_modules" ]; then
    echo "[INFO] Installing frontend dependencies..."
    # 进入 frontend 目录执行 npm install
    (cd frontend && npm install)
fi

# --- 清理之前的构建产物 ---
if [ -d "out" ]; then
    echo "[INFO] Cleaning previous application build..."
    rm -rf "out"
fi
if [ -d "dist-electron" ]; then
    echo "[INFO] Cleaning previously compiled backend..."
    rm -rf "dist-electron"
fi
# 清理前端构建产物
if [ -d "frontend/dist" ]; then
    echo "[INFO] Cleaning previous frontend build..."
    rm -rf "frontend/dist"
fi

# --- 编译 Electron 的 TypeScript 文件 ---
echo "[INFO] Compiling Electron TypeScript files..."
(cd electron && npx tsc)
echo "[SUCCESS] Electron TypeScript compilation completed."

# --- 拷贝资源文件到 dist-electron ---
echo "[INFO] Copying resources to dist-electron..."
if [ -d "electron/resources" ]; then
    # 使用 cp -R 递归复制
    cp -R "electron/resources" "dist-electron/"
    echo "[SUCCESS] Resources copied successfully."
else
    echo "[WARNING] electron/resources directory not found, skipping copy."
fi

# --- 构建前端 ---
echo "[INFO] Building frontend..."
(cd frontend && npm run build)

# --- 使用 electron-builder 为 macOS 构建应用 ---
echo "[INFO] Building Electron application with electron-builder for macOS..."
echo "This may take several minutes..."
echo ""

# 同时为 Intel (x64) 和 Apple Silicon (arm64) 构建
npx electron-builder --mac --arm64

echo ""
echo "[SUCCESS] Build completed successfully!"
echo ""
echo "Built files are located in: out/"
echo ""

# --- 显示构建结果 ---
if [ -d "out" ]; then
    echo "[INFO] Build contents:"
    ls -l out/
    echo ""
fi

# --- 生成 macOS 更新签名文件 ---
echo "[INFO] Generating macOS update signature files..."
if [ -f "updatePack/quick-generate-mac.py" ]; then
    python3 updatePack/quick-generate-mac.py
    echo "[SUCCESS] Update signature files generated successfully!"
else
    echo "[WARNING] quick-generate-mac.py not found, skipping signature generation."
fi

echo "[INFO] Build process completed!"
echo "已完成打包，安装包位于 out 目录"
echo ""