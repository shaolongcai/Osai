import sys
from modelscope.hub.snapshot_download import snapshot_download


def download_model(repo_name:str,local_dir: str):
    model_dir = snapshot_download(repo_name,allow_patterns='Qwen2.5-VL-3B-Instruct-Q4_K_M.gguf', local_dir=local_dir)
    mmproj_dir = snapshot_download(repo_name,allow_patterns='mmproj-model-f16.gguf', local_dir=local_dir)




if __name__ == "__main__":
    # 脚本需要两个命令行参数：URL和目标路径
    # if len(sys.argv) != 3:
    #     print("用法: python download.py <URL> <DEST_PATH>", file=sys.stderr)
    #     sys.exit(1)
    
    # 本地模型地址
    
    modles_path = sys.argv[1]
    print('sys.argv',modles_path)
    # 仓库名称
    repo_name = 'lmstudio-community/Qwen2.5-VL-3B-Instruct-GGUF'

    
    download_model(repo_name, modles_path)