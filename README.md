<div align="center">
<h1> Osai - AI-Powered Intelligent Search Application </h1>
</div>

<div align="center">
  <img src="./frontend/public/logo.svg" alt="Osai Logo" width="120" height="120">
  
  <p>An intelligent local file search application based on AI technology</p>
  
  ![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)
  ![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey?style=flat-square)
  ![License](https://img.shields.io/badge/license-Apache--2.0-green?style=flat-square)
  ![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen?style=flat-square&logo=node.js)
  ![Electron](https://img.shields.io/badge/electron-38.0.0-blue?style=flat-square&logo=electron)
  
  <p><strong>Multi-language Support:</strong> [English](README.md) | [简体中文](README_CN.md) | [繁體中文](README_TW.md)</p>
  
  <p>⭐ Click the Star in the upper right corner to receive software update notifications on the GitHub homepage~</p>
  
</div>

## 📖 Project Introduction

Osai is a powerful desktop application that leverages artificial intelligence technology to provide users with an intelligent local file search experience. By combining traditional text search with modern vector semantic search, Osai can understand user search intent and provide more accurate and relevant search results.

### ✨ Key Features

- 🔍 **AI-Powered Intelligent Search** - File content search based on semantic understanding
- 📷 **OCR Image Text Recognition** - Extract text content from images for search
- 🌍 **Multi-language Support** - Supports 8 language interfaces (Simplified/Traditional Chinese, English, Japanese, Korean, French, German, Vietnamese)
- 📁 **Local File Indexing** - Quickly build local file indexes, supporting multiple file formats
- 🚀 **Vectorized Search** - Semantic similarity search using vector databases
- ⚡ **Real-time Search** - Fast and responsive search result display
- 🔄 **Auto Update** - Built-in application auto-update mechanism
- 🎨 **Modern Interface** - Beautiful user interface based on Material-UI

## 🛠️ Tech Stack

### Frontend Technologies
- **React 18** - Modern user interface framework
- **TypeScript** - Type-safe JavaScript superset
- **Material-UI (MUI)** - React component library
- **Tailwind CSS V4** - Utility-first CSS framework
- **Vite** - Fast frontend build tool
- **React Context** - State management and internationalization

### Backend Technologies
- **Electron** - Cross-platform desktop application framework
- **Node.js** - JavaScript runtime environment
- **SQLite** - Lightweight relational database
- **LanceDB** - High-performance vector database
- **Tesseract.js** - OCR text recognition engine

### AI Integration
- **Ollama** - Local AI model service
- **Vectorization Engine** - Text vectorization and semantic search
- **Multi-language OCR** - Supports Chinese, English, and other multi-language text recognition

## 🚀 Quick Start

### Requirements

- **Node.js** >= 16.0.0
- **npm** >= 8.0.0 or **pnpm** >= 7.0.0
- **Python** >= 3.8 (for OCR functionality)
- **Git**

### Installation Steps

1. **Clone the project**
   ```bash
   git clone https://github.com/your-username/ai-search.git
   cd ai-search
   ```

2. **Install dependencies**
   ```bash
   # Install main project dependencies
   npm install
   
   # Install frontend dependencies
   cd frontend
   npm install
   cd ..
   ```

3. **Run in development environment**
   ```bash
   # Windows
   ./run-dev.bat
   
   # Linux/macOS
   ./run-dev.sh
   
   # Or use npm command
   npm run electron:dev
   ```

4. **Build the application**
   ```bash
   # Windows
   ./run-build.bat
   
   # Linux/macOS
   ./run-build.sh
   
   # Or use npm commands
   npm run build:win    # Windows
   npm run build:mac    # macOS
   npm run build:linux  # Linux
   ```

## 📁 Project Structure

### Project Overview

```
ai-search/
├── electron/                    # Electron main process code
├── frontend/                    # React frontend application
├── dist-electron/               # Compiled Electron code
├── updatePack/                  # Update package related
├── build/                       # Build configuration
├── package.json                 # Main project configuration
├── vite.main.config.js          # Vite main process build configuration
├── vite.preload.config.js       # Vite preload script build configuration
├── vite.renderer.config.js      # Vite renderer process build configuration
├── run-build.bat/.sh            # Build scripts
├── run-dev.bat/.sh              # Development environment startup scripts
├── create-mac-icons.sh          # macOS icon generation script
├── dev-app-update.yml           # Development environment auto-update configuration
├── chi_sim.traineddata          # Simplified Chinese OCR training data
├── chi_tra.traineddata          # Traditional Chinese OCR training data
├── eng.traineddata              # English OCR training data
├── .gitignore                   # Git ignore file configuration
└── .npmrc                       # npm configuration file
```

### Electron Main Process Detailed Structure (`electron/`)

```
electron/
├── main.ts                      # Electron main process entry
├── preload.ts                   # Preload script, API bridge
├── tsconfig.json                # TypeScript configuration
├── api/                         # API interface layer
│   ├── file.ts                  # File operation API
│   ├── system.ts                # System-related API
│   └── update.ts                # Application update API
├── core/                        # Core business logic
│   ├── appState.ts              # Application state management
│   ├── downloader.ts            # File download service
│   ├── iconExtractor.ts         # Icon extraction service
│   ├── imageSever.ts            # Image server
│   ├── indexFiles.ts            # File indexing service
│   ├── logger.ts                # Logging system
│   ├── model.ts                 # AI model management
│   ├── pathConfigs.ts           # Path configuration management
│   ├── search.ts                # Search engine core logic
│   ├── system.ts                # System information detection
│   ├── updateService.ts         # Auto-update service
│   ├── vectorization.ts         # Vectorization service
│   └── WindowManager.ts         # Window management service
├── sever/                       # Server services
│   ├── aiSever.ts               # AI service
│   ├── documentSever.ts         # Document server
│   ├── ocrSever.ts              # OCR service
│   └── ollamaSever.ts           # Ollama AI service integration
├── database/                    # Database operations
│   ├── repositories.ts          # Database repositories
│   ├── schema.ts                # Database schema definitions
│   └── sqlite.ts                # SQLite relational database
├── workers/                     # Worker threads
│   ├── ai.worker.ts             # AI processing worker thread
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── imageProcessor.worker.ts # Image processing worker thread
│   └── indexer.worker.ts        # Indexing worker thread
├── types/                       # Type definitions
│   ├── ai.d.ts                  # AI-related types
│   ├── api.d.ts                 # API interface types
│   ├── database.d.ts            # Database types
│   ├── search.d.ts              # Search-related types
│   └── system.d.ts              # System-related types
├── resources/                   # Resource files
│   ├── app-update.yml           # Application update configuration
│   ├── assets/                  # Static resource files
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
│   ├── elevate.exe              # Windows privilege elevation tool
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   ├── ollama/                  # Ollama AI service related files
│   └── traineddata/             # OCR training data
│       ├── chi_sim.traineddata.gz  # Simplified Chinese OCR data
│       ├── chi_tra.traineddata.gz  # Traditional Chinese OCR data
│       └── eng.traineddata.gz      # English OCR data
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   ├── include/                 # C++ header files
│   │   └── icon_extractor.h     # Icon extractor header
│   └── src/                     # C++ source files
│       ├── binding.cpp          # Node.js binding
│       ├── icon_extractor.cpp   # Icon extractor implementation
│       └── toIcon.cpp           # Icon conversion
├── units/                       # Utility classes
│   ├── enum.ts                  # Enum definitions
│   ├── math.ts                  # Math utilities
│   └── pathUtils.ts             # Path utility functions
└── data/                        # Data files
    └── prompt.ts                # AI prompt templates
```

### React Frontend Detailed Structure (`frontend/`)

```
frontend/
├── package.json                 # Frontend project dependencies and script configuration
├── vite.config.ts               # Vite build configuration
├── tailwind.config.ts           # Tailwind CSS V4 configuration file
├── tsconfig.json                # TypeScript configuration
├── eslint.config.js             # ESLint code style configuration
├── index.html                   # HTML entry file
├── public/                      # Public resources
│   ├── logo.svg                 # Application icon
│   └── vite.svg                 # Vite icon
├── src/                         # Source code
│   ├── main.tsx                 # React application entry
│   ├── App.tsx                  # Main application component
│   ├── App.css                  # Application styles
│   ├── index.css                # Global styles
│   ├── theme.ts                 # Material-UI theme configuration
│   ├── global.d.ts              # Global type definitions
│   ├── vite-env.d.ts            # Vite environment type definitions
│   ├── pages/                   # Page components
│   │   ├── home/                # Home page
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings page
│   ├── components/              # Component library
│   │   ├── AIMarkDialog/        # AI mark dialog
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx       # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   ├── Dialog/              # Generic dialog component
│   │   │   └── Dialog.tsx
│   │   ├── Guide.tsx            # Guide component
│   │   ├── InfoCard.tsx         # Information card component
│   │   ├── LanguageSwitcher/    # Language switcher
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── Login.tsx            # Login component
│   │   ├── ReportProtocol.tsx   # Report protocol component
│   │   ├── search.tsx           # Search component
│   │   ├── SearchPanel.tsx      # Search panel component
│   │   ├── Setting/             # Settings component
│   │   │   └── Setting.tsx
│   │   ├── SettingItem/         # Setting item component
│   │   │   └── SettingItem.tsx
│   │   ├── TableRelust/         # Result table component
│   │   │   └── TableRelust.tsx
│   │   ├── UpdateNotification.tsx # Update notification component
│   │   ├── UpdateTipsDialog/    # Update tips dialog
│   │   │   └── UpdateTipsDialog.tsx
│   │   └── index.ts             # Component unified export
│   ├── contexts/                # Context management
│   │   └── I18nContext.tsx      # Internationalization context
│   ├── i18n/                    # Internationalization module
│   │   ├── index.ts             # i18n module exports
│   │   ├── constants.ts         # i18n constants
│   │   └── locales/             # Multi-language translation files
│   │       ├── zh-CN/           # Simplified Chinese
│   │       │   ├── app.json
│   │       │   ├── search.json
│   │       │   └── ...           # Other translation files
│   │       ├── zh-TW/            # Traditional Chinese
│   │       ├── en-US/            # English
│   │       ├── ja-JP/            # Japanese
│   │       ├── ko-KR/            # Korean
│   │       ├── fr-FR/            # French
│   │       ├── de-DE/            # German
│   │       └── vi-VN/            # Vietnamese
│   ├── config/                  # Configuration files
│   │   └── languages.ts         # Language configuration
│   ├── types/                   # Type definitions
│   │   ├── i18n.ts              # Internationalization types
│   │   ├── electron.ts          # Electron API types
│   │   └── system.ts            # System-related types
│   ├── assets/                  # Static resources
│   │   ├── images/              # Image resources
│   │   │   ├── weChat.png       # WeChat QR code
│   │   │   └── flags/           # Flag SVG files
│   │   └── icons/               # Icon files
│   ├── flags/                   # Flag components
│   │   └── FlagIcons.tsx        # React flag icon component
│   ├── utils/                   # Utility functions
│   │   ├── enum.ts              # Enum utilities
│   │   └── tools.ts             # Tool functions
│   ├── hooks/                   # Custom React hooks
│   │   └── useIcon.ts           # Icon hook
│   ├── RootProviders.tsx        # Root providers component
│   ├── searchIndex.tsx          # Search index page
│   ├── settingIndex.tsx         # Settings index page
│   └── context/                 # Legacy context (compatibility)
│       └── globalContext.ts     # Global state context
└── dist/                        # Build output
    ├── assets/                  # Compiled resources
    ├── index.html               # Compiled HTML
    └── locales/                 # Compiled language files
```

### Core Directory Details

#### Electron Main Process (`electron/`)

- **`main.ts`** - Electron main process entry, responsible for creating windows and initializing services
- **`preload.ts`** - Preload script, provides secure API bridge
- **`api/`** - API interface layer
  - `file.ts` - File operation API
  - `system.ts` - System-related API
  - `update.ts` - Application update API
- **`core/`** - Core business logic
  - `search.ts` - Search engine core
  - `indexFiles.ts` - File indexing service
  - `vectorization.ts` - Vectorization service
  - `model.ts` - AI model management
  - `iconExtractor.ts` - Icon extraction service
  - `WindowManager.ts` - Window management service
- **`sever/`** - Server services
  - `aiSever.ts` - AI service
  - `documentSever.ts` - Document server
  - `ocrSever.ts` - OCR service
  - `ollamaSever.ts` - Ollama AI service integration
- **`database/`** - Database operations
  - `sqlite.ts` - SQLite database
  - `repositories.ts` - Database repositories
  - `schema.ts` - Database schema definitions
- **`workers/`** - Worker threads
  - `ai.worker.ts` - AI processing thread
  - `icon.worker.ts` - Icon processing thread
  - `imageProcessor.worker.ts` - Image processing thread
  - `indexer.worker.ts` - Indexing worker thread

#### React Frontend (`frontend/src/`)

- **`components/`** - React component library
  - `Search/` - Search component (search.tsx, SearchPanel.tsx)
  - `TableRelust/` - Result table component
  - `LanguageSwitcher/` - Language switcher
  - `Setting/` - Settings component
  - `AIMarkDialog/` - AI mark dialog
  - `AIprovider.tsx` - AI provider component
  - `Guide.tsx` - Guide component
  - `Login.tsx` - Login component
  - `UpdateNotification.tsx` - Update notification
- **`pages/`** - Page components
  - `home/Home2.tsx` - Home page
  - `preload/Preload.tsx` - Preload page
  - `Search.tsx` - Search page
  - `Setting.tsx` - Settings page
- **`contexts/`** - Context management
  - `I18nContext.tsx` - Internationalization context
  - `globalContext.ts` - Global state context
- **`config/`** - Configuration files
  - `languages.ts` - Language configuration
- **`hooks/`** - Custom React hooks
  - `useIcon.ts` - Icon hook

### Update and Deployment Related (`updatePack/`)

```
updatePack/
├── latest.yml                   # Windows update configuration
├── latest-x64-mac.yml           # macOS x64 update configuration
├── latest-arm64-mac.yml         # macOS ARM64 update configuration
├── quick-generate.py            # Update package generation script
└── quick-generate-mac.py        # macOS update package generation script
```

### Build Configuration (`build/`)

- **`entitlements.mac.plist`** - macOS application permissions configuration

### OCR Training Data Files

- **`chi_sim.traineddata`** - Simplified Chinese OCR training data
- **`chi_tra.traineddata`** - Traditional Chinese OCR training data  
- **`eng.traineddata`** - English OCR training data

## 🏗️ Technical Architecture

### Process Communication Architecture

- **Main Process ↔ Renderer Process**: Secure communication through `electronAPI` in `preload.ts`
- **Worker Threads**: Use Web Workers to handle time-consuming tasks (indexing, AI processing)
- **API Bridge**: Preload script provides secure Node.js API access

### Data Storage Architecture

- **SQLite**: Stores file metadata, configuration information, user settings
- **LanceDB**: Stores text vectors, supports high-performance semantic similarity search
- **Local File System**: Caches index data and temporary files

### AI Integration Architecture

- **AI Service**: Centralized AI service management (`sever/aiSever.ts`)
- **Ollama Service**: Local AI model service integration (`sever/ollamaSever.ts`), provides text understanding and generation capabilities
- **Vectorization Engine**: Converts text to high-dimensional vectors for semantic search
- **OCR Service**: Tesseract-based OCR service (`sever/ocrSever.ts`) for multi-language image text recognition
- **Document Server**: Document processing service (`sever/documentSever.ts`)
- **Worker Threads**: Asynchronously process AI tasks to avoid blocking the main interface

### Internationalization Architecture

- **React Context**: Manages global language state
- **i18n Module**: Centralized internationalization module (`frontend/src/i18n/`)
- **JSON Translation Files**: Complete translations for 8 languages, organized by namespace in `frontend/src/i18n/locales/`
- **Dynamic Language Switching**: Real-time interface language switching without restarting the application
- **Flag Icon Components**: React component-based flag icons for efficient rendering

### Component Function Details

#### Core Page Components

- **`home/Home2.tsx`** - Home page component
  - Integrates search interface and result display
  - Manages search state and result data
  - Handles user interactions and events

- **`preload/Preload.tsx`** - Preload page
  - Loading interface when application starts
  - Displays initialization progress
  - Handles startup errors

- **`Search.tsx`** - Search page
  - Dedicated search interface
  - Search functionality and result display

- **`Setting.tsx`** - Settings page
  - Application configuration interface
  - User preferences management

#### Core Feature Components

- **`Search/`** - Search components
  - `search.tsx` - Search input box and search logic
  - `SearchPanel.tsx` - Search panel component
  - Supports real-time search suggestions
  - Handles search history

- **`TableRelust/`** - Result table component
  - Table display of search results
  - Supports sorting, filtering, pagination
  - File preview and operations

- **`LanguageSwitcher/`** - Language switcher
  - Multi-language switching interface
  - Flag icon display
  - Language state management

- **`AIMarkDialog/`** - AI mark dialog
  - AI file content marking functionality
  - Intelligent tag generation
  - Mark result management

- **`Setting/`** - Settings component
  - Application configuration interface
  - Index path management
  - AI service configuration
  - System preferences

- **`Guide.tsx`** - Guide component
  - User guide and tutorials
  - Feature introductions

- **`Login.tsx`** - Login component
  - User authentication interface

- **`UpdateNotification.tsx`** - Update notification
  - Update notification display
  - Update status management

#### Utility and Auxiliary Components

- **`Dialog/`** - Generic dialog
  - Reusable modal dialog
  - Supports custom content and operations
  - Unified style and interaction

- **`InfoCard/`** - Information card
  - System information display
  - GPU, memory status display
  - Service status monitoring

- **`Contact/`** - Contact information
  - Developer contact information
  - WeChat QR code display
  - Feedback channels

### Core Business Logic Details

#### File Indexing System (`core/indexFiles.ts`)

- **File Scanning**: Recursively scan specified directories
- **Content Extraction**: Supports text extraction from multiple file formats
- **Incremental Indexing**: Only processes new and modified files
- **Concurrent Processing**: Uses worker threads to improve indexing efficiency

#### Search Engine (`core/search.ts`)

- **Keyword Search**: Traditional text matching search
- **Semantic Search**: Intelligent search based on vector similarity
- **Hybrid Search**: Combines keyword and semantic search results
- **Result Sorting**: Intelligent sorting based on relevance and time

#### AI Service Management (`sever/aiSever.ts`)

- **Service Management**: Centralized AI service management
- **Model Loading**: Dynamic loading and unloading of AI models
- **Resource Management**: Monitor GPU and memory usage
- **Health Check**: Detect AI service status
- **Error Recovery**: Automatically restart failed services

#### Vectorization Service (`core/vectorization.ts`)

- **Text Preprocessing**: Clean and normalize text content
- **Vector Generation**: Convert text to high-dimensional vectors
- **Batch Processing**: Efficiently process large amounts of text data
- **Vector Storage**: Store vector data in LanceDB

## 🔧 Development Guide

### Development Environment Setup

1. **Install development tools**
   ```bash
   # Install Electron globally
   npm install -g electron
   
   # Install TypeScript
   npm install -g typescript
   ```

2. **Configure IDE**
   - Recommended to use VS Code
   - Install TypeScript, React, Electron related plugins

3. **Environment variable configuration**
   ```bash
   # Create .env file
   cp .env.example .env
   
   # Configure necessary environment variables
   OLLAMA_HOST=http://localhost:11434
   ```

### Code Standards

- Use TypeScript for type checking
- Follow ESLint code standards
- Use Prettier for code formatting
- Component naming uses PascalCase
- File naming uses camelCase

### Tailwind CSS Usage Guide

This project uses **Tailwind CSS V4** as the main styling framework, while retaining some SCSS modules for component styles.

#### Configuration

- **Configuration file**: `frontend/tailwind.config.ts`
- **Vite plugin**: Integrated `@tailwindcss/vite` plugin
- **CSS import**: Use `@import "tailwindcss"` in `frontend/src/App.css`

#### Custom Theme

The Tailwind configuration file defines the following custom themes:

- **Color System**:
  - `primary`: Primary color (#1976d2)
  - `background`: Background color system (#FAFDFC, #FFFFFF, #F5F5F5)
  - `border`: Border color system (#F0F2F5)
  - `text`: Text colors (primary, secondary, tertiary, disabled)

- **Spacing**: Extended standard spacing system
- **Border Radius**: Custom `xl` (16px) and `2xl` (20px)
- **Shadows**: Custom shadows based on project design system

#### Usage

1. **Use Tailwind utility classes in components**:
   ```tsx
   <div className="p-4 rounded-xl bg-background border border-border">
     <h1 className="text-xl font-bold text-text-primary">Title</h1>
   </div>
   ```

2. **Use custom colors**:
   ```tsx
   <button className="bg-primary text-white hover:bg-primary-dark">
     Button
   </button>
   ```

3. **Coexist with SCSS modules**:
   The project is gradually migrating from SCSS to Tailwind CSS. Currently, both methods can coexist:
   - New components prioritize Tailwind CSS
   - Existing SCSS module styles remain unchanged, gradually migrating

#### Migration Plan

- ✅ Tailwind CSS V4 installed
- ✅ Configuration file created
- 🔄 Gradually convert SCSS module styles to Tailwind utility classes
- 📝 Retain necessary SCSS for complex styles and MUI theme customization

### Debugging Guide

1. **Main process debugging**
   ```bash
   npm run electron:dev
   # Attach to Electron main process in VS Code
   ```

2. **Renderer process debugging**
   - Use Chrome DevTools
   - Press F12 in the application to open developer tools

3. **Log viewing**
   - Main process logs: `console.log` outputs to terminal
   - Renderer process logs: View in DevTools Console

## 📦 Build and Deployment

### Build Process

1. **Frontend build**
   ```bash
   cd frontend
   npm run build
   ```

2. **Electron build**
   ```bash
   npm run build:electron
   ```

3. **Package application**
   ```bash
   # Windows
   npm run build:win
   
   # macOS
   npm run build:mac
   
   # Linux
   npm run build:linux
   ```

### Release Configuration

- **Windows**: Generate `.exe` installer and portable version
- **macOS**: Generate `.dmg` installer and `.app` application package
- **Linux**: Generate `.AppImage` and `.deb` packages

### Auto Update

The application has built-in auto-update functionality:
- Check for updates: Automatically check on startup
- Download updates: Download update packages in the background
- Install updates: Automatically install after user confirmation

## 🌍 Internationalization

### Supported Languages

- 🇨🇳 Simplified Chinese (zh-CN)
- 🇹🇼 Traditional Chinese (zh-TW)
- 🇺🇸 English (en-US)
- 🇯🇵 Japanese (ja-JP)
- 🇰🇷 Korean (ko-KR)
- 🇫🇷 French (fr-FR)
- 🇩🇪 German (de-DE)
- 🇻🇳 Vietnamese (vi-VN)

### Adding New Languages

1. Add a new language directory in `frontend/src/i18n/locales/` with all translation JSON files
2. Add language configuration in `frontend/src/config/languages.ts`
3. Add corresponding flag icon in `frontend/src/flags/FlagIcons.tsx`

## Packaging Notes

Must be placed in the extraResources array

### Windows

```
{
"from": "dist-electron/resources/Ollama",
"to": "Ollama",
"filter": [
    "**/*",
    "!cuda_v12/**/*",
    "!**/cuda_v12/**"
]
},
```

### macOS

```
{
    "from": "dist-electron/resources/",
    "to": "ollama"
  },
```

## 🤝 Contributing

We welcome all forms of contributions! Please follow these steps:

1. **Fork the project**
2. **Create a feature branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the branch** (`git push origin feature/AmazingFeature`)
5. **Create a Pull Request**

### Contribution Types

- 🐛 Bug fixes
- ✨ New feature development
- 📝 Documentation improvements
- 🎨 UI/UX optimization
- 🌍 Internationalization translations
- ⚡ Performance optimization

## 📄 License

This project is licensed under the Apache-2.0 License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact Us

- **Project Homepage**: [GitHub Repository](https://github.com/your-username/ai-search)
- **Issue Reporting**: [GitHub Issues](https://github.com/your-username/ai-search/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/ai-search/discussions)

## 🙏 Acknowledgments

Thanks to the following open-source projects for their support:

- [Electron](https://electronjs.org/) - Cross-platform desktop application framework
- [React](https://reactjs.org/) - User interface library
- [Material-UI](https://mui.com/) - React component library
- [Ollama](https://ollama.ai/) - Local AI model service
- [LanceDB](https://lancedb.com/) - Vector database
- [Tesseract.js](https://tesseract.projectnaptha.com/) - OCR engine

---

<div align="center">
  <p>If this project is helpful to you, please give us a ⭐️</p>
  <p>Made with ❤️ by Osai Team</p>
</div>
