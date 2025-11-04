import { useState, useEffect } from 'react';
import placeholder from '@/assets/icons/file.svg';
import folderIcon from '@/assets/icons/folder.svg';

/**
 * 自定义 Hook 用于加载图标
 * @param iconPath 图标路径
 * @returns 图标的 base64 数据 URL 或占位符
 */
export const useIcon = (iconPath?: string, ext?: string) => {
    const [iconSrc, setIconSrc] = useState<string>(placeholder);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {

        const loadIcon = async () => {
            // 默认图标
            if (!iconPath && ext === '.exe') {
                setIconSrc(placeholder);
                return;
            }
            // 若是文件夹，则默认为文件夹图标
            if (!iconPath && !ext) {
                setIconSrc(folderIcon);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const base64Data = await window.electronAPI.getIcon(iconPath, ext);
                if (base64Data) {
                    setIconSrc(base64Data);
                } else {
                    setIconSrc(placeholder);
                    setError('图标加载失败');
                }
            } catch (err) {
                console.error('加载图标失败:', err);
                setIconSrc(placeholder);
                setError(err instanceof Error ? err.message : '未知错误');
            } finally {
                setLoading(false);
            }
        };

        loadIcon();
    }, [iconPath]);

    return { iconSrc, loading, error };
};