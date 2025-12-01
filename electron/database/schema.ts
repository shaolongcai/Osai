/**
 * 负责数据库的表定义以及创建、添加字段
 */
import { Database } from 'better-sqlite3'


/**
 * 创建文件数据库
 * 我们为 `path` 列创建了一个唯一索引，以防止重复插入。
 * @param db 
 */
export const createFilesDb = (db: Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS files (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              md5 TEXT NOT NULL,
              path TEXT NOT NULL,
              name TEXT NOT NULL,
              ext TEXT NOT NULL,
              size INTEGER,
              created_at DATETIME,
              modified_at DATETIME,
              summary TEXT,
              full_content TEXT,
              skip_ocr INTEGER,
              ai_mark INTEGER,
              last_access_time DATETIME,
              click_count INTEGER,
              tags TEXT DEFAULT '[]'
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_files_md5 ON files (md5);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_files_path ON files (path);
          `)
}



/**
 * 创建程序数据库
 */
export const createProgramsDb = (db: Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS programs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              display_name TEXT NOT NULL,
              full_pinyin TEXT,
              head_pinyin TEXT,
              publisher TEXT,
              path TEXT,
              display_icon TEXT
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_programs_name ON programs (display_name);
          `)
}


/**
 * 创建文件全文搜索FTS5虚拟表（影子表）
 * 用于倒排索引和全文内容搜索
 * @param db 
 */
export const createFilesFtsDb = (db: Database) => {
    try {
        // 创建FTS5虚拟表，用于全文搜索
        db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
            full_content,
            content='files',
            content_rowid='id',
            tokenize='unicode61 remove_diacritics 2'
        );
    `)

        // 插入触发器（保证增/删/改3个触发器都有）
        db.exec(`
        CREATE TRIGGER IF NOT EXISTS files_fts_ai AFTER INSERT ON files BEGIN
  INSERT INTO files_fts(rowid, full_content)
  VALUES (new.id, new.full_content);
END;
`)

        //更新触发器
        db.exec(`
        CREATE TRIGGER IF NOT EXISTS files_fts_au AFTER UPDATE ON files BEGIN
  UPDATE files_fts
     SET full_content = new.full_content
   WHERE rowid = new.id;
END;
    `)

        //删除触发器：files表DELETE时，自动删除files_fts对应记录
        db.exec(`
        CREATE TRIGGER IF NOT EXISTS files_fts_delete AFTER DELETE ON files BEGIN
            DELETE FROM files_fts WHERE rowid = old.id;
        END;
    `)
    } catch (error) {
        console.error('创建FTS表失败:', error);
    }
}


/**
 * 创建用户配置表
 */
export const createConfigDb = (db: Database) => {
    db.exec(`
            CREATE TABLE IF NOT EXISTS user_config (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              config_key TEXT NOT NULL UNIQUE,
              config_value TEXT,
              config_type TEXT DEFAULT 'string',
              description TEXT,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_config_key ON user_config (config_key);
          `)
}