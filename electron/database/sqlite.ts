import Database from 'better-sqlite3'
import pathConfig from '../core/pathConfigs.js'
import path from 'path'
import { logger } from '../core/logger.js'
import { ConfigName } from '../types/system.js'
import { pinyin } from "pinyin-pro";
import { extractIconOnWindows } from '../core/iconExtractor.js';
import { createConfigDb, createFilesDb, createFilesFtsDb, createProgramsDb } from './schema.js'

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
    // db.pragma('synchronous = NORMAL') // 在大多数情况下是安全且高效的

    //创建表
    try {
      createFilesDb(db)
    } catch (error) {
      logger.error(`创建表失败: ${JSON.stringify(error)}`)
    }
    try {
      createProgramsDb(db)
    } catch (error) {
      logger.error(`创建表失败2: ${JSON.stringify(error)}`)
    }
    try {
      createConfigDb(db)
    } catch (error) {
      logger.error(`创建表失败3: ${JSON.stringify(error)}`)
    }
    try {
      createFilesFtsDb(db)
    } catch (error) {
      logger.error(`FTS表创建失败: ${JSON.stringify(error)}`)
    }

    // 添加新的字段
    addColumn()

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
 * 添加新字段
 */
const addColumn = () => {
  logger.info('开始添加新字段')

  // 程序表
  try {
    // 0.4.1加上
    db.exec(`ALTER TABLE programs ADD COLUMN tags TEXT DEFAULT '[]'`)
    logger.info('成功添加tags字段到programs表')
  } catch (error) { }
  try {
    // 0.4.1加上
    db.exec(`ALTER TABLE files ADD COLUMN click_count INTEGER DEFAULT 0`)
    logger.info('成功添加click_count字段到files表')
  } catch (error) { }
  try {
    // 0.4.1加上
    db.exec(`ALTER TABLE files ADD COLUMN last_access_time DATETIME`)
    logger.info('成功添加last_access_time字段到files表')
  } catch (error) { }
  try {
    // 0.4.1加上
    db.exec(`ALTER TABLE programs ADD COLUMN click_count INTEGER DEFAULT 0`)
    logger.info('成功添加click_count字段到programs表')
  } catch (error) { }
  // 测量 programs 表的 click_count 是否存在
  try {
    db.exec(`SELECT click_count FROM programs LIMIT 1`)
    logger.info('programs表已存在click_count字段')
  } catch (error) {
    logger.info('programs表不存在click_count字段')
  }

  try {
    // 0.4.1加上
    db.exec(`ALTER TABLE programs ADD COLUMN last_access_time DATETIME`)
    logger.info('成功添加last_access_time字段到programs表')
  } catch (error) { }
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
export async function insertProgramInfo(programInfo: {
  DisplayName: string;
  Publisher: string;
  InstallLocation: string;
  DisplayIcon: string;
}): Promise<void> {
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

    // 解析图标(windows)
    if (process.platform === 'win32') {
      const programIcon = await extractIconOnWindows(
        programInfo.DisplayIcon,          // 可能 null / "C:\\xxx.exe,0"
        programInfo.InstallLocation,      // 备用目录
      );

      //  这里需要加一个判断，如果有 C:\PROGRA~1\DIFX\0169CE3A95F06636\DPInst64.exe,0 ，这种形式的需要取第一个
      if (programInfo.DisplayIcon?.includes(',')) {
        programInfo.DisplayIcon = programInfo.DisplayIcon.split(',')[0].trim()
      }

      // windows
      stmt.run(
        programInfo.DisplayName,
        pinyinArray.join(""),
        pinyinHead,
        programInfo.Publisher,
        programInfo.DisplayIcon || programInfo.InstallLocation,
        programIcon,
      );
    }
    else {

      // mac
      stmt.run(
        programInfo.DisplayName,
        pinyinArray.join(""),
        pinyinHead,
        programInfo.Publisher,
        programInfo.InstallLocation,
        programInfo.DisplayIcon,
      );
    }

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