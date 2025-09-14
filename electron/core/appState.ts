import { EventEmitter } from 'events';

// 步骤1：创建一个事件发射器
// 作用：用于在应用的不同部分之间解耦通信。当模型准备就绪时，我们将用它来广播一个事件。
const appEmitter = new EventEmitter();

let isModelReady = false;
let isIndexUpdate = false;
let isOpenIndexImages = true;

/**
 * 步骤2：设置模型就绪状态并发出事件
 * @param status 模型是否已准备好
 */
export function setModelReady(status: boolean) {
    if (isModelReady === status) return; // 状态未改变，则不执行任何操作
    isModelReady = status;
    if (status) {
        // 当模型准备好时，发出 'model-ready' 事件
        appEmitter.emit('model-ready');
    }
}

// 索引更新
export function setIndexUpdate(status: boolean) {
    if (isIndexUpdate === status) return; // 状态未改变，则不执行任何操作
    isIndexUpdate = status;
    if (status) {
        // 当索引准备好时，发出 'index-update' 事件
        appEmitter.emit('index-update');
    }
}


//开启图片索引
export function setOpenIndexImages(status: boolean) {
    if (isOpenIndexImages === status) return; // 状态未改变，则不执行任何操作
    isOpenIndexImages = status;
    if (status) {
        // 当索引准备好时，发出 'open-index-image' 事件
        appEmitter.emit('open-index-image');
    }
}

/**
 * 步骤3：提供一个等待模型就绪的Promise函数
 * 作用：这个函数将返回一个Promise，它会一直等待直到 'model-ready' 事件被触发。
 * 这使得其他模块可以异步地等待模型准备就绪。
 * @returns 一个在模型就绪时解析的Promise
 */
export function waitForModelReady(): Promise<void> {
    return new Promise((resolve) => {
        if (isModelReady) {
            // 如果模型已经就绪，立即解析
            resolve();
        } else {
            // 否则，监听 'model-ready' 事件，一旦触发就解析
            appEmitter.once('model-ready', () => {
                resolve();
            });
        }
    });
}


// 等待索引更新 
export function waitForIndexUpdate(): Promise<void> {
    return new Promise((resolve) => {
        if (isIndexUpdate) {
            // 如果索引已经更新，立即解析
            resolve();
        } else {
            // 否则，监听 'index-update' 事件，一旦触发就解析
            appEmitter.once('index-update', () => {
                resolve();
            });
        }
    });
}

//等待开启图片索引
export function waitForIndexImage(): Promise<void> {
    return new Promise((resolve) => {
        if (isOpenIndexImages) {
            // 如果索引已经更新，立即解析
            resolve();
        } else {
            // 请使用once。使用on，会在循环中，造成大量监听器。导致内存溢出
            appEmitter.once('open-index-image', () => {
                resolve();
            });
        }
    });
}
