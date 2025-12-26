<div align="center">
# Osai - AI-Powered Intelligent Search Application

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
│   ├── iconExtractor.ts         # Icon extraction service
│   ├── iconExtractor.ts         # Icon extraction service
│   ├── imageSever.ts            # Image server
│   ├── indexFiles.ts            # File indexing service
├── sever/                       # Server services
│   ├── vectorization.ts         # Vectorization service
├── sever/                       # Server services
│   ├── vectorization.ts         # Vectorization service
│   └── WindowManager.ts         # Window management service
├── sever/                       # Server services
│   ├── vectorization.ts         # Vectorization service
│   └── WindowManager.ts         # Window management service
├── sever/                       # Server services
│   ├── aiSever.ts               # AI service
│   ├── documentSever.ts         # Document server
│   ├── ocrSever.ts              # OCR service
│   └── ollamaSever.ts           # Ollama AI service integration
│   ├── documentSever.ts         # Document server
│   ├── repositories.ts          # Database repositories
│   ├── schema.ts                # Database schema definitions
│   └── ollamaSever.ts           # Ollama AI service integration
│   ├── documentSever.ts         # Document server
│   ├── repositories.ts          # Database repositories
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── imageProcessor.worker.ts # Image processing worker thread
│   └── indexer.worker.ts        # Indexing worker thread
│   └── ollamaSever.ts           # Ollama AI service integration
│   ├── documentSever.ts         # Document server
│   ├── repositories.ts          # Database repositories
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── imageProcessor.worker.ts # Image processing worker thread
│   └── indexer.worker.ts        # Indexing worker thread
│   └── ollamaSever.ts           # Ollama AI service integration
│   ├── documentSever.ts         # Document server
│   ├── repositories.ts          # Database repositories
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   ├── imageProcessor.worker.ts # Image processing worker thread
│   └── ollamaSever.ts           # Ollama AI service integration
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
│   ├── documentSever.ts         # Document server
│   ├── enum.ts                  # Enum definitions
│   ├── math.ts                  # Math utilities
│   └── pathUtils.ts             # Path utility functionsories
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   ├── imageProcessor.worker.ts # Image processing worker thread
│   └── ollamaSever.ts           # Ollama AI service integration
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
│   ├── documentSever.ts         # Document server
│   ├── enum.ts                  # Enum definitions
│   ├── math.ts                  # Math utilities
│   └── pathUtils.ts             # Path utility functionsories
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pageta
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx      # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   └── icon_extractor.h     # Icon extractor header
│   │   │   └── Dialog.tsx
│   │   ├── Guide.tsx            # Guide component
│   │   ├── InfoCard.tsx         # Information card component
│       ├── binding.cpp          # Node.js binding
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── Login.tsx            # Login component
│   │   ├── ReportProtocol.tsx   # Report protocol component
│   │   ├── search.tsx           # Search component
│   │   ├── SearchPanel.tsx      # Search panel component
│   ├── documentSever.ts         # Document server
│   │   │   └── Setting.tsx
│   ├── enum.ts                  # Enum definitions
│   │   │   └── SettingItem.tsx
│   ├── math.ts                  # Math utilities
│   │   │   └── TableRelust.tsx
│   │   ├── UpdateNotification.tsx # Update notification component
│   └── pathUtils.ts             # Path utility functionsories
│   │   │   └── UpdateTipsDialog.tsx
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pageta
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx      # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   └── icon_extractor.h     # Icon extractor header
│   │   │   └── Dialog.tsx
│   │   ├── Guide.tsx            # Guide component
│   │   ├── InfoCard.tsx         # Information card component
│       ├── binding.cpp          # Node.js binding
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
│   │   ├── Login.tsx            # Login component
│   │   ├── ReportProtocol.tsx   # Report protocol component
│   │   ├── search.tsx           # Search component
│   │   ├── SearchPanel.tsx      # Search panel component
│   ├── documentSever.ts         # Document server
│   │   │   └── Setting.tsx
│   ├── enum.ts                  # Enum definitions
│   │   │   └── SettingItem.tsx
│   │   ├── enum.ts              # Enum utilities
│   │   └── tools.ts             # Tool functions
│   ├── hooks/                   # Custom React hooks
│   │   └── useIcon.ts           # Icon hook
│   ├── RootProviders.tsx       # Root providers component
│   ├── searchIndex.tsx          # Search index page
│   ├── settingIndex.tsx         # Settings index page
│   ├── math.ts                  # Math utilities
│       └── globalContext.ts     # Global state context
│   │   ├── UpdateNotification.tsx # Update notification component
│   └── pathUtils.ts             # Path utility functionsories
│   │   │   └── UpdateTipsDialog.tsx
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pageta
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx      # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   └── icon_extractor.h     # Icon extractor header
  - `iconExtractor.ts` - Icon extraction service
  - `WindowManager.ts` - Window management service
