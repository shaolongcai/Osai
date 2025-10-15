#!/usr/bin/env python3
# 步骤1：快速生成更新信息（直接指定文件）

import hashlib
import os
import base64
from datetime import datetime

# 配置区域 - 修改这里的参数
FILE_PATH = "F://my-electron-app//out//Osai Setup 0.2.3.exe"  # 修改为你的安装包路径

# 从 package.json 读取版本号
def get_version_from_package_json():
    """从 package.json 读取版本号"""
    package_json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'package.json')
    try:
        with open(package_json_path, 'r', encoding='utf-8') as f:
            package_data = json.load(f)
            return package_data.get('version', '1.0.0')
    except Exception as e:
        print(f"⚠️ 读取 package.json 失败: {e}")
        return '1.0.0'  # 默认版本号

NEW_VERSION = get_version_from_package_json()  # 从 package.json 获取版本号

def generate_update_info():
    """快速生成更新信息"""
    
    if not os.path.exists(FILE_PATH):
        print(f"❌ 文件不存在: {FILE_PATH}")
        return
    
    # 计算SHA512
    print("🔄 计算SHA512...")
    sha512_hash = hashlib.sha512()
    with open(FILE_PATH, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha512_hash.update(chunk)
    
    sha512 = base64.b64encode(sha512_hash.digest()).decode('utf-8')
    file_size = os.path.getsize(FILE_PATH)
    file_name = os.path.basename(FILE_PATH)
    current_time = datetime.utcnow().isoformat() + 'Z'
    
    # 生成YAML内容
    yml_content = f"""version: {NEW_VERSION}
files:
  - url: {file_name}
    sha512: {sha512}
    size: {file_size}
path: {file_name}
sha512: {sha512}
releaseDate: '{current_time}'"""
    
    # 写入文件
    # os.makedirs('updateInfo', exist_ok=True)
    with open('latest.yml', 'w', encoding='utf-8') as f:
        f.write(yml_content)
    
    print("✅ 生成完成!")
    print(f"📦 文件: {file_name}")
    print(f"🏷️  版本: {NEW_VERSION}")
    print(f"📏 大小: {file_size:,} bytes")
    print(f"🔐 SHA512: {sha512[:32]}...")

if __name__ == "__main__":
    generate_update_info()