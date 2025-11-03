// Windows图标提取模块
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <windows.h>
#include <objbase.h>
#include <shellapi.h>
#include <gdiplus.h>
#include <vector>
#include <string>
#include <node.h>
#include <node_buffer.h>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "ole32.lib")

using namespace Gdiplus;

// 从文件路径提取PNG字节数组，失败时返回空数组
std::vector<BYTE> FileToShellPNG(const wchar_t* path, int size = 256) {
    GdiplusStartupInput inp;
    ULONG_PTR tok;
    GdiplusStartup(&tok, &inp, nullptr);
    std::vector<BYTE> png;

    SHFILEINFOW sfi{};
    // 获取高质量图标: SHGFI_ICON + SHGFI_LARGEICON
    SHGetFileInfoW(path, 0, &sfi, sizeof(sfi),
                   SHGFI_ICON | (size > 32 ? SHGFI_LARGEICON : SHGFI_SMALLICON));
    if (sfi.hIcon) {
        Bitmap bmp(size, size);
        Graphics g(&bmp);
        
        // 将HICON转换为Bitmap并绘制
        ICONINFO iconInfo;
        GetIconInfo(sfi.hIcon, &iconInfo);
        Bitmap iconBmp(iconInfo.hbmColor, nullptr);
        g.DrawImage(&iconBmp, 0, 0, size, size);
        
        // 保存到PNG内存流
        IStream* stm = nullptr;
        CreateStreamOnHGlobal(nullptr, TRUE, &stm);
        CLSID pngClsid;
        CLSIDFromString(L"{557CF406-1A04-11D3-9A73-0000F81EF32E}", &pngClsid);
        bmp.Save(stm, &pngClsid, nullptr);
        
        STATSTG stg{};
        stm->Stat(&stg, STATFLAG_DEFAULT);
        png.resize(stg.cbSize.LowPart);
        LARGE_INTEGER li{ 0 };
        stm->Seek(li, STREAM_SEEK_SET, nullptr);
        ULONG read;
        stm->Read(png.data(), stg.cbSize.LowPart, &read);
        stm->Release();
        
        DeleteObject(iconInfo.hbmColor);
        DeleteObject(iconInfo.hbmMask);
        DestroyIcon(sfi.hIcon);
    }
    GdiplusShutdown(tok);
    return png;
}

// Node.js 绑定函数
void ExtractIcon(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    
    if (args.Length() < 1 || !args[0]->IsString()) {
        isolate->ThrowException(v8::Exception::TypeError(
            v8::String::NewFromUtf8(isolate, "Expected string argument").ToLocalChecked()));
        return;
    }
    
    v8::String::Utf8Value filePath(isolate, args[0]);
    int size = 256;
    
    if (args.Length() > 1 && args[1]->IsNumber()) {
        size = args[1]->Int32Value(context).FromJust();
    }
    
    // 转换为宽字符
    int wideSize = MultiByteToWideChar(CP_UTF8, 0, *filePath, -1, nullptr, 0);
    std::vector<wchar_t> widePath(wideSize);
    MultiByteToWideChar(CP_UTF8, 0, *filePath, -1, widePath.data(), wideSize);
    
    // 提取图标
    std::vector<BYTE> pngData = FileToShellPNG(widePath.data(), size);
    
    if (pngData.empty()) {
        args.GetReturnValue().SetNull();
        return;
    }
    
    // 创建Buffer
    v8::Local<v8::Object> buffer = node::Buffer::Copy(isolate, 
        reinterpret_cast<const char*>(pngData.data()), pngData.size()).ToLocalChecked();
    args.GetReturnValue().Set(buffer);
}

// 批量提取图标
void BatchExtractIcons(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    
    if (args.Length() < 1 || !args[0]->IsArray()) {
        isolate->ThrowException(v8::Exception::TypeError(
            v8::String::NewFromUtf8(isolate, "Expected array argument").ToLocalChecked()));
        return;
    }
    
    v8::Local<v8::Array> filePathsArray = v8::Local<v8::Array>::Cast(args[0]);
    int size = 256;
    
    if (args.Length() > 1 && args[1]->IsNumber()) {
        size = args[1]->Int32Value(context).FromJust();
    }
    
    uint32_t length = filePathsArray->Length();
    v8::Local<v8::Array> resultArray = v8::Array::New(isolate, length);
    
    for (uint32_t i = 0; i < length; i++) {
        v8::Local<v8::Value> element = filePathsArray->Get(context, i).ToLocalChecked();
        
        if (element->IsString()) {
            v8::String::Utf8Value filePath(isolate, element);
            
            // 转换为宽字符
            int wideSize = MultiByteToWideChar(CP_UTF8, 0, *filePath, -1, nullptr, 0);
            std::vector<wchar_t> widePath(wideSize);
            MultiByteToWideChar(CP_UTF8, 0, *filePath, -1, widePath.data(), wideSize);
            
            // 提取图标
            std::vector<BYTE> pngData = FileToShellPNG(widePath.data(), size);
            
            if (pngData.empty()) {
                resultArray->Set(context, i, v8::Null(isolate)).Check();
            } else {
                v8::Local<v8::Object> buffer = node::Buffer::Copy(isolate, 
                    reinterpret_cast<const char*>(pngData.data()), pngData.size()).ToLocalChecked();
                resultArray->Set(context, i, buffer).Check();
            }
        } else {
            resultArray->Set(context, i, v8::Null(isolate)).Check();
        }
    }
    
    args.GetReturnValue().Set(resultArray);
}

// 模块初始化
void Initialize(v8::Local<v8::Object> exports) {
    NODE_SET_METHOD(exports, "extractIcon", ExtractIcon);
    NODE_SET_METHOD(exports, "batchExtractIcons", BatchExtractIcons);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)