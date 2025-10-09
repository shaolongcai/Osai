import importlib.metadata
import json
import sys
import llama_cpp

def get_build_info():
    """
    获取 llama-cpp-python 的详细版本字符串和系统信息。
    版本字符串通常包含编译时使用的 CUDA 版本。
    """
    # 打印详细的系统和GPU检测信息到错误流，方便调试
    print("--- Llama.cpp System Info ---", file=sys.stderr)
    try:
        llama_cpp.llama_print_system_info()
        print("-----------------------------", file=sys.stderr)
    except Exception as e:
        print(f"Could not print system info: {e}", file=sys.stderr)

    # 准备一个清晰的JSON对象用于主输出
    info = {}
    try:
        # 这是获取编译版本信息的关键
        version_string = importlib.metadata.version('llama-cpp-python')
        info = {
            "status": "success",
            "package": "llama-cpp-python",
            "version_string": version_string
        }

    except importlib.metadata.PackageNotFoundError:
        info = {
            "status": "error",
            "message": "Package 'llama-cpp-python' not found."
        }

    # 将最终的JSON结果打印到标准输出
    print(json.dumps(info, indent=2))


if __name__ == "__main__":
    get_build_info()