- **`sever/`** - Server services
  - `aiSever.ts` - AI service
  - `documentSever.ts` - Document server
  - `ocrSever.ts` - OCR service
  - `ollamaSever.ts` - Ollama AI service integration
│   │   ├── Guide.tsx            # Guide component
│   │   ├── InfoCard.tsx         # Information card component
  - `repositories.ts` - Database repositories
  - `schema.ts` - Database schema definitions binding
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
  - `icon.worker.ts` - Icon processing thread
│   │   ├── Login.tsx            # Login component
  - `indexer.worker.ts` - Indexing worker thread
│   │   ├── ReportProtocol.tsx   # Report protocol component
│   │   ├── search.tsx           # Search component
│   │   ├── SearchPanel.tsx      # Search panel component
- **`components/`** - React component library
  - `Search/` - Search component (search.tsx, SearchPanel.tsx)
│   ├── enum.ts                  # Enum definitions
│   │   │   └── SettingItem.tsx
│   │   ├── enum.ts              # Enum utilities
│   │   └── tools.ts             # Tool functions
  - `AIprovider.tsx` - AI provider component
  - `Guide.tsx` - Guide component
  - `Login.tsx` - Login component
  - `UpdateNotification.tsx` - Update notification
│   ├── hooks/                   # Custom React hooks
  - `home/Home2.tsx` - Home page
  - `preload/Preload.tsx` - Preload page
  - `Search.tsx` - Search page
  - `Setting.tsx` - Settings page   # Root providers component
│   ├── searchIndex.tsx          # Search index page
│   ├── settingIndex.tsx         # Settings index page
  - `globalContext.ts` - Global state context
│   ├── math.ts                  # Math utilities
│       └── globalContext.ts     # Global state context
- **`hooks/`** - Custom React hooks
  - `useIcon.ts` - Icon hook
│   │   ├── UpdateNotification.tsx # Update notification component
│   └── pathUtils.ts             # Path utility functionsories
│   │   │   └── UpdateTipsDialog.tsx
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
│   ├── icon.worker.ts           # Icon processing worker thread
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pageta
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx      # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   └── icon_extractor.h     # Icon extractor header
  - `iconExtractor.ts` - Icon extraction service
  - `WindowManager.ts` - Window management service
- **`sever/`** - Server services
  - `aiSever.ts` - AI service
  - `documentSever.ts` - Document server
  - `ocrSever.ts` - OCR service
  - `ollamaSever.ts` - Ollama AI service integration
│   │   ├── Guide.tsx            # Guide component
│   │   ├── InfoCard.tsx         # Information card component
  - `repositories.ts` - Database repositories
  - `schema.ts` - Database schema definitions binding
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
  - `icon.worker.ts` - Icon processing thread
│   │   ├── Login.tsx            # Login component
  - `indexer.worker.ts` - Indexing worker thread
