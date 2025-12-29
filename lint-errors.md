# ESLint 錯誤報告

生成時間：2025-12-29

## 總覽

- **總錯誤數**：109（已修復：39）
- **總警告數**：13
- **可自動修復**：1 個錯誤（已修復）
- **any 類型錯誤**：38 個（已全部修復 ✅）

---

## 錯誤分類

### 1. 未使用的變數 (@typescript-eslint/no-unused-vars)

#### RootProviders.tsx
- 第 12 行：`setLang` 被賦值但從未使用

#### components/AIprovider.tsx
- 第 2 行：`Paper` 已定義但從未使用

#### components/Cate.tsx
- 第 1 行：`theme` 已定義但從未使用

#### components/Contact.tsx
- 第 2 行：`Link` 已定義但從未使用
- 第 2 行：`Typography` 已定義但從未使用
- 第 12 行：`title` 已定義但從未使用
- 第 15 行：`t` 被賦值但從未使用

#### components/InfoCard.tsx
- 第 1 行：`Fade` 已定義但從未使用
- 第 27 行：`context` 被賦值但從未使用

#### components/ReportProtocol.tsx
- 第 1 行：`Checkbox` 已定義但從未使用
- 第 1 行：`FormControlLabel` 已定義但從未使用
- 第 1 行：`Paper` 已定義但從未使用
- 第 18 行：`setIsRemind` 被賦值但從未使用
- 第 35 行：`handleClose` 被賦值但從未使用

#### components/SearchPanel.tsx
- 第 27 行：`isAiMark` 被賦值但從未使用

#### components/Setting/Setting.tsx
- 第 1 行：`IconButton` 已定義但從未使用
- 第 3 行：`Contact` 已定義但從未使用
- 第 28 行：`selectedCategory` 被賦值但從未使用
- 第 28 行：`setSelectedCategory` 被賦值但從未使用
- 第 37 行：`isUpdateAvailable` 被賦值但從未使用
- 第 39 行：`latestVersion` 被賦值但從未使用
- 第 43 行：`updateStatus` 被賦值但從未使用

#### components/TableRelust/TableRelust.tsx
- 第 1 行：`Chip` 已定義但從未使用
- 第 1 行：`Tooltip` 已定義但從未使用
- 第 2 行：`useEffect` 已定義但從未使用

#### pages/Preload.tsx
- 第 3 行：`ReportProtocol` 已定義但從未使用
- 第 5 行：`Paper` 已定義但從未使用
- 第 16 行：`protocolOpen` 被賦值但從未使用
- 第 21 行：`upgradeOpen` 被賦值但從未使用
- 第 30 行：`context` 被賦值但從未使用
- 第 90 行：`checkAgreeProtocol` 被賦值但從未使用
- 第 156 行：`waitUserUpgrade` 被賦值但從未使用
- 第 163 行：`waitUserCheckProtocol` 被賦值但從未使用
- 第 172 行：`waitUserLogin` 被賦值但從未使用

#### pages/Search.tsx
- 第 1 行：`useRef` 已定義但從未使用
- 第 4 行：`Paper` 已定義但從未使用
- 第 5 行：`useSize` 已定義但從未使用
- 第 28 行：`total` 被賦值但從未使用
- 第 30 行：`currentLanguage` 被賦值但從未使用
- 第 33 行：`isShowUpgradeProTips` 被賦值但從未使用

#### pages/Setting.tsx
- 第 15 行：`theme` 已定義但從未使用
- 第 29 行：`SettingButton` 被賦值但從未使用
- 第 64 行：`openIndexImage` 被賦值但從未使用
- 第 65 行：`confirmDialogOpen` 被賦值但從未使用
- 第 65 行：`setConfirmDialogOpen` 被賦值但從未使用
- 第 69 行：`isInstallGpu` 被賦值但從未使用
- 第 74 行：`isUpdateAvailable` 被賦值但從未使用
- 第 76 行：`latestVersion` 被賦值但從未使用
- 第 81 行：`context` 被賦值但從未使用
- 第 182 行：`toggleAutoLaunchHidden` 被賦值但從未使用

#### pages/home/Home2.tsx
- 第 37 行：`isElectron` 被賦值但從未使用
- 第 64 行：`data` 已定義但從未使用

#### pages/preload/Preload.tsx
- 第 6 行：`ReportProtocol` 已定義但從未使用
- 第 17 行：`protocolOpen` 被賦值但從未使用

---

### 2. 使用 any 類型 (@typescript-eslint/no-explicit-any) ✅ 已全部修復

#### components/LanguageSwitcher/LanguageSwitcher.tsx ✅
- ✅ 第 87 行：已修復 - 使用 `TranslationKeyPath` 類型
- ✅ 第 134 行：已修復 - 明確返回類型 `'primary' | 'inherit'`

