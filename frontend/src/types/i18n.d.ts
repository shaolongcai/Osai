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
      install?: string;
      reInstall?: string;
      checkUpdate?: string;
      check?: string;
      checking?: string;
      checkUpdateStatusLatest?: string;
      checkUpdateStatusNewVersion?: string;
      'not-available-update'?: string;
      generalSettings?: string;
      aiSettings?: string;
      update?: string;
      about?: string;
      website?: string;
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
    // 新增模塊：AI Mark 主介面
    aiMark: {
      title: string;
      requireTitle: string;
      successTitle: string;
      step1: {
        entry: string;
        desc: string;
        understand: string;
        summaryImage: string;
        ask: string;
      };
      step2: {
        model: string;
        cuda: string;
        tips: string;
      };
      step3: {
        done: string;
      };
      buttons: {
        next: string;
        install: string;
        finish: string;
        later: string;
      };
    };
    // 新增模塊：AI Mark 狀態
    aiMarkStatus: {
      completed: string;
      analyzing: string;
      recording: string;
      processing?: string;
      failed?: string;
      queued?: string;
      notStarted?: string;
    };
    // 新增模塊：預載入/更新對話
    preload: {
      loading: string;
      updateTitle: string;
      updateContent: string;
      updatePrimary: string;
      updateSecondary: string;
      initFailed: string;
      openLog: string;
    };
    // 新增模塊：使用者體驗改進協議
    reportProtocol: {
      title: string;
      primaryButtonText: string;
      secondaryButtonText: string;
      content: string;
      notRemindLabel: string;
    };
    // 新增模塊：版本更新提示
    updateTips: {
      title: string;
      primaryButtonText: string;
      content: string;
    };
    // 新增模塊：聯絡我們
    contact: {
      title: string;
      joinDiscord: string;
      addWechat: string;
    };
    // 新增模塊：列表表格
    table: {
      columns: {
        name: string;
        path: string;
        modifiedAt: string;
        fileType: string;
      };
      menu: {
        openFile: string;
        openFolder: string;
        aiMark: string;
      };
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
  | 'app.settings.install'
  | 'app.settings.reInstall'
      | 'app.settings.checkUpdate'
      | 'app.settings.check'
      | 'app.settings.checking'
      | 'app.settings.checkUpdateStatusLatest'
      | 'app.settings.checkUpdateStatusNewVersion'
      | 'app.settings.not-available-update'
  | 'app.settings.generalSettings'
  | 'app.settings.aiSettings'
  | 'app.settings.update'
  | 'app.settings.about'
  | 'app.settings.website'
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
  | 'app.visualIndexStatus.finished'
  // 新增模塊：AI Mark 主介面
  | 'app.aiMark.title'
  | 'app.aiMark.requireTitle'
  | 'app.aiMark.successTitle'
  | 'app.aiMark.step1.entry'
  | 'app.aiMark.step1.desc'
  | 'app.aiMark.step1.understand'
  | 'app.aiMark.step1.summaryImage'
  | 'app.aiMark.step1.ask'
  | 'app.aiMark.step2.model'
  | 'app.aiMark.step2.cuda'
  | 'app.aiMark.step2.tips'
  | 'app.aiMark.step3.done'
  | 'app.aiMark.buttons.next'
  | 'app.aiMark.buttons.install'
  | 'app.aiMark.buttons.finish'
  | 'app.aiMark.buttons.later'
  // 新增模塊：AI Mark 狀態
  | 'app.aiMarkStatus.completed'
  | 'app.aiMarkStatus.analyzing'
  | 'app.aiMarkStatus.recording'
  | 'app.aiMarkStatus.processing'
  | 'app.aiMarkStatus.failed'
  | 'app.aiMarkStatus.queued'
  | 'app.aiMarkStatus.notStarted'
  // 新增模塊：預載入/更新對話
  | 'app.preload.loading'
  | 'app.preload.updateTitle'
  | 'app.preload.updateContent'
  | 'app.preload.updatePrimary'
  | 'app.preload.updateSecondary'
  | 'app.preload.initFailed'
  | 'app.preload.openLog'
  // 新增模塊：使用者體驗改進協議
  | 'app.reportProtocol.title'
  | 'app.reportProtocol.primaryButtonText'
  | 'app.reportProtocol.secondaryButtonText'
  | 'app.reportProtocol.content'
  | 'app.reportProtocol.notRemindLabel'
  // 新增模塊：版本更新提示
  | 'app.updateTips.title'
  | 'app.updateTips.primaryButtonText'
  | 'app.updateTips.content'
  // 新增模塊：聯絡我們
  | 'app.contact.title'
  | 'app.contact.joinDiscord'
  | 'app.contact.addWechat'
  // 新增模塊：列表表格
  | 'app.table.columns.name'
  | 'app.table.columns.path'
  | 'app.table.columns.modifiedAt'
  | 'app.table.columns.fileType'
  | 'app.table.menu.openFile'
  | 'app.table.menu.openFolder'
  | 'app.table.menu.aiMark';

// 翻譯上下文類型
export interface I18nContextType {
  currentLanguage: Language;
  translations: Partial<TranslationResources>;
  setLanguage: (language: Language) => Promise<void>;
  t: (key: string, params?: Record<string, string | number | boolean>) => string;
  isLoading: boolean;
}

// useTranslation 返回值類型
export interface UseTranslationReturn {
  t: (key: TranslationKeyPath, params?: Record<string, string | number | boolean>) => string;
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