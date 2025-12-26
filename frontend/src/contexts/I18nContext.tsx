import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationKeys, TranslationKeyPath, I18nContextType, TranslationResources } from '../types/i18n';
import { SUPPORTED_LANGUAGES } from '../config/languages';
import { MODULE_FILES, DEFAULT_LANGUAGE, LOCALES_BASE_PATH } from '../i18n/constants';

// 創建翻譯上下文
const I18nContext = createContext<I18nContextType | undefined>(undefined);

// 翻譯上下文提供者屬性
interface I18nProviderProps {
  children: ReactNode;
  defaultLanguage?: Language;
}

// 翻譯上下文提供者組件
export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  defaultLanguage = DEFAULT_LANGUAGE
}) => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<Partial<TranslationResources>>({});
  const [loadedLanguages, setLoadedLanguages] = useState<Set<Language>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // 動態載入翻譯文件
  const loadTranslation = async (language: Language): Promise<void> => {
    if (loadedLanguages.has(language)) {
      return;
    }

    setIsLoading(true);
    try {
      // 優先嘗試新的語言/模塊目錄結構
      const base = `${LOCALES_BASE_PATH}/${language}`;
      const moduleResponses = await Promise.all(
        MODULE_FILES.map(async (m) => {
          try {
            const r = await fetch(`${base}/${m}.json`);
            if (r.ok) {
              return await r.json();
            }
            return null;
          } catch {
            return null;
          }
        })
      );

      const hasAnyModule = moduleResponses.some((r) => r !== null);

      if (hasAnyModule) {
        // 組裝為 TranslationKeys 結構
        const combined: any = { app: {} };
        MODULE_FILES.forEach((m, idx) => {
          const content = moduleResponses[idx];
          if (!content) return;
          if (m === 'app') {
            combined.app = { ...combined.app, ...content };
          } else {
            combined.app[m] = content;
          }
        });
        // 若有缺失模塊，嘗試載入舊的單檔 JSON 並做補全
        try {
          const legacyResp = await fetch(`${LOCALES_BASE_PATH}/${language}.json`);
          if (legacyResp.ok) {
            const legacy: any = await legacyResp.json();
            const deepMerge = (target: any, source: any) => {
              Object.keys(source).forEach((key) => {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                  if (!target[key]) target[key] = {};
                  deepMerge(target[key], source[key]);
                } else {
                  if (target[key] === undefined) target[key] = source[key];
                }
              });
              return target;
            };
            deepMerge(combined, legacy);
          }
        } catch { }

        setTranslations(prev => ({
          ...prev,
          [language]: combined as TranslationKeys,
        }));
        setLoadedLanguages(prev => new Set([...prev, language]));
      } else {
        // 兼容舊結構：單檔 JSON
        const response = await fetch(`${LOCALES_BASE_PATH}/${language}.json`);
        if (response.ok) {
          const data: TranslationKeys = await response.json();
          setTranslations(prev => ({
            ...prev,
            [language]: data
          }));
          setLoadedLanguages(prev => new Set([...prev, language]));
        } else {
          console.warn(`無法載入 ${language} 翻譯文件`);
        }
      }
    } catch (error) {
      console.error(`載入 ${language} 翻譯文件時出錯:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 獲取翻譯文本 - 支援點分隔的巢狀鍵值和回退機制
  const getTranslation = (key: TranslationKeyPath, language: Language = currentLanguage): string => {
    const keys = key.split('.');
    // 首先嘗試在當前語言中查找
    let value: any = translations[language];
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
  };

  // 設置語言
  const setLanguage = async (language: Language): Promise<void> => {
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
  };

  // t 函數 - 翻譯函數，支持參數替換
  const t = (key: TranslationKeyPath, params?: Record<string, any>): string => {
    let translation = getTranslation(key, currentLanguage);
    // 如果有參數，替換佔位符
    if (params) {
      Object.keys(params).forEach(param => {
        const placeholder = `{{${param}}}`;
        translation = translation.replace(new RegExp(placeholder, 'g'), String(params[param]));
      });
    }

    return translation;
  };

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
      if (typeof window !== 'undefined' && window.electronAPI) {
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
  }, []);

  const contextValue: I18nContextType = {
    currentLanguage,
    translations,
    setLanguage,
    t,
    isLoading
  };

  return (
    <I18nContext.Provider value={contextValue}>
      {children}
    </I18nContext.Provider>
  );
};

// 自定義 Hook 用於使用翻譯上下文
export const useI18n = (): I18nContextType => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// 翻譯 Hook - 類似於原始項目的 useTranslation
export const useTranslation = () => {
  const { t, currentLanguage, setLanguage, isLoading } = useI18n();

  return {
    t,
    currentLanguage,
    setLanguage,
    isLoading
  };
};