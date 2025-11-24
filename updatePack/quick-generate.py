#!/usr/bin/env python3
# 步骤1：快速生成更新信息（直接指定文件）

import hashlib
import os
import base64
from datetime import datetime
import glob
import json

# 定义项目根目录和输出目录
project_dir = os.path.dirname(os.path.dirname(__file__))
out_dir = os.path.join(project_dir, 'out')

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


def find_exe_files(version):
    """根据版本号查找匹配的 EXE 文件，返回列表"""
    if not os.path.exists(out_dir):
        print(f"❌ 目录不存在: {out_dir}")
        return []
    # 优先查找包含版本号的 EXE 文件
    exe_pattern = os.path.join(out_dir, f"*{version}*.exe")
    found_files = glob.glob(exe_pattern)
    if found_files:
        return found_files
    # 回退：查找任意 .exe 文件
    print(f"⚠️ 未找到版本为 {version} 的 EXE 文件，将查找任意 EXE 文件。")
    exe_pattern = os.path.join(out_dir, "*.exe")
    found_files = glob.glob(exe_pattern)
    return found_files


def compute_sha512(file_path: str) -> str:
    """计算指定文件的 sha512（base64）"""
    sha512_hash = hashlib.sha512()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b''):
            sha512_hash.update(chunk)
    return base64.b64encode(sha512_hash.digest()).decode('utf-8')


def generate_update_info():
    """快速生成更新信息"""
    exe_files = find_exe_files(NEW_VERSION)
    if not exe_files:
        print("❌ 未找到任何 EXE 文件")
        return
    target_file = exe_files[0]
    file_name = os.path.basename(target_file)

    # 计算安装包 sha512
    sha512 = compute_sha512(target_file)
    file_size = os.path.getsize(target_file)
    current_time = datetime.utcnow().isoformat() + 'Z'

    # 可选差分：如果有 .blockmap，则也加入 latest.yml
    blockmap_path = target_file + '.blockmap'
    blockmap_entry = ""
    if os.path.exists(blockmap_path):
        blockmap_sha512 = compute_sha512(blockmap_path)
        blockmap_size = os.path.getsize(blockmap_path)
        blockmap_name = os.path.basename(blockmap_path)
        blockmap_entry = f"""
    - url: {blockmap_name}
      sha512: {blockmap_sha512}
      size: {blockmap_size}"""

    # 生成YAML内容（包含 .exe 与可选 .blockmap）
    yml_content = f"""version: {NEW_VERSION}
files:
    - url: {file_name}
      sha512: {sha512}
      size: {file_size}{blockmap_entry}
path: {file_name}
sha512: {sha512}
releaseDate: '{current_time}'"""

    # 写入文件
    yml_path = os.path.join(out_dir, 'latest.yml')
    with open(yml_path, 'w', encoding='utf-8') as f:
        f.write(yml_content)

    print("✅ 生成完成!")
    print(f"📦 文件: {file_name}")
    print(f"🏷️  版本: {NEW_VERSION}")
    print(f"📏 大小: {file_size:,} bytes")
    print(f"🔐 SHA512: {sha512[:32]}...")
    if os.path.exists(blockmap_path):
        print(f"🧩 差分: {os.path.basename(blockmap_path)} 已写入")

if __name__ == "__main__":
    generate_update_info()