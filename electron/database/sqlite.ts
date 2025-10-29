import Database from 'better-sqlite3'
import pathConfig from '../core/pathConfigs.js'
import path from 'path'
import { logger } from '../core/logger.js'
import { ConfigName } from '../types/system.js'
import { pinyin } from "pinyin-pro";


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
    logger.info(`数据库地址：${dbPath}`)
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
              summary TEXT,
              tags TEXT DEFAULT '[]'
            );
            CREATE UNIQUE INDEX IF NOT EXISTS idx_files_md5 ON files (md5);
            CREATE UNIQUE INDEX IF NOT EXISTS idx_files_path ON files (path);
          `)

    // 创建程序信息表
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
    // 为现有表添加tags字段（如果不存在）
    try {
      db.exec(`ALTER TABLE files ADD COLUMN skip_ocr BOOLEAN DEFAULT 0`) //是否跳过ocr
      logger.info('成功添加skip_ocr字段到files表')
      db.exec(`ALTER TABLE files ADD COLUMN ai_mark BOOLEAN DEFAULT 0`)
      logger.info('成功添加ai_mark字段到files表')
      db.exec(`ALTER TABLE files ADD COLUMN full_content TEXT DEFAULT ''`)
      logger.info('成功添加full_content字段到files表')
      db.exec(`ALTER TABLE files ADD COLUMN tags TEXT DEFAULT '[]'`)
      logger.info('成功添加tags字段到files表')
    } catch (error) {
      // 字段已存在时会报错，忽略即可
    }

    // 创建用户配置表
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

    // 插入默认配置
    const insertConfig = db.prepare(`
      INSERT OR IGNORE INTO user_config (config_key, config_value, config_type, description) 
      VALUES (?, ?, ?, ?)
    `)
    // 设置默认配置值
    insertConfig.run('last_index_time', '0', 'number', '上次索引时间戳') // 配置key、值、类型、描述
    insertConfig.run('index_interval', '3600000', 'number', '索引周期（毫秒，默认1小时）')
    insertConfig.run('last_index_file_count', '0', 'number', '上次索引的文件数量')
    insertConfig.run('ignored_folders', '[]', 'json', '忽略索引的文件夹列表')
    insertConfig.run('ignore_hidden_files', 'false', 'boolean', '是否忽略隐藏文件')

    return db
  } catch (error) {
    logger.error(`数据库初始化失败:${JSON.stringify(error)}`)
    throw new Error(`数据库初始化失败:${JSON.stringify(error)}`)
  }
}


/**
 * 获取配置值
 * @param key 配置键名
 * @returns 配置值，如果不存在返回null
 */
export function getConfig(key: ConfigName | string): any {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT config_value, config_type FROM user_config WHERE config_key = ?')
    const result = stmt.get(key) as { config_value: string; config_type: string } | undefined

    if (!result) return null

    // 根据类型转换值
    switch (result.config_type) {
      case 'number':
        return Number(result.config_value)
      case 'boolean':
        return result.config_value === 'true'
      case 'json':
        return JSON.parse(result.config_value)
      default:
        return result.config_value
    }
  } catch (error) {
    logger.error(`获取配置失败: ${key}, ${error}`)
    return null
  }
}

/**
 * 设置配置值
 * @param key 配置键名
 * @param value 配置值
 * @param type 数据类型
 */
export function setConfig(key: string, value: any, type: string = 'string'): boolean {
  try {
    const db = getDatabase()
    let configValue: string

    // 根据类型转换值为字符串
    switch (type) {
      case 'json':
        configValue = JSON.stringify(value)
        break
      default:
        configValue = String(value)
    }

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO user_config (config_key, config_value, config_type, updated_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `)
    stmt.run(key, configValue, type)
    return true
  } catch (error) {
    logger.error(`设置配置失败: ${key}, ${error}`)
    return false
  }
}

/**
 * 获取所有配置
 */
export function getAllConfigs(): Record<string, any> {
  try {
    const db = getDatabase()
    const stmt = db.prepare('SELECT config_key, config_value, config_type FROM user_config')
    const results = stmt.all() as Array<{ config_key: string; config_value: string; config_type: string }>

    const configs: Record<string, any> = {}
    results.forEach(row => {
      switch (row.config_type) {
        case 'number':
          configs[row.config_key] = Number(row.config_value)
          break
        case 'boolean':
          configs[row.config_key] = row.config_value === 'true'
          break
        case 'json':
          configs[row.config_key] = JSON.parse(row.config_value)
          break
        default:
          configs[row.config_key] = row.config_value
      }
    })
    return configs
  } catch (error) {
    logger.error(`获取所有配置失败: ${error}`)
    return {}
  }
}

/**
 * 插入程序信息到数据库
 * @param programInfo 程序信息
 */
export function insertProgramInfo(programInfo: {
  DisplayName: string;
  Publisher: string;
  InstallLocation: string;
  DisplayIcon: string;
}): void {
  try {
    const database = getDatabase();
    const stmt = database.prepare(`
      INSERT OR REPLACE INTO programs 
      (display_name, full_pinyin, head_pinyin, publisher, path, display_icon) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    //获取拼音
    const pinyinArray = pinyin(programInfo.DisplayName, { toneType: "none", type: "array" }); // ["han", "yu", "pin", "yin"]
    const pinyinHead = pinyinArray.map((item) => item[0]).join("");

    // console.log(pinyinArray);
    // console.log(pinyinHead);

    stmt.run(
      programInfo.DisplayName,
      pinyinArray.join(""),
      pinyinHead,
      programInfo.Publisher,
      programInfo.InstallLocation,
      programInfo.DisplayIcon,
    );

    logger.debug(`程序信息已插入: ${programInfo.DisplayName}`);
  } catch (error) {
    logger.error(`插入程序信息失败: ${error}`);
    throw error;
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