#### components/Setting/Setting.tsx ✅
- ✅ 第 78 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`
- ✅ 第 83 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 87 行：已修復 - 使用 `UpdateStatus` 類型
- ✅ 第 92 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 96 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 106 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`
- ✅ 第 109 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 113 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 344 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 347 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 359 行：已修復 - 移除 `as any` 類型斷言

#### contexts/I18nContext.tsx ✅
- ✅ 第 53 行：已修復 - 使用 `Partial<TranslationKeys>` 類型
- ✅ 第 67 行：已修復 - 使用 `Partial<TranslationKeys>` 類型
- ✅ 第 68 行：已修復 - 使用 `Record<string, unknown>` 類型（2 處）
- ✅ 第 113 行：已修復 - 使用 `unknown` 類型
- ✅ 第 177 行：已修復 - 使用 `Record<string, string | number | boolean>` 類型

#### pages/Preload.tsx ✅
- ✅ 第 12 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`
- ✅ 第 255 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`

#### pages/Setting.tsx ✅
- ✅ 第 108 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`
- ✅ 第 113 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 123 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 147 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 316 行：已修復 - 移除 `as any` 類型斷言
- ✅ 第 323 行：已修復 - 移除 `as any` 類型斷言

#### pages/home/Home2.tsx ✅
- ✅ 第 110 行：已修復 - 使用 `string | number | Date` 類型
- ✅ 第 111 行：已修復 - 使用 `string | number | Date` 類型

#### pages/preload/Preload.tsx ✅
- ✅ 第 30 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`
- ✅ 第 34 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`
- ✅ 第 166 行：已修復 - 移除 `(window as any)`，直接使用 `window.electronAPI`

#### types/electron.d.ts ✅
- ✅ 第 8 行：已修復 - 將 `BaseResponse<T = any>` 改為 `BaseResponse<T = unknown>`
- ✅ 第 50 行：已修復 - 將 `value: any` 改為 `value: string | number | boolean`
- ✅ 第 121 行：已修復 - 定義 `UpdateStatus` 介面並使用

#### types/i18n.d.ts ✅
- ✅ 第 262 行：已修復 - 將 `Record<string, any>` 改為 `Record<string, string | number | boolean>`
- ✅ 第 268 行：已修復 - 將 `Record<string, any>` 改為 `Record<string, string | number | boolean>`

#### types/i18n.ts ✅
- ✅ 第 102 行：已修復 - 將 `Record<string, any>` 改為 `Record<string, string | number | boolean>`
- ✅ 第 108 行：已修復 - 將 `Record<string, any>` 改為 `Record<string, string | number | boolean>`

---

### 3. 空介面 (@typescript-eslint/no-empty-object-type)

#### components/InfoCard.tsx
- 第 17 行：空的介面宣告允許任何非 nullish 值

---

### 4. 空模式匹配 (no-empty-pattern)

#### components/InfoCard.tsx
- 第 20 行：意外的空物件模式

---

### 5. Case 區塊中的詞彙宣告 (no-case-declarations)

#### components/TableRelust/TableRelust.tsx
- 第 93 行：在 case 區塊中意外的詞彙宣告

---

### 6. 冗餘的 Boolean 呼叫 (no-extra-boolean-cast)

#### components/SearchPanel.tsx
- ✅ 第 222 行：冗餘的 Boolean 呼叫（已修復 - 自動修復）

---

### 7. 空區塊 (no-empty)

#### contexts/I18nContext.tsx
- 第 81 行：空區塊語句

---

### 8. 未使用的表達式 (@typescript-eslint/no-unused-expressions)

#### pages/Setting.tsx
- 第 198 行：預期賦值或函數呼叫，但看到表達式
- 第 366 行：預期賦值或函數呼叫，但看到表達式

---

### 9. React Fast Refresh 問題 (react-refresh/only-export-components)

#### contexts/I18nContext.tsx
- 第 243 行：Fast refresh 僅在檔案只匯出元件時有效，請使用新檔案來共享常數或函數
- 第 252 行：Fast refresh 僅在檔案只匯出元件時有效，請使用新檔案來共享常數或函數

#### flags/FlagIcons.tsx
- 第 6161 行：Fast refresh 僅在檔案只匯出元件時有效，請使用新檔案來共享常數或函數
- 第 6168 行：Fast refresh 僅在檔案只匯出元件時有效，請使用新檔案來共享常數或函數
- 第 6173 行：Fast refresh 僅在檔案只匯出元件時有效，請使用新檔案來共享常數或函數
- 第 6177 行：Fast refresh 僅在檔案只匯出元件時有效，請使用新檔案來共享常數或函數

#### searchIndex.tsx
- 第 10 行：Fast refresh 僅在檔案有匯出時有效，請將元件移到單獨的檔案

#### settingIndex.tsx
- 第 9 行：Fast refresh 僅在檔案有匯出時有效，請將元件移到單獨的檔案

---

### 10. React Hooks 依賴問題 (react-hooks/exhaustive-deps)

#### components/TableRelust/TableRelust.tsx
- 第 336 行（警告）：`useMemo` 缺少依賴項：`context.isReadyAI`

#### components/UpdateNotification.tsx
- 第 25 行（警告）：`useCallback` 缺少依賴項：`onFinish`

#### contexts/I18nContext.tsx
- 第 225 行（警告）：`useEffect` 缺少依賴項：`defaultLanguage` 和 `loadTranslation`

#### hooks/useIcon.ts
- 第 51 行（警告）：`useEffect` 缺少依賴項：`ext`

#### pages/Preload.tsx
- 第 67 行（警告）：`useEffect` 缺少依賴項：`checkGuide`, `checkUpdate`, `initServer`, `waitUserCheckUpdate`, `waitUserGuide`
- 第 143 行（警告）：`useCallback` 缺少依賴項：`navigate`

#### pages/Setting.tsx
- 第 103 行（警告）：`useEffect` 缺少依賴項：`manualCheckUpdate`
- 第 142 行（警告）：`useEffect` 有不必要的依賴項：`open`

#### pages/home/Home2.tsx
- 第 79 行（警告）：`useEffect` 缺少依賴項：`context`
- 第 103 行（警告）：`useEffect` 缺少依賴項：`searchFiles`

#### pages/preload/Preload.tsx
- 第 63 行（警告）：`useEffect` 缺少依賴項：`showAgreeProtocol`
- 第 73 行（警告）：`useEffect` 缺少依賴項：`initServer`
- 第 95 行（警告）：`useCallback` 缺少依賴項：`context`

---

## 建議修復方案

### 優先級 1：必須修復（錯誤）

1. **移除未使用的變數和匯入**
   - 清理所有未使用的變數、函數和匯入
   - 可以考慮使用 IDE 的自動清理功能

2. **替換 all `any` 類型**
   - 根據專案規範，不允許使用 `any` 類型
   - 需要為每個 `any` 定義適當的類型
   - 特別是 `types/electron.d.ts` 和 `types/i18n.d.ts` 中的類型定義

3. **修復空介面和空模式**
   - `InfoCard.tsx` 中的空介面應定義為具體類型或使用 `object` 類型
   - 移除或修復空的物件解構模式

4. **修復 Case 區塊中的宣告**
   - 在 `TableRelust.tsx` 的 case 區塊中使用大括號包裹宣告

5. **修復 React Fast Refresh 問題**
   - 將非元件匯出移到單獨的檔案
   - 確保匯出檔案只包含元件

6. **修復空區塊和未使用的表達式**
   - 移除或實現空區塊
   - 修復未使用的表達式

### 優先級 2：建議修復（警告）

1. **補充 React Hooks 依賴項**
   - 仔細檢查每個 Hook 的依賴陣列
   - 如果某些依賴不應該觸發重新執行，使用 `useCallback` 或 `useMemo` 包裝

2. **移除冗餘的 Boolean 轉換**
   - 移除不必要的 `Boolean()` 呼叫

---

## 統計摘要

### 按錯誤類型統計

| 錯誤類型 | 數量 | 狀態 |
|---------|------|------|
| 未使用的變數 | 48 | 待修復 |
| 使用 any 類型 | 38 | ✅ 已全部修復 |
| React Fast Refresh | 7 | 待修復 |
| React Hooks 依賴 | 13 (警告) | 待修復 |
| 空介面/模式 | 2 | 待修復 |
| Case 區塊宣告 | 1 | 待修復 |
| 冗餘 Boolean 呼叫 | 1 | ✅ 已修復 |
| 其他 | 3 | 待修復 |

### 按檔案統計

| 檔案 | 錯誤數 | 警告數 |
|------|-------|--------|
| pages/Setting.tsx | 19 | 2 |
| components/Setting/Setting.tsx | 16 | 0 |
| pages/Preload.tsx | 9 | 2 |
| contexts/I18nContext.tsx | 8 | 1 |
| types/electron.d.ts | 3 | 0 |
| pages/home/Home2.tsx | 5 | 2 |
| pages/preload/Preload.tsx | 5 | 3 |
| components/TableRelust/TableRelust.tsx | 4 | 1 |
| pages/Search.tsx | 6 | 0 |
| flags/FlagIcons.tsx | 4 | 0 |
| components/LanguageSwitcher/LanguageSwitcher.tsx | 2 | 0 |
| components/SearchPanel.tsx | 1 | 0（已修復 1 個錯誤） |
| components/InfoCard.tsx | 3 | 0 |
| components/ReportProtocol.tsx | 5 | 0 |
| components/Contact.tsx | 4 | 0 |
| 其他檔案 | 各 1-3 個錯誤 | 0-1 個警告 |

---

## 修復指令

執行以下指令可以嘗試自動修復部分問題：

```bash
cd frontend
npm run lint -- --fix
```

注意：大部分錯誤需要手動修復，特別是類型定義相關的問題。

