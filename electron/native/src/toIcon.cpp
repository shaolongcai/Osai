// Windows图标提取模块
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <windows.h>
#include <objbase.h>
#include <shellapi.h>
#include <Shlobj.h>
#include <gdiplus.h>
#include <vector>
#include <string>
#include <node.h>
#include <node_buffer.h>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "shlwapi.lib")

using namespace Gdiplus;

// 从文件路径提取PNG字节数组，失败时返回空数组
std::vector<BYTE> FileToShellPNG(const wchar_t* path, int size = 256) {
    GdiplusStartupInput inp;
    ULONG_PTR tok;
    GdiplusStartup(&tok, &inp, nullptr);
    std::vector<BYTE> png;

    // 方法1: 优先使用 ExtractIconEx 获取高质量图标
    HICON hLargeIcon = nullptr;
    HICON hSmallIcon = nullptr;
    UINT iconCount = ExtractIconExW(path, 0, &hLargeIcon, &hSmallIcon, 1);
    
    if (iconCount > 0) {
        HICON hIconToUse = (size >= 32) ? hLargeIcon : hSmallIcon;
        if (hIconToUse) {
            // 创建高质量位图
            Bitmap* bmp = new Bitmap(size, size, PixelFormat32bppARGB);
            Graphics* g = new Graphics(bmp);
            
            // 设置高质量渲染
            g->SetSmoothingMode(SmoothingModeAntiAlias);
            g->SetInterpolationMode(InterpolationModeHighQualityBicubic);
            g->SetCompositingMode(CompositingModeSourceOver);
            g->Clear(Color(0, 0, 0, 0)); // 透明背景
            
            // 直接绘制图标，保持透明度
            // 使用 DrawIconEx 通过 HDC 绘制，保持透明度
            HDC hdc = g->GetHDC();
            DrawIconEx(hdc, 0, 0, hIconToUse, size, size, 0, nullptr, DI_NORMAL);
            g->ReleaseHDC(hdc);
            
            // 保存为PNG
            IStream* stm = nullptr;
            if (SUCCEEDED(CreateStreamOnHGlobal(nullptr, TRUE, &stm))) {
                CLSID pngClsid;
                CLSIDFromString(L"{557CF406-1A04-11D3-9A73-0000F81EF32E}", &pngClsid);
                
                // 设置高质量编码
                EncoderParameters encoderParams;
                encoderParams.Count = 1;
                encoderParams.Parameter[0].Guid = EncoderQuality;
                encoderParams.Parameter[0].Type = EncoderParameterValueTypeLong;
                encoderParams.Parameter[0].NumberOfValues = 1;
                ULONG quality = 100;
                encoderParams.Parameter[0].Value = &quality;
                
                if (bmp->Save(stm, &pngClsid, &encoderParams) == Ok) {
                    STATSTG stg{};
                    stm->Stat(&stg, STATFLAG_DEFAULT);
                    png.resize(stg.cbSize.LowPart);
                    LARGE_INTEGER li{ 0 };
                    stm->Seek(li, STREAM_SEEK_SET, nullptr);
                    ULONG read;
                    stm->Read(png.data(), stg.cbSize.LowPart, &read);
                }
                stm->Release();
            }
            
            delete g;
            delete bmp;
        }
        
        if (hLargeIcon) DestroyIcon(hLargeIcon);
        if (hSmallIcon) DestroyIcon(hSmallIcon);
    }
    
    // 方法2: 如果ExtractIconEx失败，使用SHGetFileInfo
    if (png.empty()) {
        SHFILEINFOW sfi{};
        DWORD flags = SHGFI_ICON | (size >= 32 ? SHGFI_LARGEICON : SHGFI_SMALLICON);
        if (SHGetFileInfoW(path, 0, &sfi, sizeof(sfi), flags)) {
            if (sfi.hIcon) {
                Bitmap* bmp = new Bitmap(size, size, PixelFormat32bppARGB);
                Graphics* g = new Graphics(bmp);
                
                g->SetSmoothingMode(SmoothingModeAntiAlias);
                g->SetInterpolationMode(InterpolationModeHighQualityBicubic);
                g->SetCompositingMode(CompositingModeSourceOver);
                g->Clear(Color(0, 0, 0, 0));
                
                // 使用 DrawIconEx 通过 HDC 绘制，保持透明度
                HDC hdc = g->GetHDC();
                DrawIconEx(hdc, 0, 0, sfi.hIcon, size, size, 0, nullptr, DI_NORMAL);
                g->ReleaseHDC(hdc);
                
                IStream* stm = nullptr;
                if (SUCCEEDED(CreateStreamOnHGlobal(nullptr, TRUE, &stm))) {
                    CLSID pngClsid;
                    CLSIDFromString(L"{557CF406-1A04-11D3-9A73-0000F81EF32E}", &pngClsid);
                    
                    EncoderParameters encoderParams;
                    encoderParams.Count = 1;
                    encoderParams.Parameter[0].Guid = EncoderQuality;
                    encoderParams.Parameter[0].Type = EncoderParameterValueTypeLong;
                    encoderParams.Parameter[0].NumberOfValues = 1;
                    ULONG quality = 100;
                    encoderParams.Parameter[0].Value = &quality;
                    
                    if (bmp->Save(stm, &pngClsid, &encoderParams) == Ok) {
                        STATSTG stg{};
                        stm->Stat(&stg, STATFLAG_DEFAULT);
                        png.resize(stg.cbSize.LowPart);
                        LARGE_INTEGER li{ 0 };
                        stm->Seek(li, STREAM_SEEK_SET, nullptr);
                        ULONG read;
                        stm->Read(png.data(), stg.cbSize.LowPart, &read);
                    }
                    stm->Release();
                }
                
                delete g;
                delete bmp;
                DestroyIcon(sfi.hIcon);
            }
        }
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