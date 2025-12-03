/**
 * 数学相关工具
 */
import * as crypto from 'crypto';

/**
 * md5计算方法
 * @param path 文件路径
 * @param size 文件大小
 * @param modifiedAt 文件修改时间
 * @returns 计算后的md5值
 */
export const calculateMd5 = (path: string, size: number, modifiedAt: number) => {
    const metadataString = `${path}-${size}-${modifiedAt}`;
    const md5 = crypto.createHash('md5').update(metadataString).digest('hex');
    return md5
}
