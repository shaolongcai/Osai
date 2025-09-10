import { app } from 'electron';
import * as path from 'path';
import * as os from 'os';
import { fileURLToPath } from 'url';
import * as fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


/**
 * 路径配置接口
 */
interface PathsConfig {
    userHome: string;
    appData: string;
    logs: string;
    models: string;
    cache: string;
    database: string;
    resources: string;
    temp: string;
}

/**
 * 路径键类型
 */
type PathKey = keyof PathsConfig;

/**
 * 统一路径配置管理
 * 集中管理应用中所有路径相关的配置
 */
class PathConfig {
    private userHome: string;
    private baseAppDir: string;
    private appDataPath: string;
    private paths: PathsConfig;
    private resources: string;


    constructor() {
        this.userHome = os.homedir();

        // 基础目录配置
        this.baseAppDir = app.isPackaged ? 'oogway' : 'oogway-test'; //sqlit 访问不了带.的前缀的文件夹
        this.appDataPath = path.join(this.userHome, this.baseAppDir);
        this.resources = app && app.isPackaged ? process.resourcesPath : path.join(__dirname, '../../electron/', 'resources'),   // 资源文件
            this.paths = null;

        // 初始化所有路径
        this._initializePaths();
    }

    _initializePaths() {
        // 应用数据目录
        this.paths = {
            // 主目录
            userHome: this.userHome,
            appData: this.appDataPath,

            // 资源文件
            resources: this.resources,

            // 日志目录
            logs: path.join(this.appDataPath, 'logs'),

            // 模型和缓存
            models: path.join(this.userHome, '.cache', 'huggingface', 'hub'),
            cache: path.join(this.appDataPath, 'cache'),

            // 数据库
            database: path.join(this.appDataPath, 'data'),

            // 上传的文件/临时文件
            temp: path.join(this.appDataPath, 'uploads', 'temp'),
        };

        //确保所有目录都存在
        Object.values(this.paths).forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        })
    }

    /**
      * 获取特定路径
      * @param pathKey 路径键名
      * @returns 对应的路径字符串
      */
    public get(pathKey: PathKey): string {
        return this.paths[pathKey];
    }

    /**
    * 获取所有路径配置
    * @returns 所有路径的副本
    */
    public getAll(): PathsConfig {
        return { ...this.paths };
    }

    /**
     * 创建自定义路径
     * @param basePath 基础路径键名
     * @param segments 路径片段
     * @returns 拼接后的路径字符串
     */
    public join(basePath: PathKey, ...segments: string[]): string {
        const base = this.paths[basePath] || basePath;
        return path.join(base, ...segments);
    }

}

// 创建单例实例
const pathConfig = new PathConfig();
// 兼容 CommonJS 和 ES6 模块的导出方式
export default pathConfig;
