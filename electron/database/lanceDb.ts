// import * as lancedb from '@lancedb/lancedb';
// import * as arrow from 'apache-arrow';
// import pathConfig from '../core/pathConfigs.js';
// import path from 'path';
// import { vectorizeText } from '../core/vectorization.js';

// /**
//  * 向量数据库 LanceDB 管理器
//  * 📌 控制 lancedb 的所有操作
//  */
// class LanceDBManager {
//     private dbUri: string;
//     private db: lancedb.Connection | null = null;

//     constructor() {
//         // 获取数据库路径
//         const dbDirectory = pathConfig.get('database');
//         this.dbUri = path.join(dbDirectory, 'lancedb');
//     }

//     /**
//      * 初始化数据库（异步）
//      */
//     async initDbAsync(): Promise<void> {
//         try {
//             console.log(`db_uri: ${this.dbUri}`);

//             // 连接数据库
//             this.db = await lancedb.connect(this.dbUri);
//             const tableNames = await this.db.tableNames();

//             // 检查表是否存在
//             const hasFilesDb = tableNames.includes('files');

//             if (!hasFilesDb) {
//                 console.log('未找到表，初始化数据库');

//                 // 初始化向量维度测试
//                 const testText = '测试向量维度';
//                 const vector = await vectorizeText(testText);
//                 const vectorDim = vector.length;
//                 console.log(`vector_dim: ${vectorDim}`);

//                 // 定义表结构
//                 const schema = new arrow.Schema([
//                     new arrow.Field('vector', new arrow.FixedSizeList(vectorDim, new arrow.Field("name", new arrow.Float32(), true),)),
//                     new arrow.Field('name', new arrow.Utf8()),
//                     new arrow.Field('filePath', new arrow.Utf8()),
//                     new arrow.Field('md5', new arrow.Utf8()),
//                 ]);

//                 try {
//                     // 创建表
//                     const filesTable = await this.db.createTable('files', [], { schema });

//                     // 创建全文搜索索引
//                     await filesTable.createIndex('name', { replace: true });

//                     console.log('表和索引创建成功');
//                 } catch (error) {
//                     const msg = error instanceof Error ? error.message : '创建索引失败';
//                     console.error(`创建索引时出错：${msg}`);
//                 }
//             }

//             const currentTableNames = await this.db.tableNames();
//             console.log(`当前表名: ${currentTableNames}`);

//         } catch (error) {
//             const msg = error instanceof Error ? error.message : '数据库初始化失败';
//             console.error(`数据库初始化失败: ${msg}`);
//             throw error;
//         }
//     }

//     /**
//      * 获取表
//      */
//     async getTable(tableName: string): Promise<lancedb.Table> {
//         if (!this.db) {
//             this.db = await lancedb.connect(this.dbUri);
//         }
//         return await this.db.openTable(tableName);
//     }
// }

// // 全局数据库管理器实例
// const dbManager = new LanceDBManager();



// /**
//  * 获取文件表
//  */
// export async function getLanceFilesTable(): Promise<lancedb.Table> {
//     return await dbManager.getTable('files');
// }


// /**
//  * 初始化数据库
//  */
// export async function initLanceDB(): Promise<void> {
//     await dbManager.initDbAsync();
// }

// export default dbManager;