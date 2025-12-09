/**
 * 文件类型枚举
 */
export enum FileCate {
  ALL = 'ALL',
  APP = 'APP',
  DOC = 'DOC',
  IMAGE = 'IMAGE',
  OTHER = 'OTHER'
}

/**
 * 文件类型联合类型
 */
export type FileTypeUnion = keyof typeof FileCate;

export const NOTIFICATION_TYPE = {
  PENDING: 'pending',
  SUCCESS: 'success',
  WARNING: 'warning',
  LOADING: 'loading',
  LOADING_QUESTION: 'loadingQuestion',
  QUESTION: 'question',
} as const

export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]