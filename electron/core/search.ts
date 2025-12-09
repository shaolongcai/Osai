import pathConfig from './pathConfigs.js';
import { getDatabase } from '../database/sqlite.js';
import { logger } from './logger.js';
import { waitForModelReady } from './appState.js';
import { aiSeverSingleton } from '../sever/aiSever.js';
import { ollamaService } from '../sever/ollamaSever.js';
import { describe } from 'node:test';



/**
 * 搜索文件，支持模糊搜索和近似搜索。
 * @param searchTerm 搜索关键词
 * @returns 匹配到的文件列表，按匹配度排序
 */
export function searchFiles(searchTerm: string, fileType?: string, limit?: number): shortSearchResult {
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
      AND (
         ? = 'ALL' OR
         (? = 'APP' AND f.ext IN ('.exe', '.lnk', '.app')) OR
         (? = 'DOC' AND f.ext IN ('.pdf', '.doc', '.docx', '.txt', '.md', '.ppt', '.pptx', '.xls', '.xlsx')) OR
         (? = 'IMAGE' AND f.ext IN ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico')) OR
         (? = 'OTHER' AND f.ext NOT IN ('.exe', '.lnk', '.app', '.pdf', '.doc', '.docx', '.txt', '.md', '.ppt', '.pptx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico'))
      )
      ORDER BY f.ai_mark DESC, score DESC, f.name
      LIMIT 50
    `);
    const q = searchTerm.toLowerCase();
    const fileTypeFilter = fileType || 'ALL';
    console.log('fileTypeFilter', fileTypeFilter)
    const allFiles = stmt.all(q, ftsQuery, ftsLimit, fileTypeFilter, fileTypeFilter, fileTypeFilter, fileTypeFilter, fileTypeFilter) as SearchDataItem[];

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


/**
 * 快捷搜索
 * @returns 1、匹配的应用程序，2、普通文件
 */
export function shortSearch(keyword: string, fileType?: string): shortSearchResult {
  if (!keyword) {
    return {
      data: [],
      total: 0,
    };
  }
  // 搜索应用程序
  const programs = searchPrograms(keyword);
  // 搜索拥有AI Mark的文件
  const aiFiles = searchFiles(keyword, fileType, 50);

  // console.log('搜索到的文件的第一个', aiFiles.data[0]);
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
    snippet: item.snippet,
  }));

  return {
    data: [...programsData, ...aiFilesData],
    total: programsData.length + aiFiles.total,
  };
}