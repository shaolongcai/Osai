import * as fs from 'fs';
import * as path from 'path';
import pathConfig from './pathConfigs.js';

// ANSI颜色代码，用于在控制台和支持的查看器中输出彩色日志
const logColors = {
    INFO: '\x1b[34m',    // 蓝色
    ERROR: '\x1b[31m',   // 红色
    WARN: '\x1b[33m',    // 黄色
    DEBUG: '\x1b[90m',   // 灰色
    reset: '\x1b[0m'     // 重置颜色
};

// 日志级别对应的 Emoji
const logEmojis = {
    INFO: 'ℹ️',
    ERROR: '❌',
    WARN: '⚠️',
    DEBUG: '🐛'
};

/**
 * 日志管理器类
 * 功能：提供统一的日志记录功能，支持文件输出和控制台输出
 * 📌 打包时，请编译为js
 */
class Logger {
    private logPath: string;
    private logDir: string;

    constructor() {
        this.logPath = this.getLogPath();
        this.logDir = path.dirname(this.logPath);
        this.ensureLogDirectory();

        // 等待构造完再记录
        this.log(`Logger 初始化完成,路径：${this.logDir}`, 'INFO');
    }

    /**
     * 获取日志文件路径
     * 日志文件名格式：YYYY-MM-DD.log
     */
    private getLogPath(): string {
        const today = new Date();
        const dateStr = today.toISOString().split('T')[0]; // 格式：YYYY-MM-DD
        const logFileName = `${dateStr}.log`;
        const logsPath: string = pathConfig.get('logs');
        return path.join(logsPath, logFileName);
    }

    /**
     * 确保日志目录存在
     */
    private ensureLogDirectory(): void {
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * 记录日志
     * @param message 日志消息
     * @param level 日志级别（可选）
     */
    public log(message: string, level: 'INFO' | 'ERROR' | 'WARN' | 'DEBUG' = 'INFO'): void {
        // 使用北京时间 (UTC+8)
        const now = new Date();
        const beijingTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        const timestamp = beijingTime.toISOString().replace('T', ' ').substring(0, 19);
        const color = logColors[level] || logColors.reset; // 获取对应级别的颜色
        const emoji = logEmojis[level] || ''; // 获取对应的 emoji
        const resetColor = logColors.reset;

        // const logMessage = `[${timestamp} +08:00] [${level}] ${message}\n`;
        const fileLogMessage = `${emoji}[${timestamp} +08:00] [${level}] ${message}\n`;

        try {
            // 写入文件
            fs.appendFileSync(this.logPath, fileLogMessage);
        } catch (error) {
            console.error('Failed to write log to file:', error);
        }

        // 为控制台构造带颜色的日志消息
        const consoleLogMessage = `${color}[${level}] ${message}${resetColor}`;
        // 同时输出到控制台
        console.log(consoleLogMessage);
    }

    /**
     * 记录信息日志
     */
    public info(message: string): void {
        this.log(message, 'INFO');
    }

    /**
     * 记录错误日志
     */
    public error(message: string): void {
        this.log(message, 'ERROR');
    }

    /**
     * 记录警告日志
     */
    public warn(message: string): void {
        this.log(message, 'WARN');
    }

    /**
     * 记录调试日志
     */
    public debug(message: string): void {
        this.log(message, 'DEBUG');
    }

    /**
     * 获取当前日志文件路径
     */
    public getLogFilePath(): string {
        return this.logPath;
    }
}


export const logger = new Logger();