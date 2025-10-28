import pathConfig from './pathConfigs.js';
import { getDatabase, searchPrograms } from '../database/sqlite.js';
import { logger } from './logger.js';
import { waitForModelReady } from './appState.js';
import { SearchPrompt } from '../data/prompt.js';


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
        };
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

     // 搜索应用程序
    const programs =  searchPrograms(searchTerm);
    console.log('搜索到的程序', programs);

    // 2. 从数据库中获取所有文件名
    // 注意：如果文件数量非常多（例如超过几十万），一次性加载到内存中可能会有性能问题。
    // 使用 SQL LIKE 进行模糊匹配，% 通配符表示匹配任意字符
    const stmt = db.prepare('SELECT id,path, name,modified_at,ext,summary,ai_mark FROM files WHERE name LIKE ? OR summary LIKE ? OR tags LIKE ?');
    const searchPattern = `%${searchTerm}%`;
    const allFiles = stmt.all(searchPattern, searchPattern, searchPattern) as SearchDataItem[];

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


/**
 * AI搜索
 * @params query 搜索关键词
 */
export async function aiSearch(query: string): Promise<SearchResult> {

    // 上下文
    let context: null = null;

    try {
        // 步骤1、模型分类
        if (!query) {
            return {
                data: [],
                total: 0,
            };
        }
        // 检查模型是否就绪(@todo 换成checkmodel)
        await waitForModelReady();
        // 获取模型

        return
        // JSON模式
        // context = await model.createContext();
        // const session = new LlamaChatSession({
        //     contextSequence: context.getSequence(),
        //     systemPrompt: SearchPrompt
        // });
        // const grammar = await llama.createGrammarForJsonSchema({
        //     type: "object",
        //     properties: {
        //         keywords: {
        //             type: "array",
        //             items: {
        //                 type: "string"
        //             }
        //         },
        //         ext: {
        //             type: "array",
        //             items: {
        //                 type: "string"
        //             }
        //         }
        //     },
        //     required: ["keywords", "ext"]
        // });

        // // 📌 使用惩罚性参数，以免模型一直循环卡住。
        // const response = await session.prompt(`用户输入：${query}`, {
        //     grammar,
        //     maxTokens: context.contextSize,
        //     temperature: 0.5,
        //     // 惩罚token 参数
        //     repeatPenalty: {
        //         penalty: 1.12,
        //         presencePenalty: 0.02,
        //     },
        //     // onTextChunk(chunk: string) {
        //     //     logger.info(`AI模型返回结果:${chunk}`);
        //     //     process.stdout.write(chunk);
        //     // }
        // });

        // logger.info(`AI模型调用成功，返回结果:${response}`);
        // // 取出参数
        // const { keywords, ext } = JSON.parse(response);

        // // 步骤二：搜索文件
        // const searchFiles = await searchByKeywordsAndExt(keywords, ext);

        // // 步骤三：逐个检查是否相关
        // const sortedFiles = await checkRelevance(searchFiles, query, keywords);

        // return {
        //     data: sortedFiles,
        //     total: sortedFiles.length,
        // };
    } catch (error) {
        const msg = error instanceof Error ? error.message : 'AI模型调用失败';
        logger.error(`AI模型调用失败:${msg}`);
        return {
            data: [],
            total: 0,
        };
    } finally {
        if (context) {
            // dispose() 会释放 context 占用的内存
            // await context.dispose();
            logger.info('AI Context 已成功释放');
        }
    }
}


/**
 * 步骤二：通关关键词及类型搜索
 */
export async function searchByKeywordsAndExt(keywords: string[], ext: string[]): Promise<any> {
    try {
        logger.info(`searchByKeywordsAndExt keywords:${keywords}, ext:${ext}`);
        if (!keywords.length && !ext.length) {
            return {
                data: [],
                total: 0,
            };
        }
        // 1. 获取数据库连接
        const db = getDatabase();

     

        // 2. 准备动态构建SQL查询
        const params: any[] = [];
        const whereClauses: string[] = [];

        // 3. 构建关键词匹配逻辑
        //    - 将每个关键词构造成 (name LIKE ? OR summary LIKE ?) 的形式
        //    - 将所有关键词的条件用 OR 连接起来，表示命中任意一个关键词即可
        if (keywords && keywords.length > 0) {
            const keywordConditions = keywords.map(() => '(name LIKE ? OR summary LIKE ?)').join(' OR ');
            whereClauses.push(`(${keywordConditions})`);
            // 为每个 (name LIKE ? OR summary LIKE ?) 提供两个相同的关键词参数
            keywords.forEach(k => params.push(`%${k}%`, `%${k}%`));
        }

        // 4. 构建扩展名匹配逻辑
        //    - 使用 IN 操作符匹配所有指定的扩展名
        if (ext && ext.length > 0) {
            const extPlaceholders = ext.map(() => '?').join(',');
            whereClauses.push(`ext IN (${extPlaceholders})`);
            params.push(...ext);
        }

        // 5. 如果没有任何搜索条件，直接返回空结果，避免查询全表
        if (whereClauses.length === 0) {
            return {
                data: [],
                total: 0,
            };
        }

        // 6. 组合成最终的SQL语句
        //    - 使用 SELECT DISTINCT 确保返回的每个文件记录是唯一的（去重）
        //    - 使用 AND 连接关键词条件和扩展名条件，表示两者必须同时满足
        const sql = `SELECT DISTINCT path, name, modified_at, ext, summary FROM files WHERE ${whereClauses.join(' AND ')}`;

        // 7. 执行查询
        const stmt = db.prepare(sql);
        const dbResults = stmt.all(...params) as { path: string; name: string; modified_at: string; ext: string }[];

        // 8. 按你的要求重新组件结果，并将 modified_at 重命名为 '修改时间'
        const finalResults = dbResults.map(file => ({
            path: file.path,
            name: file.name,
            '修改时间': file.modified_at,
            ext: file.ext
        }));

        return finalResults
    } catch (error) {
        const msg = error instanceof Error ? error.message : '数据库查询失败';
        logger.error(`数据库查询失败:${msg}`);
        throw new Error(msg);
    }
}



