/**
 * 統一的語言配置管理
 * 
 * 此文件集中管理所有語言相關的配置，包括：
 * - 語言代碼定義
 * - 國旗圖標配置
 * - 顯示名稱配置
 * - 支援的語言列表
 * 
 * 添加新語言時，只需要：
 * 1. 在此文件中添加新的語言配置
 * 2. 添加對應的 JSON 翻譯文件
 * 3. 添加對應的國旗 SVG 文件
 */

// 語言配置接口定義
export interface LanguageConfig {
  /** 語言代碼 (ISO 639-1 + ISO 3166-1) */
  code: string;
  /** 國旗圖標文件名 (不含副檔名) */
  flagName: string;
  /** 國旗圖標的 alt 文字 */
  altText: string;
  /** 語言的顯示名稱 (用於 UI 顯示) */
  displayName: string;
}

// 簡化的語言數據：[語言代碼, 國旗名稱, 顯示名稱]
const LANGUAGE_DATA = [
  ['zh-CN', 'cn', '简体中文'],    // China
  ['en-US', 'us', 'English'],     // United States
  ['zh-TW', 'tw', '繁體中文'],    // Taiwan
  ['fr-FR', 'fr', 'Français'],    // France
  ['de-DE', 'de', 'Deutsch'],     // Germany
  ['ja-JP', 'jp', '日本語'],       // Japan
  ['ko-KR', 'kr', '한국어'],       // Korea
  ['vi-VN', 'vn', 'Tiếng Việt'],  // Vietnam
] as const;

// 動態生成完整的語言配置
export const LANGUAGE_CONFIGS: LanguageConfig[] = LANGUAGE_DATA.map(([code, flagName, displayName]) => ({
  code,
  flagName,
  altText: `${displayName} flag`,
  displayName,
}));

// 從配置中提取語言代碼類型
export type Language = typeof LANGUAGE_CONFIGS[number]['code'];

// 支援的語言代碼列表
export const SUPPORTED_LANGUAGES: Language[] = LANGUAGE_CONFIGS.map(config => config.code as Language);

// 根據語言代碼獲取配置的輔助函數
export const getLanguageConfig = (code: Language): LanguageConfig | undefined => {
  return LANGUAGE_CONFIGS.find(config => config.code === code);
};

// 檢查語言代碼是否被支援的輔助函數
export const isLanguageSupported = (code: string): code is Language => {
  return SUPPORTED_LANGUAGES.includes(code as Language);
};