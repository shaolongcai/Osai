# Native C++ 模块

## 目录结构
native/
├── src/                    # C++ 源码目录
│   ├── icon_extractor.cpp  # 图标提取功能
│   ├── icon_extractor.h    # 头文件
│   └── binding.cpp         # Node.js 绑定代码
├── include/                # 公共头文件
├── build/                  # 编译输出目录 (临时文件)
│   ├── Release/           # 发布版本
│   └── Debug/             # 调试版本
├── dist/                   # 最终输出目录
│   └── win32-x64-139/     # 平台特定的编译产物
├── binding.gyp            # 编译配置
├── package.json           # 模块配置
└── README.md              # 说明文档



## 编译命令
- `npm run build`: 编译 Release 版本
- `npm run build:debug`: 编译 Debug 版本  
- `npm run build:electron`: 为 Electron 编译
- `npm run clean`: 清理编译产物

## 使用方法
```javascript
const nativeModule = require('./native/dist/win32-x64-139/icon_extractor.node');
```