│   │   ├── ReportProtocol.tsx   # Report protocol component
- **AI Service**: Centralized AI service management (`sever/aiSever.ts`)
- **Ollama Service**: Local AI model service integration (`sever/ollamaSever.ts`), provides text understanding and generation capabilities
│   │   ├── SearchPanel.tsx      # Search panel component
- **OCR Service**: Tesseract-based OCR service (`sever/ocrSever.ts`) for multi-language image text recognition
- **Document Server**: Document processing service (`sever/documentSever.ts`)
  - `Search/` - Search component (search.tsx, SearchPanel.tsx)
│   ├── enum.ts                  # Enum definitions
│   │   │   └── SettingItem.tsx
│   │   ├── enum.ts              # Enum utilities
│   │   └── tools.ts             # Tool functions
  - `AIprovider.tsx` - AI provider component
  - `Guide.tsx` - Guide component
  - `Login.tsx` - Login component
  - `UpdateNotification.tsx` - Update notification
│   ├── hooks/                   # Custom React hooks
  - `home/Home2.tsx` - Home page
  - `preload/Preload.tsx` - Preload page
  - `Search.tsx` - Search page
  - `Setting.tsx` - Settings page   # Root providers component
- **`home/Home2.tsx`** - Home page componentndex page
│   ├── settingIndex.tsx         # Settings index page
  - `globalContext.ts` - Global state context
│   ├── math.ts                  # Math utilities
│       └── globalContext.ts     # Global state context
- **`hooks/`** - Custom React hooks
  - `useIcon.ts` - Icon hook
│   │   ├── UpdateNotification.tsx # Update notification component
│   └── pathUtils.ts             # Path utility functions
│   │   │   └── UpdateTipsDialog.tsx
- **`Search.tsx`** - Search page
  - Dedicated search interface
  - Search functionality and result display

- **`Setting.tsx`** - Settings page
  - Application configuration interface
  - User preferences management

│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
- **`Search/`** - Search components
  - `search.tsx` - Search input box and search logic
  - `SearchPanel.tsx` - Search panel componenton processing worker thread
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pageta
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx      # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   └── icon_extractor.h     # Icon extractor header
  - `iconExtractor.ts` - Icon extraction service
  - `WindowManager.ts` - Window management service
- **`sever/`** - Server services
  - `aiSever.ts` - AI service
  - `documentSever.ts` - Document server
  - `ocrSever.ts` - OCR service
  - `ollamaSever.ts` - Ollama AI service integration
│   │   ├── Guide.tsx            # Guide component
  - System preferences

- **`Guide.tsx`** - Guide component
  - User guide and tutorials
  - Feature introductions

- **`Login.tsx`** - Login component
  - User authentication interface

- **`UpdateNotification.tsx`** - Update notification
  - Update notification display
  - Update status management
  - System preferences

- **`Guide.tsx`** - Guide component
  - User guide and tutorials
  - Feature introductions

- **`Login.tsx`** - Login component
  - User authentication interface

- **`UpdateNotification.tsx`** - Update notification
  - Update notification display
  - Update status management
│   │   ├── InfoCard.tsx         # Information card component
  - `repositories.ts` - Database repositories
  - `schema.ts` - Database schema definitions binding
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
  - `icon.worker.ts` - Icon processing thread
│   │   ├── Login.tsx            # Login component
  - `indexer.worker.ts` - Indexing worker thread
│   │   ├── ReportProtocol.tsx   # Report protocol component
- **AI Service**: Centralized AI service management (`sever/aiSever.ts`)
- **Ollama Service**: Local AI model service integration (`sever/ollamaSever.ts`), provides text understanding and generation capabilities
│   │   ├── SearchPanel.tsx      # Search panel component
- **OCR Service**: Tesseract-based OCR service (`sever/ocrSever.ts`) for multi-language image text recognition
- **Document Server**: Document processing service (`sever/documentSever.ts`)cy
  - `Search/` - Search component (search.tsx, SearchPanel.tsx)
│   ├── enum.ts                  # Enum definitions
│   │   │   └── SettingItem.tsx
│   │   ├── enum.ts              # Enum utilities
│   │   └── tools.ts             # Tool functions
  - `AIprovider.tsx` - AI provider component
  - `Guide.tsx` - Guide component
  - `Login.tsx` - Login component
  - `UpdateNotification.tsx` - Update notification
