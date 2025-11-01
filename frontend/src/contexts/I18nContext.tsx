import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Language, TranslationKeys, TranslationKeyPath, I18nContextType, TranslationResources } from '../types/i18n';
import { SUPPORTED_LANGUAGES } from '../config/languages';

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
  defaultLanguage = 'zh-CN' 
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
      const response = await fetch(`./locales/${language}.json`);
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
      
      // 設置初始語言（如果與默認不同）
      if (initialLanguage !== defaultLanguage) {
        await setLanguage(initialLanguage);
      }
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