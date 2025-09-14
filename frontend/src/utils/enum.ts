


export const NOTIFICATION_TYPE = {
    PENDING: 'pending',
    SUCCESS: 'success',
    WARNING: 'warning',
    LOADING: 'loading',
    LOADING_QUESTION: 'loadingQuestion',
    QUESTION: 'question',
} as const
export type NotificationType = (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE]