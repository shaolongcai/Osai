import pathConfig from './pathConfigs.js';
import { getDatabase } from '../database/sqlite.js';
import { logger } from './logger.js';
import { waitForModelReady } from './appState.js';



/**
 * 搜索文件，支持模糊搜索和近似搜索。
 * @param searchTerm 搜索关键词
 * @returns 匹配到的文件列表，按匹配度排序
 */
export function searchFiles(searchTerm: string, limit?: number): SearchResult {
    if (!searchTerm) {
        return {
            data: [],
            total: 0,
        };
    }
    // 获取数据库连接
    const dbDirectory = pathConfig.get('database');
    if (!dbDirectory) {
        logger.error('数据库目录未配置');
        return {
            data: [],
            total: 0,
        };
    }
    const db = getDatabase()

    // 步骤1：计算 FTS 候选上限（作用：控制 snippet 的生成数量）
    const ftsLimit = Math.min(Math.max(limit ?? 200, 50), 500);
    // 拆分为单字的方法（用于 FTS5 前缀查询，FTS5会把每个字作为一个 token，作为倒排）
    const buildFtsQuery = (input: string) => {
        const tokens = input
            .toLowerCase()
            .trim()
            .split(/\s+/)
            .filter(t => t.length > 0 && t.length <= 32)
            .slice(0, 8); // 控制词数，避免过长导致性能问题
        if (tokens.length === 0) return input.toLowerCase();
        // 用 OR + 前缀匹配扩大召回（fts5 支持 token* 前缀查询）
        return tokens.map(t => `${t}*`).join(' OR ');
    };
    const ftsQuery = buildFtsQuery(searchTerm);

    try {
        /**
        * 从数据库中获取所有文件
        * 注意：如果文件数量非常多（例如超过几十万），一次性加载到内存中可能会有性能问题。
        * 使用 SQL LIKE 进行模糊匹配，% 通配符表示匹配任意字符
        * 因子分别为：
        * Pfx: 前缀匹配（name 以 query 开头）
        * Sub: 子串位置权重（位置越靠前得分越高）
        * Fav: 点击偏好（click_count 归一化）
        * Rec: 最近访问（last_access_time 线性衰减：0.5天=1，90天=0）
        * Len: 长度惩罚（短名更高）
        */
        const stmt = db.prepare(`
      WITH q(query) AS (SELECT lower(?)),
      -- 临时结果集 ftsHits：只去 FTS5 虚拟表里做全文检索
      ftsHits AS (
        SELECT 
          rowid,
          snippet(files_fts, 0, '<mark>', '</mark>', '...', 16) AS snippet,
          bm25(files_fts) AS fts_score
        FROM files_fts
    -- 第二个参数 匹配全文
        WHERE files_fts MATCH ?
        ORDER BY bm25(files_fts)
    -- 第三个参数 限制返回数量
        LIMIT ?
      )
      SELECT 
        f.id, f.path, f.name, f.modified_at, f.last_access_time, f.ext, f.summary, f.ai_mark, f.click_count,
        (
          0.35 * CASE WHEN lower(f.name) LIKE q.query || '%' THEN CAST(length(q.query) AS REAL) / NULLIF(length(f.name),0) ELSE 0 END
        + 0.25 * CASE WHEN instr(lower(f.name),q.query) > 0 THEN 1 - (instr(lower(f.name),q.query) - 1) / CAST(length(f.name) AS REAL) ELSE 0 END
        + 0.18 * COALESCE(1.0 / (ftsHits.fts_score + 1.0), 0.0)
        + 0.10 * (1.0 - 1.0 / (COALESCE(f.click_count,0) + 1))
        + 0.06 * (
            CASE
              WHEN f.last_access_time IS NULL THEN 0
              ELSE
                CASE
                  WHEN (julianday('now') - julianday(f.last_access_time)) <= 0.5 THEN 1.0
                  WHEN (julianday('now') - julianday(f.last_access_time)) >= 90.0 THEN 0.0
                  ELSE 1.0 - ((julianday('now') - julianday(f.last_access_time)) - 0.5) / (90.0 - 0.5)
                END
            END
          )
        + 0.04 * (1.0 - MIN(length(f.name), 255) / 255.0)
        ) AS score,
        ftsHits.snippet AS snippet
      FROM files f
      LEFT JOIN ftsHits ON ftsHits.rowid = f.id
      CROSS JOIN q
      WHERE (
         lower(f.name) LIKE '%' || q.query || '%'
         OR lower(f.summary) LIKE '%' || q.query || '%'
         OR lower(f.tags) LIKE '%' || q.query || '%'
         OR ftsHits.rowid IS NOT NULL
      )
      ORDER BY f.ai_mark DESC, score DESC, f.name
      LIMIT 50
    `);
        const q = searchTerm.toLowerCase();
        const allFiles = stmt.all(q, ftsQuery, ftsLimit) as SearchDataItem[];

        // 统一日志输出到文件与终端
        logger.info(`搜索到的文件条数: ${allFiles.length}`);

        return {
            data: allFiles,
            total: allFiles.length,
        };
    } catch (error) {
        logger.error(`搜索文件失败: ${error}`);
        return {
            data: [],
            total: 0
        }
    }
}


