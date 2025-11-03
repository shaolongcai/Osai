import Database from 'better-sqlite3'
import pathConfig from '../core/pathConfigs.js'
import path from 'path'
import { logger } from '../core/logger.js'
import { ConfigName } from '../types/system.js'
import { pinyin } from "pinyin-pro";
import fileIcon from 'extract-file-icon';
import * as fs from 'fs'
import { execSync } from 'child_process';

let db: Database.Database | null = null



/**
 * 使用 PowerShell 直接提取 EXE 图标
 */
function extractIconWithPowerShell(exePath: string, outputPath: string): boolean {
  try {
    const script = `
Add-Type -AssemblyName System.Drawing
try {
    $icon = [System.Drawing.Icon]::ExtractAssociatedIcon('${exePath.replace(/\\/g, '\\\\')}')
    if ($icon -ne $null) {
        $bmp = $icon.ToBitmap()
        $bmp.Save('${outputPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        $icon.Dispose()
        Write-Output "SUCCESS"
    } else {
        Write-Output "FAILED: No icon found"
    }
} catch {
    Write-Output "FAILED: $_"
}
`;

    const result = execSync(`powershell -Command "${script}"`, {
      timeout: 15000,
      encoding: 'utf8',
      stdio: 'pipe'
    });

    return result.toString().trim().startsWith('SUCCESS') && fs.existsSync(outputPath);
  } catch (error) {
    console.error('PowerShell 图标提取失败:', error);
    return false;
  }
}

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

    // 解析图标
    const programIcon = extractIcon(
      programInfo.DisplayIcon,          // 可能 null / "C:\\xxx.exe,0"
      programInfo.InstallLocation,      // 备用目录
    );

    stmt.run(
      programInfo.DisplayName,
      pinyinArray.join(""),
      pinyinHead,
      programInfo.Publisher,
      programInfo.InstallLocation || programInfo.DisplayIcon,
      programIcon,
    );

    logger.debug(`程序信息已插入: ${programInfo.DisplayName}`);
  } catch (error) {
    logger.error(`插入程序信息失败: ${error}`);
    throw error;
  }
}


/**
 * 使用 PowerShell 将 ICO 转换为 PNG
 */
function convertIcoToPngWithPowerShell(icoPath: string, pngPath: string): boolean {
  try {
    const script = `
Add-Type -AssemblyName System.Drawing
$ico = [System.Drawing.Icon]::new('${icoPath.replace(/\\/g, '\\\\')}')
$bmp = $ico.ToBitmap()
$bmp.Save('${pngPath.replace(/\\/g, '\\\\')}', [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$ico.Dispose()
`;

    execSync(`powershell -Command "${script}"`, {
      timeout: 10000,
      stdio: 'pipe'
    });

    return fs.existsSync(pngPath);
  } catch (error) {
    console.error('PowerShell ICO转PNG失败:', error);
    return false;
  }
}


/**
 * 解析windows应用的icon
 * @param displayIcon 
 * @param installLoc 
 * @param cacheDir 
 * @returns 返回图片png形式
 */