│   ├── hooks/                   # Custom React hooks
  - `home/Home2.tsx` - Home page
  - `preload/Preload.tsx` - Preload page
  - `Search.tsx` - Search page
  - `Setting.tsx` - Settings page   # Root providers component
- **`home/Home2.tsx`** - Home page componentndex page
│   ├── settingIndex.tsx         # Settings index page
  - `globalContext.ts` - Global state context
│   ├── math.ts                  # Math utilities
│       └── globalContext.ts     # Global state context
- **`hooks/`** - Custom React hooks
  - `useIcon.ts` - Icon hook
│   │   ├── UpdateNotification.tsx # Update notification component
│   └── pathUtils.ts             # Path utility functions
│   │   │   └── UpdateTipsDialog.tsx
- **`Search.tsx`** - Search page
  - Dedicated search interface
  - Search functionality and result display

- **`Setting.tsx`** - Settings page
  - Application configuration interface
  - User preferences management

│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
2. **Configure IDE**
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pageta
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx      # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   └── icon_extractor.h     # Icon extractor header
  - `iconExtractor.ts` - Icon extraction service
  - `WindowManager.ts` - Window management service
- **`sever/`** - Server services
  - `aiSever.ts` - AI service
  - `documentSever.ts` - Document server
  - `ocrSever.ts` - OCR service
  - `ollamaSever.ts` - Ollama AI service integration
│   │   ├── Guide.tsx            # Guide component
│   │   ├── InfoCard.tsx         # Information card component
  - `repositories.ts` - Database repositories
  - `schema.ts` - Database schema definitions binding
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
  - `icon.worker.ts` - Icon processing thread
│   │   ├── Login.tsx            # Login component
  - `indexer.worker.ts` - Indexing worker thread
│   │   ├── ReportProtocol.tsx   # Report protocol component
- **AI Service**: Centralized AI service management (`sever/aiSever.ts`)
- **Ollama Service**: Local AI model service integration (`sever/ollamaSever.ts`), provides text understanding and generation capabilities
│   │   ├── SearchPanel.tsx      # Search panel component
- **OCR Service**: Tesseract-based OCR service (`sever/ocrSever.ts`) for multi-language image text recognition
- **Document Server**: Document processing service (`sever/documentSever.ts`)
  - `Search/` - Search component (search.tsx, SearchPanel.tsx)
│   ├── enum.ts                  # Enum definitions
│   │   │   └── SettingItem.tsx
│   │   ├── enum.ts              # Enum utilities
│   │   └── tools.ts             # Tool functions
  - `AIprovider.tsx` - AI provider component
  - `Guide.tsx` - Guide component
  - `Login.tsx` - Login component
  - `UpdateNotification.tsx` - Update notification
│   ├── hooks/                   # Custom React hooks
  - `home/Home2.tsx` - Home page
  - `preload/Preload.tsx` - Preload page
  - `Search.tsx` - Search page
  - `Setting.tsx` - Settings page   # Root providers component
│   ├── searchIndex.tsx          # Search index page
│   ├── settingIndex.tsx         # Settings index page
  - `globalContext.ts` - Global state context
│   ├── math.ts                  # Math utilities
│       └── globalContext.ts     # Global state context
- **`hooks/`** - Custom React hooks
  - `useIcon.ts` - Icon hook
│   │   ├── UpdateNotification.tsx # Update notification component
│   └── pathUtils.ts             # Path utility functions
│   │   │   └── UpdateTipsDialog.tsx
│   │   ├── icon.icns            # macOS icon
│   │   ├── icon.png             # Application icon
│   │   └── logo-256.ico         # Windows icon
   - Existing SCSS module styles remain unchanged, gradually migrating
