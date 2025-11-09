import { parentPort } from 'worker_threads';
import * as path from 'path';
import * as fs from 'fs';
import { createRequire } from 'module';
import pathConfig from '../core/pathConfigs.js';

const require = createRequire(import.meta.url);
const { batchExtractIcons } = require('../../native/dist/win32-x64-139/icon_extractor.node');

const supportedIconFormats = [
  '.exe', '.xslx', '.wps', '.csv', '.xls', '.doc', '.docx', '.pptx',
  '.ppt', '.txt', '.lnk', '.pdf', '.md', '.jpg', '.jpeg', '.png', '.gif'
];

parentPort!.on('message', (payload: { extToFileMap: Record<string, string> }) => {
  const { extToFileMap } = payload;
  try {
    const pathsToExtract: string[] = [];
    const correspondingExts: string[] = [];

    for (const [ext, filePath] of Object.entries(extToFileMap)) {
      if (supportedIconFormats.includes(ext)) {
        pathsToExtract.push(filePath.replace(/\//g, '\\'));
        correspondingExts.push(ext);
      }
    }

    if (pathsToExtract.length > 0) {
      const buffers: (Buffer | null)[] = batchExtractIcons(pathsToExtract, 256);
      
      const iconsCachePath = pathConfig.get('iconsCache');
      if (!fs.existsSync(iconsCachePath)) {
        fs.mkdirSync(iconsCachePath, { recursive: true });
      }

      for (let i = 0; i < buffers.length; i++) {
        const buffer = buffers[i];
        if (buffer) {
          const ext = correspondingExts[i];
          const outName = ext.slice(1) + '.png';
          const outPath = path.join(iconsCachePath, outName);
          fs.writeFileSync(outPath, buffer);
        }
      }
    }

    parentPort!.postMessage({ type: 'done' });
  } catch (error) {
    parentPort!.postMessage({
      type: 'error',
      error: error instanceof Error ? error.message : String(error)
    });
  }
});