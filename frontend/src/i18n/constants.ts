/**
 * i18n 常量定義
 *
 * 此文件包含 i18n 模組使用的常量，避免循環依賴
 */

/**
 * 翻譯文件模塊列表
 * 對應 locales/{語言}/ 目錄下的 JSON 文件
 */
export const MODULE_FILES = [
  'app',
  'search',
  'settings',
  'common',
  'language',
  'indexing',
  'visualIndexStatus',
  'aiMarkStatus',
  'preload',
  'reportProtocol',
  'updateTips',
  'aiMark',
  'contact',
  'table',
  'tray',
  'aiSever',
] as const;

/** 模塊文件類型 */
export type ModuleFile = typeof MODULE_FILES[number];

/** 默認語言 */
export const DEFAULT_LANGUAGE = 'zh-CN';

/** 翻譯文件基礎路徑（運行時） */
export const LOCALES_BASE_PATH = './locales';

