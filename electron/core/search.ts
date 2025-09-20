import pathConfig from './pathConfigs.js';
import { getDatabase } from '../database/sqlite.js';
import { logger } from './logger.js';


/**
 * 计算两个字符串之间的 Levenshtein 距离。
 * Levenshtein 距离是指两个字符串之间，由一个转成另一个所需的最少编辑操作次数。
 * 编辑操作包括：插入、删除、替换。
 * 这个函数可以用来实现模糊搜索，比如拼写错误修正。
 * @param s1 第一个字符串
 * @param s2 第二个字符串
 * @returns 两个字符串之间的 Levenshtein 距离
 */
function levenshteinDistance(s1: string, s2: string): number {
    s1 = s1.toLowerCase();
    s2 = s2.toLowerCase();

    const costs = new Array();
    for (let i = 0; i <= s1.length; i++) {
        let lastValue = i;
        for (let j = 0; j <= s2.length; j++) {
            if (i == 0) {
                costs[j] = j;
            } else {
                if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) != s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
        }
        if (i > 0) {
            costs[s2.length] = lastValue;
        }
    }
    return costs[s2.length];
}

/**
 * 搜索文件，支持模糊搜索和近似搜索。
 * @param searchTerm 搜索关键词
 * @returns 匹配到的文件列表，按匹配度排序
 */
export function searchFiles(searchTerm: string): SearchResult {
    if (!searchTerm) {
        return {
            data: [],
            total: 0,
        }; // 如果没有搜索词，返回所有文件
    }
    // 1. 获取数据库连接
    const dbDirectory = pathConfig.get('database');
    if (!dbDirectory) {
        logger.error('数据库目录未配置');
        return {
            data: [],
            total: 0,
        };
    }
    const db = getDatabase()

    // 2. 从数据库中获取所有文件名
    // 注意：如果文件数量非常多（例如超过几十万），一次性加载到内存中可能会有性能问题。
    // 使用 SQL LIKE 进行模糊匹配，% 通配符表示匹配任意字符
    const stmt = db.prepare('SELECT id,path, name,modified_at,ext FROM files WHERE name LIKE ? OR summary LIKE ?');
    const searchPattern = `%${searchTerm}%`;
    const allFiles = stmt.all(searchPattern, searchPattern) as SearchDataItem[];

    return {
        data: allFiles,
        total: allFiles.length,
    };


    // 3. 使用 Levenshtein 距离进行模糊匹配
    // const results = allFiles
    //     .map(file => {
    //         // 我们只对文件名（不含扩展名）进行比较
    //         const fileNameWithoutExt = path.parse(file.name).name;
    //         const distance = levenshteinDistance(searchTerm, fileNameWithoutExt);
    //         return { ...file, distance };
    //     })
    //     .filter(file => {
    //         // 4. 设置一个阈值，距离越小表示匹配度越高
    //         // 这里的策略是：允许的编辑距离最多为2，或者不超过搜索词长度的三分之一
    //         const threshold = Math.floor(searchTerm.length / 3);
    //         return file.distance <= Math.min(2, threshold);
    //     })
    //     .sort((a, b) => a.distance - b.distance); // 5. 按距离排序，最匹配的在前面
}


