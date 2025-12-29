import { useContext } from 'react';
import { I18nContext } from './I18nContextDef';
import { I18nContextType } from '../types/i18n';

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

