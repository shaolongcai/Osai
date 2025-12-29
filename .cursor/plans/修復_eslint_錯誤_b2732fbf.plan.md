---
name: 修復 ESLint 錯誤
overview: 修復 lint-errors.md 中第 164-256 行列出的所有 ESLint 錯誤，包括空介面、空模式匹配、case 區塊宣告、空區塊、未使用表達式、React Fast Refresh 問題和 React Hooks 依賴問題。
todos:
  - id: fix-info-card
    content: 修復 InfoCard.tsx 的空介面和空模式匹配問題
    status: pending
  - id: fix-table-result
    content: 修復 TableRelust.tsx 的 case 區塊詞彙宣告問題
    status: pending
  - id: fix-i18n-context
    content: 修復 I18nContext.tsx 的空區塊問題，並分離 hooks 到新檔案
    status: pending
  - id: fix-setting-expressions
    content: 修復 Setting.tsx 的未使用表達式問題
    status: pending
  - id: fix-fast-refresh
    content: 重構 Fast Refresh 問題：分離 FlagIcons 工具函數、重構 searchIndex 和 settingIndex
    status: pending
  - id: fix-hooks-deps
    content: 修復所有 React Hooks 依賴問題
    status: pending
    dependencies:
      - fix-info-card
      - fix-table-result
      - fix-i18n-context
      - fix-setting-expressions
---

# 修復 ESLint 錯誤計劃

## 錯誤分類與修復策略

### 1. 空介面與空模式匹配 (InfoCard.tsx)

- **問題**: 第 17 行空介面 `interface Props {}`，第 20 行空物件解構 `({})`
- **修復**: 移除空介面，直接使用 `React.FC` 或 `React.FC<Record<string, never>>`；移除空解構參數

### 2. Case 區塊中的詞彙宣告 (TableRelust.tsx)

- **問題**: 第 93 行在 case 區塊中直接宣告變數
- **修復**: 使用大括號包裹 case 區塊內容，建立新的作用域

### 3. 空區塊 (I18nContext.tsx)

- **問題**: 第 81 行空的 catch 區塊 `catch { }`
- **修復**: 添加註解說明為何忽略錯誤，或使用 `catch (error) { /* 忽略錯誤 */ }`

### 4. 未使用的表達式 (Setting.tsx)

- **問題**: 第 198 和 366 行有未使用的表達式
- **修復**: 檢查並修正為正確的賦值或函數呼叫

### 5. React Fast Refresh 問題

需要將非元件匯出移到單獨檔案：

- **I18nContext.tsx**: `useI18n` 和 `useTranslation` (第 243, 252 行)
- **FlagIcons.tsx**: `allFlags`, `getFlagByName`, `getFlagByCode`, `default` (第 6161, 6168, 6173, 6177 行)
- **searchIndex.tsx**: 將 `APP` 元件移到單獨檔案
- **settingIndex.tsx**: 將 `APP` 元件移到單獨檔案

### 6. React Hooks 依賴問題

修復以下檔案的 Hooks 依賴警告：

- **TableRelust.tsx**: `useMemo` 缺少 `context.isReadyAI`
- **UpdateNotification.tsx**: `useCallback` 缺少 `onFinish`
- **I18nContext.tsx**: `useEffect` 缺少 `defaultLanguage` 和 `loadTranslation`
- **useIcon.ts**: `useEffect` 缺少 `ext`
- **Preload.tsx**: `useEffect` 和 `useCallback` 缺少多個依賴
- **Setting.tsx**: `useEffect` 缺少 `manualCheckUpdate`，以及不必要的 `open` 依賴
- **Home2.tsx**: `useEffect` 缺少 `context` 和 `searchFiles`
- **preload/Preload.tsx**: `useEffect` 和 `useCallback` 缺少多個依賴

## 實施步驟

1. **修復簡單語法錯誤** (InfoCard, TableRelust, I18nContext, Setting)
2. **重構 Fast Refresh 問題** (創建新檔案分離常數和函數)
3. **修復 Hooks 依賴** (添加缺失依賴或使用適當的 ESLint 註解)

## 檔案清單

需要修改的檔案：

- `frontend/src/components/InfoCard.tsx`
- `frontend/src/components/TableRelust/TableRelust.tsx`
- `frontend/src/contexts/I18nContext.tsx`
- `frontend/src/pages/Setting.tsx`
- `frontend/src/components/UpdateNotification.tsx`
- `frontend/src/hooks/useIcon.ts`
- `frontend/src/pages/Preload.tsx`
- `frontend/src/pages/home/Home2.tsx`
- `frontend/src/pages/preload/Preload.tsx`
- `frontend/src/flags/FlagIcons.tsx`
- `frontend/src/searchIndex.tsx`
- `frontend/src/settingIndex.tsx`

需要創建的新檔案：

- `frontend/src/contexts/useI18n.ts` (分離 I18n hooks)
- `frontend/src/flags/flagUtils.ts` (分離 Flag 工具函數)
- `frontend/src/pages/SearchApp.tsx` (從 searchIndex.tsx 移出)