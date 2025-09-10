import Database from 'better-sqlite3'
import pathConfig from '../core/pathConfigs.js'
import path from 'path'


export function getFilesCount(): number {
  try {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM files');
    const result = stmt.get() as { count: number };
    return result.count;
  } catch (error) {
    console.error('查询数据库记录总数失败:', error);
    return 0;
  }
}

let db: Database.Database | null = null
/**
 * 初始化数据库并返回一个连接实例。
 * 如果表不存在，则会创建它。
 */
export function initializeDatabase(): Database.Database {
    try {
        if (db) {
            return db
        }
        // 确保数据库所在的目录存在
        const dbDirectory = pathConfig.get('database')
        const dbPath = path.join(dbDirectory, 'metaData.db')
        console.log('数据库地址', dbPath)
        db = new Database(dbPath) // verbose 用于在开发时打印SQL语句

        // 优化数据库性能
        db.pragma('journal_mode = WAL') // 提升并发写入性能
        db.pragma('synchronous = NORMAL') // 在大多数情况下是安全且高效的

        // 创建文件索引表。如果表已存在，则此命令不会执行任何操作。
        // 我们为 `path` 列创建了一个唯一索引，以防止重复插入。
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
              vectorized INTEGER DEFAULT 0
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_files_md5 ON files (md5);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_files_path ON files (path);
          `)

        // 创建跟踪的

        //创建插入语句
        // const insert = db.prepare('INSERT INTO cats (name, age) VALUES (@name, @age)');
        //插入一条记录
        // insert.run({name:'Jack',age:2})
        //读取记录
        // const select_stmt=db.prepare('SELECT * FROM cats')
        // var cats=select_stmt.all()
        // console.log(cats)

        return db
    } catch (error) {
        console.error("数据库初始化失败:", error)
    }
}




/**
 * 获取数据库连接实例。
 * 如果连接未初始化，会先进行初始化。
 */
export function getDatabase(): Database.Database {
    if (!db) {
        return initializeDatabase()
    }
    return db
}