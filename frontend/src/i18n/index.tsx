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

import React, { useState, useEffect, ReactNode, useCallback, useRef, useMemo, useContext, createContext } from 'react';
import { Language, TranslationKeys, TranslationKeyPath, I18nContextType, TranslationResources } from '../types/i18n';
import { SUPPORTED_LANGUAGES } from '../config/languages';

// ==================== 常量定義 ====================

/** 默認語言 */
export const DEFAULT_LANGUAGE = 'zh-CN';

/** 翻譯文件基礎路徑（運行時） */
export const LOCALES_BASE_PATH = './locales';

// ==================== Context 定義 ====================

/**
 * @description 創建翻譯上下文
 */
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// ==================== I18nProvider 組件 ====================

// 翻譯上下文提供者屬性
interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

/**
 * @description 翻譯上下文提供者組件
 */
export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLanguage = DEFAULT_LANGUAGE
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<Partial<TranslationResources>>({});
  const [isLoading, setIsLoading] = useState(false);
  // 使用 ref 追蹤已載入的語言，避免在 useCallback 依賴中
  const loadedLanguagesRef = useRef<Set<Language>>(new Set());
  // 使用 ref 追蹤是否已初始化，避免重複同步
  const isInitializedRef = useRef<boolean>(false);

  /**
   * @description 動態載入翻譯文件
   * @param language 語言代碼
   */
  const loadTranslation = useCallback(async (language: Language): Promise<void> => {
    if (loadedLanguagesRef.current.has(language)) {
      return;
    }

    setIsLoading(true);
    try {
      // 載入單一 JSON 文件
      const response = await fetch(`${LOCALES_BASE_PATH}/${language}.json`);
      if (response.ok) {
        const data: TranslationKeys = await response.json();
        setTranslations(prev => ({
          ...prev,
          [language]: data
        }));
        loadedLanguagesRef.current.add(language);
      } else {
        console.warn(`無法載入 ${language} 翻譯文件`);
      }
    } catch (error) {
      console.error(`載入 ${language} 翻譯文件時出錯:`, error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * @description 獲取翻譯文本 - 支援點分隔的巢狀鍵值和回退機制
   * @param key 翻譯鍵值路徑（如 'app.title' 或 'search.placeholder'）
   * @param language 語言代碼，預設為當前語言
   * @returns 翻譯文本
   */
  const getTranslation = useCallback((key: TranslationKeyPath, language: Language = currentLanguage): string => {
    const keys = key.split('.');
    // 首先嘗試在當前語言中查找
    let value: unknown = translations[language];
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = null;
        break;
      }
    }
    // 如果在當前語言中找到了翻譯，返回它
    if (typeof value === 'string') {
      return value;
    }
    // 如果沒找到，嘗試回退到中文簡體
    if (language !== 'zh-CN' && translations['zh-CN']) {
      value = translations['zh-CN'];
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = null;
          break;
        }
      }
      if (typeof value === 'string') {
        return value;
      }
    }
    // 如果連中文簡體都沒有，返回原始key
    return key;
  }, [currentLanguage, translations]);

  /**
   * @description 設置語言
   * @param language 語言代碼
   */
  const setLanguage = useCallback(async (language: Language): Promise<void> => {
    // 確保翻譯文件已載入
    await loadTranslation(language);

    setCurrentLanguage(language);

    // 更新 HTML 元素的 lang 屬性
    document.documentElement.lang = language;

    // 保存語言偏好到本地存儲
    localStorage.setItem('app-language', language);

    // 如果在 Electron 環境中，也保存到數據庫並通知後端更新托盤菜單
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.setConfig({
          key: 'app_language',
          value: language,
          type: 'string'
        });
        // 通知後端更新托盤菜單語言
        window.electronAPI.updateTrayLanguage(language);
      } catch (error) {
        console.error('保存語言設置到數據庫失敗:', error);
      }
    }

    console.log(`語言已切換到: ${language}`);
  }, [loadTranslation]);

  /**
   * @description 翻譯函數，支持參數替換
   * @param key 翻譯鍵值路徑
   * @param params 參數物件，用於替換翻譯文本中的佔位符（如 {{count}}）
   * @returns 翻譯後的文本
   */
  const t = useCallback((key: TranslationKeyPath, params?: Record<string, string | number | boolean>): string => {
    let translation = getTranslation(key, currentLanguage);
    // 如果有參數，替換佔位符
    if (params) {
      Object.keys(params).forEach(param => {
        const placeholder = `{{${param}}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), String(params[param]));
      });
    }

    return translation;
  }, [currentLanguage, getTranslation]);

  // 初始化翻譯系統
  useEffect(() => {
    const initTranslations = async () => {
      // 從本地存儲獲取保存的語言偏好
      const savedLanguage = localStorage.getItem('app-language') as Language;
      const initialLanguage = savedLanguage || defaultLanguage;

      // 設置初始語言
      setCurrentLanguage(initialLanguage);

      // 預載入所有支援的語言
      await Promise.all(SUPPORTED_LANGUAGES.map(lang => loadTranslation(lang)));

      // 同步語言設置到數據庫（確保托盤菜單顯示正確的語言）
      // 注意：必須在前端完全初始化前就同步，確保托盤菜單使用正確的語言
      // 只在首次初始化時同步，避免重複觸發
      if (typeof window !== 'undefined' && window.electronAPI && !isInitializedRef.current) {
        isInitializedRef.current = true;
        try {
          await window.electronAPI.setConfig({
            key: 'app_language',
            value: initialLanguage,
            type: 'string'
          });
          // 更新托盤菜單語言
          window.electronAPI.updateTrayLanguage(initialLanguage);
          console.log(`已將語言設置同步到數據庫: ${initialLanguage}`);
        } catch (error) {
          console.error('初始化語言設置到數據庫失敗:', error);
        }
      }

      // 更新 HTML 元素的 lang 屬性
      document.documentElement.lang = initialLanguage;
    };

    initTranslations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultLanguage]); // loadTranslation 使用 useCallback，不應作為依賴

  const contextValue: I18nContextType = useMemo(() => ({
    currentLanguage,
    translations,
    setLanguage,
    t,
    isLoading
  }), [currentLanguage, translations, setLanguage, t, isLoading]);

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// ==================== Hooks ====================

/**
 * @description 自定義 Hook 用於使用翻譯上下文
 * @returns I18n 上下文
 */
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

/**
 * @description 翻譯 Hook - 類似於原始項目的 useTranslation
 * @returns 翻譯函數和語言設定
 */
export const useTranslation = () => {
  const { t, currentLanguage, setLanguage, isLoading } = useI18n();

  return {
    t,
    currentLanguage,
    setLanguage,
    isLoading
  };
};

// ==================== 導出語言配置 ====================

export {
  LANGUAGE_CONFIGS,
  SUPPORTED_LANGUAGES,
  getLanguageConfig,
  isLanguageSupported,
} from '../config/languages';

// ==================== 導出類型 ====================

export type { LanguageConfig, Language } from '../config/languages';
export type {
  TranslationKeys,
  TranslationKeyPath,
  I18nContextType,
  TranslationResources,
} from '../types/i18n';

