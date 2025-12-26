/**
 * i18n 國際化模組
 *
 * 此模組集中管理所有國際化相關的導出，包括：
 * - I18nProvider 和 useI18n、useTranslation Hooks
 * - 語言配置和支援的語言列表
 * - 類型定義
 *
 * 使用方式：
 * ```tsx
 * import { I18nProvider, useTranslation, SUPPORTED_LANGUAGES } from '@/i18n';
 *
 * // 在組件中使用
 * const { t, currentLanguage, setLanguage } = useTranslation();
 * ```
 */

// 導出 I18n Context 和 Hooks
export { I18nProvider, useI18n, useTranslation } from '../contexts/I18nContext';

// 導出常量
export {
  MODULE_FILES,
  DEFAULT_LANGUAGE,
  LOCALES_BASE_PATH,
} from './constants';
export type { ModuleFile } from './constants';

// 導出語言配置
export {
  LANGUAGE_CONFIGS,
  SUPPORTED_LANGUAGES,
  getLanguageConfig,
  isLanguageSupported,
} from '../config/languages';

// 導出類型
export type { LanguageConfig, Language } from '../config/languages';
export type {
  TranslationKeys,
  TranslationKeyPath,
  I18nContextType,
  TranslationResources,
} from '../types/i18n';
