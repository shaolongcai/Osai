import sys
import os
import requests

# 设置控制台编码为UTF-8
if sys.platform == 'win32':
    import io
    import codecs
     # 确保输出立即刷新，不使用detach()
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
    # 同样为标准输入配置UTF-8编码，以正确处理来自Node.js的中文路径
    sys.stdin.reconfigure(encoding='utf-8')

def download_file(url, local_path):
    """下载单个文件"""
    try:
        print(f"开始下载: {os.path.basename(local_path)}")
        response = requests.get(url, stream=True,timeout=30)
        response.raise_for_status()
        
        # 创建目录
        os.makedirs(os.path.dirname(local_path), exist_ok=True)
        
        # 获取文件大小用于显示进度
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        last_progress = -1
        
        with open(local_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    # 每10%显示一次进度，避免乱码
                    if total_size > 0:
                        progress = int((downloaded / total_size) * 100)
                        if progress != last_progress and progress % 10 == 0:
                            print(f"下载进度: {progress}%", flush=True)
                            last_progress = progress
        
        print(f"\n下载完成: {local_path}",flush=True)
        return True
    except Exception as e:
        print(f"\n下载失败: {e}",flush=True)
        return False




def download_model(local_dir):
    """下载模型文件"""
    # ModelScope直链地址
    base_url = "https://modelscope.cn/models/lmstudio-community/Qwen2.5-VL-3B-Instruct-GGUF/resolve/master/"
    
    files = [
        'Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf',
        'mmproj-model-f16.gguf'
    ]
    
    for filename in files:
        url = base_url + filename
        local_path = os.path.join(local_dir, filename)
        
        # 检查文件是否已存在
        if os.path.exists(local_path):
            print(f"文件已存在，跳过下载: {filename}")
            continue
        
        if not download_file(url, local_path):
            print(f"下载失败，停止后续下载")
            return False
    
    print("所有模型文件下载完成！")
    return True

if __name__ == "__main__":
    # 获取模型存储路径
    models_path = sys.argv[1]
    print('模型存储路径:', models_path)
    
    # 开始下载模型
    download_model(models_path)