/**
 * 快捷搜索
 * @returns 1、匹配的应用程序，2、匹配的带有AI Mark的文件 3、普通文件
 */
export function shortSearch(keyword: string): shortSearchResult {
    if (!keyword) {
        return {
            data: [],
            total: 0,
        };
    }
    // 搜索应用程序
    const programs = searchPrograms(keyword);
    // console.log('搜索到的程序', programs);
    // 搜索拥有AI Mark的文件
    const aiFiles = searchFiles(keyword, 50);

    console.log('搜索到的文件的第一个', aiFiles.data[0]);
    // 构造返回的data
    const programsData = programs.map(item => ({
        id: item.id,
        icon: item.display_icon,
        name: item.display_name,
        path: item.path || '',
        ext: '.exe'
    }));

    // 构造返回的data
    const aiFilesData = aiFiles.data.map(item => ({
        id: item.id,
        name: item.name,
        path: item.path || '',
        ext: item.ext || '', //没有ext则为文件夹
        aiMark: item.ai_mark,
    }));

    return {
        data: [...programsData, ...aiFilesData],
        total: programsData.length + aiFiles.total,
    };
}


/**
 * 搜索程序（包括已安装程序和快捷方式）
 * @param keyword 搜索关键词
 * @returns 匹配的程序列表
 */
export function searchPrograms(keyword: string, limit: number = 5): searchProgramItem[] {
    try {
        const database = getDatabase();
        const stmt = database.prepare(`
      SELECT * FROM programs 
      WHERE display_name LIKE ? OR publisher LIKE ? OR full_pinyin LIKE ? OR head_pinyin LIKE ?
      ORDER BY 
        CASE 
          WHEN display_name LIKE ? THEN 1
          WHEN display_name LIKE ? THEN 2
          ELSE 3
        END,
        (
          0.10 * (1.0 - 1.0 / (COALESCE(click_count,0) + 1))
        + 0.06 * (
            CASE
              WHEN last_access_time IS NULL THEN 0
              ELSE
                CASE
                  WHEN (julianday('now') - julianday(last_access_time)) <= 0.5 THEN 1.0
                  WHEN (julianday('now') - julianday(last_access_time)) >= 90.0 THEN 0.0
                  ELSE 1.0 - ((julianday('now') - julianday(last_access_time)) - 0.5) / (90.0 - 0.5)
                END
            END
          )
        ) DESC,
        display_name
      LIMIT ?
    `);

        const searchPattern = `%${keyword}%`;
        const exactPattern = `${keyword}%`; // WHEN display_name LIKE ? THEN 1 ：前面匹配优先

        return stmt.all(searchPattern, searchPattern, exactPattern, exactPattern, exactPattern, searchPattern, limit) as searchProgramItem[];
    } catch (error) {
        logger.error(`搜索程序失败: ${error}`);
        return [];
    }
}




// ------------------------ 以下代码暂时无用 ----------------------------







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