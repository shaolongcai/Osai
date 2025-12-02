// 作用：统一 Windows 路径为反斜杠，去掉冗余，避免重复记录
import path from 'path';

export function normalizeWinPath(input: string): string {
  if (!input) return input;
  let p = input.trim();
  p = path.win32.normalize(p);        // 统一分隔符、去掉冗余片段
  p = p.replace(/\//g, '\\');         // 强制使用反斜杠
  if (p.endsWith('\\') && !/^[A-Za-z]:\\$/.test(p)) {
    p = p.slice(0, -1);               // 去掉文件路径尾部反斜杠（保留盘符根）
  }
  return p;
}