// 辅助函数：转义正则表达式中的特殊字符，防止关键词本身包含如“+”、“.”等符号时出错
const escapeRegExp = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/**
 * 步骤三：逐个检查是否相关
 */
export async function checkRelevance(files: any[], query: string, keywords: string[]): Promise<SearchResult[]> {
    try {
        logger.info(`checkRelevance results:${files.length}, query:${query}`);

        // 轮询检查每份文件
        const filesWithScores = await Promise.all(files.map(async (file) => {
            let score = 0
            try {
                if (file.ext === '.jpg' || file.ext === '.png' || file.ext === '.jpeg') {
                    // 若为图片则需要取出摘要，并且向量化摘要以及query
                    // score = await checkImageRelevance(file, query);
                } else if (file.ext === '.docx' || file.ext === '.xlsx' || file.ext === '.pptx') {
                    // 文档
                    logger.info(`打开文档:${file.path}`);
                    // const loader = new DocxLoader(file.path);
                    // const docs = await loader.load();
                    // const docContent = docs.map(doc => doc.pageContent).join('\n');
                    // // b. 如果成功读取内容，则基于关键词出现次数计算得分
                    // if (docContent) {
                    //     if (keywords && keywords.length > 0) {
                    //         let totalKeywordScore = 0;
                    //         const lowerCaseContent = docContent.toLowerCase();

                    //         for (const keyword of keywords) {
                    //             const lowerCaseKeyword = keyword.toLowerCase();
                    //             if (lowerCaseKeyword.length === 0) continue;

                    //             // 步骤 2.1: 统计单个关键词在内容中出现的总次数
                    //             const escapedKeyword = escapeRegExp(lowerCaseKeyword);
                    //             const occurrences = (lowerCaseContent.match(new RegExp(escapedKeyword, 'g')) || []).length;

                    //             // 步骤 2.2: 使用 1 - 1/(n+1) 的方式对词频进行归一化，使其得分在 [0, 1) 区间
                    //             // 这样，出现1次得0.5分，出现次数越多，得分越趋近于1，但增长会放缓
                    //             const keywordScore = 1 - 1 / (occurrences + 1);
                    //             totalKeywordScore += keywordScore;
                    //         }
                    //         // 步骤 2.3: 将所有关键词的归一化分数相加，然后除以关键词总数，得到最终的平均分
                    //         score = totalKeywordScore / keywords.length;
                    //     } else {
                    //         score = 0;
                    //     }
                    // }
                    return {
                        ...file,
                        score,
                    }
                }
            } catch (error) {
                const msg = error instanceof Error ? error.message : '检查相关性失败';
                logger.error(`checkRelevance file:${file.path}, 检查相关性失败:${msg}`);
            }
        }))

        // 步骤三：根据计算出的得分，对文件列表进行降序排序
        const sortedFiles = filesWithScores.sort((a, b) => b.score - a.score);
        logger.info(`checkRelevance sortedFiles:${sortedFiles.map(f => f.path)}`);
        return sortedFiles;


    } catch (error) {
        const msg = error instanceof Error ? error.message : '检查相关性失败';
        logger.error(`检查相关性失败:${msg}`);
        throw new Error(msg);
    }
}


// 根据文档类型读取文档内容
async function readDocumentContent(file: any): Promise<any> {
    try {
        const { path, ext } = file;
        switch (ext) {
            case '.docx':

            case '.xlsx':
            case '.pptx':
                // 使用langchain读取文档内容
                break;
            default:
                throw new Error(`不支持的文档类型: ${ext}`);
        }
    } catch (error) {
        const msg = error instanceof Error ? error.message : '读取文档内容失败';
        logger.error(`读取文档内容失败:${msg}`);
        throw new Error(msg);
    }
}
