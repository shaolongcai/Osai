import llama_cpp
import sys

def check_gpu_support():
    """
    检查当前安装的 llama-cpp-python 是否支持GPU（CUDA）。
    """
    try:
        # llama_supports_gpu_offload() 是一个直接的判断函数
        has_gpu_support = llama_cpp.llama_supports_gpu_offload()
        
        if has_gpu_support:
            print("✅ 恭喜！您安装的 llama-cpp-python 是支持 GPU (CUDA) 的版本。")
            print("   当您在代码中设置 n_gpu_layers > 0 时，它将尝试使用GPU进行加速。")
        else:
            print("❌ 您当前安装的 llama-cpp-python 是仅支持 CPU 的版本。")
            print("   若要启用GPU支持，请确保已安装NVIDIA CUDA Toolkit，并使用正确的环境变量重新编译安装。")

    except AttributeError:
        print("⚠️ 无法找到检查函数。您可能安装了一个较旧的版本。")
        print("   请尝试更新到最新版的 llama-cpp-python。")
    except Exception as e:
        print(f"检查过程中发生未知错误: {e}")

if __name__ == "__main__":
    # 确保Python版本符合要求
    if sys.version_info < (3, 8):
        print("错误：此脚本需要 Python 3.8 或更高版本。")
    else:
        check_gpu_support()