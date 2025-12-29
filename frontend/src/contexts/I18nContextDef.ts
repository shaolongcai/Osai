import { createContext } from 'react';
import { I18nContextType } from '../types/i18n';

/**
 * @description 創建翻譯上下文
 */
export const I18nContext = createContext<I18nContextType | undefined>(undefined);

