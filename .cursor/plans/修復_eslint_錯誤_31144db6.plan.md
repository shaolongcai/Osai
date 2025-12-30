---
name: 修復 ESLint 錯誤
overview: 修復 lint-errors.md 中列出的 47 個 ESLint 錯誤，包括移除未使用的導入/變數（41個）和處理 react-refresh 警告（6個）。
todos:
  - id: fix-cate
    content: 修復 src/components/Cate.tsx - 移除未使用的 theme 導入
    status: completed
  - id: fix-report-protocol
    content: 修復 src/components/ReportProtocol.tsx - 移除未使用的導入和變數
    status: completed
  - id: fix-search-panel
    content: 修復 src/components/SearchPanel.tsx - 處理未使用的 isAiMark 參數
    status: completed
  - id: fix-setting-component
    content: 修復 src/components/Setting/Setting.tsx - 移除未使用的導入和狀態變數
    status: completed
  - id: fix-table-result
    content: 修復 src/components/TableRelust/TableRelust.tsx - 移除未使用的導入
    status: completed
  - id: fix-flag-icons
    content: 修復 src/flags/FlagIcons.tsx - 移除未使用的 flagsData 變數
    status: completed
  - id: fix-i18n
    content: 修復 src/i18n/index.tsx - 添加 ESLint 忽略註解處理 react-refresh 警告
    status: completed
  - id: fix-preload-page
    content: 修復 src/pages/Preload.tsx - 移除未使用的導入和變數
    status: completed
  - id: fix-setting-page
    content: 修復 src/pages/Setting.tsx - 移除未使用的導入和變數
    status: completed
  - id: fix-home2
    content: 修復 src/pages/home/Home2.tsx - 移除未使用的變數和參數
    status: completed
  - id: fix-preload-sub
    content: 修復 src/pages/preload/Preload.tsx - 移除未使用的導入和變數
    status: completed
  - id: verify-lint
    content: 執行 npm run lint 驗證所有錯誤已修復
    status: completed
    dependencies:
      - fix-cate
      - fix-report-protocol
      - fix-search-panel
      - fix-setting-component
      - fix-table-result
      - fix-flag-icons
      - fix-i18n
      - fix-preload-page
      - fix-setting-page
      - fix-home2
      - fix-preload-sub
---

# 修復 ESLint 錯誤計劃

## 錯誤類型分析

### 1. @typescript-eslint/no-unused-vars (41個錯誤)

需要移除未使用的導入、變數和函數參數。

### 2. react-refresh/only-export-components (6個錯誤)

`src/i18n/index.tsx` 中導出了非元件內容，需要處理。

## 修復策略

### 策略 1: 移除未使用的導入和變數

直接移除未使用的導入和變數宣告。

### 策略 2: 處理 react-refresh 警告

對於 `src/i18n/index.tsx`，由於這是 i18n 模組的核心檔案，建議在檔案頂部添加 ESLint 忽略註解，而不是拆分檔案（避免破壞現有的導入結構）。

## 具體修復清單

### 檔案修復順序

1. **`src/components/Cate.tsx`**

- 移除未使用的 `theme` 導入

2. **`src/components/ReportProtocol.tsx`**

- 移除未使用的 `Checkbox`, `FormControlLabel`, `Paper` 導入
- 移除未使用的 `setIsRemind` 變數
- 移除未使用的 `handleClose` 函數

3. **`src/components/SearchPanel.tsx`**

- 移除未使用的 `isAiMark` 參數（或使用下劃線前綴標記為有意未使用）

4. **`src/components/Setting/Setting.tsx`**

- 移除未使用的 `IconButton`, `Contact` 導入
- 移除未使用的狀態變數：`selectedCategory`, `setSelectedCategory`, `isUpdateAvailable`, `latestVersion`, `updateStatus`

5. **`src/components/TableRelust/TableRelust.tsx`**

- 移除未使用的 `Chip`, `Tooltip` 導入
- 移除未使用的 `useEffect` 導入

6. **`src/flags/FlagIcons.tsx`**

- 移除未使用的 `flagsData` 變數（第 5920 行）

7. **`src/i18n/index.tsx`**

- 在檔案頂部添加 ESLint 忽略註解：`/* eslint-disable react-refresh/only-export-components */`

8. **`src/pages/Preload.tsx`**

- 移除未使用的 `ReportProtocol`, `Paper` 導入
- 移除未使用的變數：`protocolOpen`, `upgradeOpen`, `context`, `checkAgreeProtocol`, `waitUserUpgrade`, `waitUserCheckProtocol`, `waitUserLogin`

9. **`src/pages/Setting.tsx`**

- 移除未使用的 `theme` 參數（在 styled 函數中）
- 移除未使用的 `SettingButton` 變數
- 移除未使用的狀態變數：`openIndexImage`, `confirmDialogOpen`, `setConfirmDialogOpen`, `isInstallGpu`, `isUpdateAvailable`, `latestVersion`, `context`, `toggleAutoLaunchHidden`

10. **`src/pages/home/Home2.tsx`**

    - 移除未使用的 `isElectron` 變數
    - 移除未使用的 `data` 參數（在 searchFiles 的 useCallback 中）

11. **`src/pages/preload/Preload.tsx`**

    - 移除未使用的 `ReportProtocol` 導入
    - 移除未使用的 `protocolOpen` 變數