│   ├── get_programs.ps1         # PowerShell script for getting programs
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pageta
├── native/                      # Native modules
│   ├── binding.gyp              # Node.js native addon build config
│   │   │   └── AIMarkDialog.tsx
│   │   ├── AIprovider.tsx      # AI provider component
│   │   ├── Cate.tsx             # Category component
│   │   ├── Contact.tsx          # Contact information component
│   │   └── icon_extractor.h     # Icon extractor header
  - `iconExtractor.ts` - Icon extraction service
  - `WindowManager.ts` - Window management service
- **`sever/`** - Server services
  - `aiSever.ts` - AI service
  - `documentSever.ts` - Document server
  - `ocrSever.ts` - OCR service
  - `ollamaSever.ts` - Ollama AI service integration
│   │   ├── Guide.tsx            # Guide component
│   │   ├── InfoCard.tsx         # Information card component
  - `repositories.ts` - Database repositories
  - `schema.ts` - Database schema definitions binding
│   │   │   ├── index.ts
│   │   │   └── LanguageSwitcher.tsx
  - `icon.worker.ts` - Icon processing thread
│   │   ├── Login.tsx            # Login component
  - `indexer.worker.ts` - Indexing worker thread
│   │   ├── ReportProtocol.tsx   # Report protocol component
│   │   ├── search.tsx           # Search component
│   │   ├── SearchPanel.tsx      # Search panel component

│   │   │   └── Setting.tsx
│   ├── enum.ts                  # Enum definitions
│   │   │   └── SettingItem.tsx
│   │   ├── enum.ts              # Enum utilities
│   │   └── tools.ts             # Tool functions
│   ├── hooks/                   # Custom React hooks
│   │   └── useIcon.ts           # Icon hook
│   ├── RootProviders.tsx       # Root providers component
│   ├── searchIndex.tsx          # Search index page
│   ├── settingIndex.tsx         # Settings index page
│   ├── math.ts                  # Math utilities
│       └── globalContext.ts     # Global state context
│   │   ├── UpdateNotification.tsx # Update notification component
│   └── pathUtils.ts             # Path utility functions
│   │   │   └── UpdateTipsDialog.tsx
   ```

### Release Configuration

- **Windows**: Generate `.exe` installer and portable version
│   │   │   └── Home2.tsx        # Home page component
│   │   ├── preload/             # Preload page
│   │   │   └── Preload.tsx      # Preload component
│   │   ├── Preload.tsx          # Preload page (alternative)
│   │   ├── Search.tsx           # Search page
│   │   └── Setting.tsx          # Settings pagenality:
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
│   ├── i18n/                    # Internationalization module
│   │   ├── index.ts             # i18n module exports
│   │   ├── constants.ts         # i18n constants
│   │   └── locales/             # Multi-language translation files
│   │       ├── zh-CN/           # Simplified Chinese
│   │       │   ├── app.json
│   │       │   ├── search.json
│   │       │   └── ...           # Other translation files
│   │       ├── zh-TW/            # Traditional Chinese
│   ├── i18n/                    # Internationalization module
│   │   ├── index.ts             # i18n module exports
│   │   ├── constants.ts         # i18n constants
│   │   └── locales/             # Multi-language translation files
│   │       ├── zh-CN/           # Simplified Chinese
│   │       │   ├── app.json
│   │       │   ├── search.json
│   │       │   └── ...           # Other translation files
│   │       ├── zh-TW/            # Traditional Chinese
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
│   │       └── vi-VN/           # Vietnamese
│   │       ├── en-US/            # English
│   │       ├── ja-JP/            # Japanese
│   │       ├── ko-KR/            # Korean
│   │       ├── fr-FR/            # French
│   │       ├── de-DE/            # German
│   │       └── vi-VN/           # Vietnamese
│   │       ├── en-US/            # English
│   │       ├── ja-JP/            # Japanese
│   │       ├── ko-KR/            # Korean
│   │       ├── fr-FR/            # French
│   │       ├── de-DE/            # German
│   │       └── vi-VN/           # Vietnamese
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
