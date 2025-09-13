#!/usr/bin/env python3
import sys
import json
import os
import llama_cpp
from llama_cpp.llama_chat_format import Qwen25VLChatHandler
from PIL import Image
import base64
from io import BytesIO
import time
from concurrent.futures import ThreadPoolExecutor

# 设置控制台编码为UTF-8
if sys.platform == 'win32':
    import io
    import codecs
     # 确保输出立即刷新，不使用detach()
    sys.stdout.reconfigure(encoding='utf-8', line_buffering=True)
    sys.stderr.reconfigure(encoding='utf-8', line_buffering=True)
    # 同样为标准输入配置UTF-8编码，以正确处理来自Node.js的中文路径
    sys.stdin.reconfigure(encoding='utf-8')


_model = None
_model_loaded = False
_executor = None

def load_model(model_path, mmproj_path=None):
    """加载视觉模型"""

    global _model, _model_loaded, _executor
   
    if _model_loaded:
        return True

    try:
        has_gpu_support = llama_cpp.llama_supports_gpu_offload()
        
        if has_gpu_support:
            print(json.dumps({"type": "log", "msg": "使用GPU加速模型服务"}))
        else:
            print(json.dumps({"type": "log", "msg": "当前环境不支持GPU加速，将使用CPU运行模型"}))
        if mmproj_path and os.path.exists(mmproj_path):
            # 2. 限制模型使用的CPU线程数为核心数的一半，以降低CPU占用
            n_threads = max(1, os.cpu_count() // 4)
            # 使用多模态投影器
            chat_handler = Qwen25VLChatHandler(clip_model_path=mmproj_path)
            _model = llama_cpp.Llama(
                model_path=model_path,
                chat_handler=chat_handler,
                n_gpu_layers=-1, 
                n_ctx=2048,
                verbose=False,
                n_batch=1024,
                n_threads=n_threads
            )


        # 创建线程池，支持2-3个并发任务
        _executor = ThreadPoolExecutor(max_workers=3, thread_name_prefix="vision_worker")
        _model_loaded = True

        return True
        
    except Exception as e:
        return None, str(e)

def process_single_image( image_path, task_id):
    """处理图片并生成摘要"""
    try:
        # 开始时间
        start_time = time.time()
        
        # 检查图片文件
        if not os.path.exists(image_path):
            return {"success": False,  "errMsg": f"python端：图片文件不存在: {image_path}"}
        
        # 读取并处理图片
        with Image.open(image_path) as img:
            # 转换为RGB格式
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 调整图片大小（可选，减少内存占用）
            max_size = 768
            if max(img.size) > max_size:
                img.thumbnail((max_size, max_size), Image.Resampling.LANCZOS)

             # 将图片转换为base64编码，避免路径问题
            buffer = BytesIO()
            img.save(buffer, format='JPEG',quality=85)
            img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
        
        # 构建消息
        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": '请使用中文摘要这张图片'},
                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_base64}"}}
                ]
            }
        ]
        
        if _model is None:
            return {"success": False,  "type": "error", "errMsg": "模型未初始化"}
        # 生成回复
        response = _model.create_chat_completion(
            messages=messages,
            max_tokens=512,
            temperature=0.7,
            stream=False  # 确保返回完整响应而不是流
        )

        end_time = time.time()
        # 计算耗时
        elapsed_time = end_time - start_time
        
        result = response['choices'][0]['message']['content']
        
        return {
            "task_id": task_id,
            "success": True, 
            "result": result,
            "elapsed_time": elapsed_time
        }
        
    except Exception as e:
        # 统一返回字典格式，包含task_id
        return {
            "task_id": task_id,
            "success": False, 
            "errMsg": str(e)
        }

def main_service():
    """主服务循环"""
    global _model, _model_loaded, _executor
    
    print(json.dumps({"type": "log", "msg": "视觉处理服务已启动，等待初始化命令..."}))
    
    try:
        while True:
            line = sys.stdin.readline().strip()
            if not line:
                continue
                
            try:
                command = json.loads(line)
                cmd_type = command.get('type') # 获取命令
                
                if cmd_type == 'init':
                    # 初始化模型
                    
                    model_path = command.get('model_path')
                    mmproj_path = command.get('mmproj_path')

                    start_time = time.time()
                    success = load_model(model_path, mmproj_path)
                    end_time = time.time()
                    elapsed_time = end_time - start_time
                    
                    if success:
                        print(json.dumps({"type": "init_result", "success": True, "elapsed_time": elapsed_time}))
                    else:
                        print(json.dumps({"type": "init_result", "success": False, "elapsed_time": elapsed_time}))
                        
                elif cmd_type == 'process':
                    # 处理图片请求
                    if not _model_loaded:
                        print(json.dumps({"type": "error", "errMsg": "模型未初始化"}))
                        continue
                    
                    image_path = command.get('image_path')
                    task_id = command.get('task_id', 'unknown')
                    
                    if _executor is None:
                        print(json.dumps({"type": "error", "errMsg": "线程池未初始化"}))
                        continue
                    # 提交到线程池异步处理
                    future = _executor.submit(process_single_image, image_path, task_id)
                    
                    # 立即返回任务已接收的确认
                    print(json.dumps({"type": "task_accepted", "task_id": task_id}))
                    sys.stdout.flush() # 确保立即发送
                    
                    # 在后台处理完成后输出结果
                    # 步骤1: 定义一个工厂函数来创建回调，以正确捕获task_id
                    def create_callback(tid):
                        # 步骤2: 这是真正的回调函数
                        def handle_result(fut):
                            try:
                                # 获取在process_single_image中返回的结果
                                result = fut.result()
                                # 将结果通过标准输出打印
                                print(json.dumps({"type": "result", **result}))
                            except Exception as e:
                                # 如果出现异常，也打印错误信息，并使用正确的task_id
                                print(json.dumps({"type": "result", "task_id": tid, "success": False, "errMsg": str(e)}))
                            finally:
                                # 步骤3: 强制刷新缓冲区，确保Node.js能收到消息
                                sys.stdout.flush()
                        return handle_result
                    
                    future.add_done_callback(create_callback(task_id))
                    
                elif cmd_type == 'shutdown':
                    # 关闭服务
                    if _executor:
                        _executor.shutdown(wait=True)
                    print(json.dumps({"type": "log", "msg": "服务已关闭"}))
                    break
                    
            except json.JSONDecodeError:
                print(json.dumps({"type": "error", "errMsg": "无效的JSON命令"}))
            except Exception as e:
                print(json.dumps({"type": "error", "errMsg": str(e)}))
                
    except KeyboardInterrupt:
        if _executor:
            _executor.shutdown(wait=True)
        print(json.dumps({"type": "log", "msg": "服务被中断"}))

if __name__ == "__main__":
    main_service()