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


def find_exe_file(version):
    """根据版本号查找匹配的 EXE 文件，如果找不到则回退到任意一个"""
    if not os.path.exists(out_dir):
        print(f"❌ 目录不存在: {out_dir}")
        return None
    
    # 优先查找包含版本号的 EXE 文件
    # 注意：这里的模式可能需要根据你的实际文件名进行调整
    # 例如 "My App Setup 1.2.3.exe"
    exe_pattern = os.path.join(out_dir, f"*{version}*.exe")
    found_files = glob.glob(exe_pattern)
    
    if found_files:
        return found_files[0] # 返回第一个匹配的

    # 如果没找到，回退查找任意 .exe 文件
    print(f"⚠️ 未找到版本为 {version} 的 EXE 文件，将查找任意 EXE 文件。")
    exe_pattern = os.path.join(out_dir, "*.exe")
    found_files = glob.glob(exe_pattern)
    
    if found_files:
        return found_files[0]
        
    return None


def calculate_file_details(file_path):
    """计算文件的 SHA512 和大小"""
    sha512_hash = hashlib.sha512()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            sha512_hash.update(chunk)
    
    sha512 = base64.b64encode(sha512_hash.digest()).decode('utf-8')
    size = os.path.getsize(file_path)
    return sha512, size


def generate_update_info():
    """快速生成更新信息，并自动包含 .blockmap 文件"""
    
    target_file = find_exe_file(NEW_VERSION)
    if not target_file:
        print("❌ 在 'out' 目录中未找到任何 EXE 文件")
        return

    print(f"🔍 找到目标文件: {os.path.basename(target_file)}")

    # 计算主文件的哈希和大小
    print("🔄 计算主文件 SHA512...")
    sha512, file_size = calculate_file_details(target_file)
    file_name = os.path.basename(target_file)
    
    # 准备文件列表
    files_list = [
        {
            "url": file_name,
            "sha512": sha512,
            "size": file_size
        }
    ]
    
    # 检查并处理 .blockmap 文件
    blockmap_file = target_file + '.blockmap'
    if os.path.exists(blockmap_file):
        print("🗺️  找到 .blockmap 文件，正在处理...")
        blockmap_sha512, blockmap_size = calculate_file_details(blockmap_file)
        blockmap_name = os.path.basename(blockmap_file)
        files_list.append({
            "url": blockmap_name,
            "sha512": blockmap_sha512,
            "size": blockmap_size
        })
        print("✅ .blockmap 文件处理完成!")
    else:
        print("⚠️ 未找到 .blockmap 文件，将只包含主文件。")

    # 生成 YAML 文件内容
    files_yml_str = ""
    for f in files_list:
        files_yml_str += f"""
    - url: {f['url']}
      sha512: {f['sha512']}
      size: {f['size']}"""

    current_time = datetime.utcnow().isoformat() + 'Z'
    
    yml_content = f"""version: {NEW_VERSION}
files:{files_yml_str}
path: {file_name}
sha512: {sha512}
releaseDate: '{current_time}'"""
    
    # 写入文件
    yml_path = os.path.join(out_dir, 'latest.yml')
    with open(yml_path, 'w', encoding='utf-8') as f:
        f.write(yml_content)
    
    print("\n✅ 'latest.yml' 生成完成!")
    print(f"🏷️  版本: {NEW_VERSION}")
    print(f"📦 主文件: {file_name} ({file_size:,} bytes)")
    if len(files_list) > 1:
        print(f"🗺️  Blockmap: {files_list[1]['url']} ({files_list[1]['size']:,} bytes)")


if __name__ == "__main__":
    generate_update_info()