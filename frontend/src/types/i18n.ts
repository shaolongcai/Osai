// 翻譯系統類型定義

// 從統一配置文件導入語言類型
import type { Language } from '../config/languages';
export type { Language } from '../config/languages';

// 動態生成語言鍵值的映射類型
type LanguageKeys = Record<Language, string>;

// 翻譯鍵值類型 - 基於AI搜索應用的界面文本結構
export interface TranslationKeys {
  app: {
    title: string;
    search: {
      placeholder: string;
      button: string;
      results: string;
      noResults: string;
      noKeyword: string;
      start: string;
    };
    settings: {
      title: string;
      visualIndex: string;
      gpuService: string;
      userExperience: string;
      language: string;
      logFolder: string;
      open: string;
      community: string;
      feedback: string;
    };
    common: {
      confirm: string;
      cancel: string;
      save: string;
      close: string;
      on: string;
      off: string;
      settings: string;
    };
    language: {
      title: string;
    } & LanguageKeys; // 使用映射類型動態生成語言鍵值
    indexing: {
      indexed: string;
      pending: string;
    };
    visualIndexStatus: {
      paused: string;
      running: string; // 包含剩餘數量 {{count}}
      finished: string;
    };
  };
}

// 翻譯資源類型
export type TranslationResources = Record<Language, TranslationKeys>;

// 動態生成語言路徑的工具類型
type LanguagePaths = `app.language.${Language}`;

// 翻譯鍵路徑類型 - 支援點分隔的巢狀鍵值
export type TranslationKeyPath = 
  | 'app.title'
  | 'app.search.placeholder'
  | 'app.search.button'
  | 'app.search.results'
  | 'app.search.noResults'
  | 'app.search.noKeyword'
  | 'app.search.start'
  | 'app.settings.title'
  | 'app.settings.visualIndex'
  | 'app.settings.gpuService'
  | 'app.settings.userExperience'
  | 'app.settings.language'
  | 'app.settings.logFolder'
  | 'app.settings.open'
  | 'app.settings.community'
  | 'app.settings.feedback'
  | 'app.common.confirm'
  | 'app.common.cancel'
  | 'app.common.save'
  | 'app.common.close'
  | 'app.common.on'
  | 'app.common.off'
  | 'app.common.settings'
  | 'app.language.title'
  | LanguagePaths // 使用工具類型動態生成語言路徑
  // 新增的索引與視覺索引狀態鍵
  | 'app.indexing.indexed'
  | 'app.indexing.pending'
  | 'app.visualIndexStatus.paused'
  | 'app.visualIndexStatus.running'
  | 'app.visualIndexStatus.finished';

// 翻譯上下文類型
export interface I18nContextType {
  currentLanguage: Language;
  translations: Partial<TranslationResources>;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
  isLoading: boolean;
}

// useTranslation 返回值類型
export interface UseTranslationReturn {
  t: (key: TranslationKeyPath, params?: Record<string, string | number>) => string;
  currentLanguage: Language;
  setLanguage: (language: Language) => Promise<void>;
  isLoading: boolean;
}

// 語言配置類型
export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
}