function extractIcon(
  displayIcon: string | null,
  installLoc: string,
): string {

  const cacheDir = pathConfig.get('iconsCache')

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

  /* ---------- 1. 拿到“候选 exe/ico 路径” ---------- */
  let srcPath = '';
  if (displayIcon) {
    // 拆 “path[,index]” 我们只取路径，index 忽略（库固定 0）
    srcPath = displayIcon.split(',')[0].trim().replace(/^"|"$/g, '');
  }

  // 2. 空或不存在 → 用 InstallLocation 下第一个 exe
  if (!srcPath || !fs.existsSync(srcPath)) {
    console.log(`原始路径不存在，尝试查找备用路径: ${srcPath}`);

    if (installLoc && fs.existsSync(installLoc)) {
      try {
        // 查找所有可执行文件（exe, dll）
        const executables = fs
          .readdirSync(installLoc, { withFileTypes: true })
          .filter(d => d.isFile() &&
            (d.name.toLowerCase().endsWith('.exe') ||
              d.name.toLowerCase().endsWith('.dll')))
          .map(d => path.join(installLoc, d.name));

        // 优先选择主程序（通常与目录名相似）
        const dirName = path.basename(installLoc).toLowerCase();
        const mainExe = executables.find(exe => {
          const exeName = path.basename(exe, path.extname(exe)).toLowerCase();
          return exeName.includes(dirName) || dirName.includes(exeName);
        });

        srcPath = mainExe || executables[0] || '';
        if (srcPath) {
          console.log(`找到备用可执行文件: ${srcPath}`);
        }
      } catch (error) {
        console.warn(`读取安装目录失败: ${installLoc}`, error);
      }
    }

    // 如果还是没找到，尝试从 DisplayIcon 路径推断
    if (!srcPath && displayIcon) {
      const iconDir = path.dirname(displayIcon.split(',')[0].trim().replace(/^"|"$/g, ''));
      if (fs.existsSync(iconDir)) {
        try {
          const executables = fs
            .readdirSync(iconDir, { withFileTypes: true })
            .filter(d => d.isFile() && d.name.toLowerCase().endsWith('.exe'))
            .map(d => path.join(iconDir, d.name));

          srcPath = executables[0] || '';
          if (srcPath) {
            console.log(`从图标路径找到可执行文件: ${srcPath}`);
          }
        } catch (error) {
          console.warn(`读取图标目录失败: ${iconDir}`, error);
        }
      }
    }
  }

  if (!srcPath) {
    console.warn('无法找到有效的源文件路径');
    return '';
  }

  /* ---------- 3. 区分 ico / exe|dll ---------- */
  const ext = path.extname(srcPath).toLowerCase();
  const pngName = `${path.parse(srcPath).name}.png`;
  const pngPath = path.join(cacheDir, pngName);

  try {
    if (ext === '.ico') {
      // ico → 直接复制（或 sharp 转 png）
      fs.copyFileSync(srcPath, pngPath);
    } else if (ext === '.exe' || ext === '.dll') {
      // 方案1：使用 extract-file-icon 库
      const buf: Buffer = fileIcon(srcPath, 64);

      if (!buf || buf.length === 0) {
        console.warn('extract-file-icon 提取失败，尝试 PowerShell 方案:', srcPath);

        // 方案2：使用 PowerShell 直接提取
        const success = extractIconWithPowerShell(srcPath, pngPath);
        if (success) {
          console.log('PowerShell 图标提取成功:', srcPath);
          return pngPath;
        }

        console.warn('所有图标提取方案都失败:', srcPath);
        return '';
      }

      // extract-file-icon 成功，继续处理 Buffer
      // 检查 Buffer 是否是 PNG 格式（PNG 文件头：89 50 4E 47）
      const isPNG = buf.length >= 4 &&
        buf[0] === 0x89 && buf[1] === 0x50 &&
        buf[2] === 0x4E && buf[3] === 0x47;

      if (isPNG) {
        // 已经是 PNG 格式，直接保存
        fs.writeFileSync(pngPath, buf);
      } else {
        // 保存为临时 ICO 文件，然后转换为 PNG
        const tempIcoPath = path.join(cacheDir, `temp_${path.parse(srcPath).name}.ico`);
        fs.writeFileSync(tempIcoPath, buf);

        // 尝试转换为 PNG
        const converted = convertIcoToPngWithPowerShell(tempIcoPath, pngPath);

        // 清理临时文件
        try {
          fs.unlinkSync(tempIcoPath);
        } catch (e) {
          // 忽略清理错误
        }

        if (!converted) {
          console.warn('ICO转PNG失败，尝试 PowerShell 直接提取:', srcPath);

          // 备用方案：PowerShell 直接提取
          const success = extractIconWithPowerShell(srcPath, pngPath);
          if (success) {
            console.log('PowerShell 备用提取成功:', srcPath);
            return pngPath;
          }

          // 最后保留 ICO 格式
          const icoPath = path.join(cacheDir, `${path.parse(srcPath).name}.ico`);
          fs.writeFileSync(icoPath, buf);
          return icoPath;
        }
      }
    } else {
      // 非常规扩展名当 ico 处理
      fs.copyFileSync(srcPath, pngPath);
    }
    return pngPath;
  } catch (e) {
    console.error('extract-file-icon 失败', srcPath, e);
    return '';
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