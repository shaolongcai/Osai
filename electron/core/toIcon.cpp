// file_shell_icon.cpp
#include <windows.h>
#include <shellapi.h>
#include <gdiplus.h>
#include <vector>
#include <string>
#include <node.h>
#include <node_buffer.h>
#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "shell32.lib")

using namespace Gdiplus;

// Extract PNG bytes from file path, return empty vector if failed
std::vector<BYTE> FileToShellPNG(const wchar_t* path, int size = 256) {
    GdiplusStartupInput inp;
    ULONG_PTR tok;
    GdiplusStartup(&tok, &inp, nullptr);
    std::vector<BYTE> png;

    SHFILEINFOW sfi{};
    // Get high quality icon: SHGFI_ICON + SHGFI_LARGEICON
    SHGetFileInfoW(path, 0, &sfi, sizeof(sfi),
                   SHGFI_ICON | (size > 32 ? SHGFI_LARGEICON : SHGFI_SMALLICON));
    if (sfi.hIcon) {
        Bitmap bmp(size, size);
        Graphics g(&bmp);
        
        // Convert HICON to Bitmap and draw
        ICONINFO iconInfo;
        GetIconInfo(sfi.hIcon, &iconInfo);
        Bitmap iconBmp(iconInfo.hbmColor, nullptr);
        g.DrawImage(&iconBmp, 0, 0, size, size);
        
        // Save to PNG memory stream
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

// Node.js addon wrapper
void ExtractIcon(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    
    // Parameter validation
    if (args.Length() < 1 || !args[0]->IsString()) {
        v8::Local<v8::String> errorMsg = v8::String::NewFromUtf8(isolate, "Invalid arguments: file path required").ToLocalChecked();
        isolate->ThrowException(v8::Exception::TypeError(errorMsg));
        return;
    }
    
    // Get file path
    v8::String::Utf8Value path(isolate, args[0]);
    std::wstring wpath;
    int len = MultiByteToWideChar(CP_UTF8, 0, *path, -1, nullptr, 0);
    wpath.resize(len - 1);
    MultiByteToWideChar(CP_UTF8, 0, *path, -1, &wpath[0], len);
    
    // Get icon size (optional parameter)
    int size = 256;
    if (args.Length() > 1 && args[1]->IsNumber()) {
        size = args[1]->Int32Value(context).FromMaybe(256);
    }
    
    // Extract icon
    std::vector<BYTE> pngData = FileToShellPNG(wpath.c_str(), size);
    
    if (pngData.empty()) {
        // Return null on failure
        args.GetReturnValue().Set(v8::Null(isolate));
        return;
    }
    
    // Create Buffer to return PNG data
    v8::Local<v8::Object> buffer = node::Buffer::Copy(isolate, 
        reinterpret_cast<const char*>(pngData.data()), pngData.size()).ToLocalChecked();
    args.GetReturnValue().Set(buffer);
}

// Batch extract icons
void BatchExtractIcons(const v8::FunctionCallbackInfo<v8::Value>& args) {
    v8::Isolate* isolate = args.GetIsolate();
    v8::Local<v8::Context> context = isolate->GetCurrentContext();
    
    // Parameter validation
    if (args.Length() < 1 || !args[0]->IsArray()) {
        v8::Local<v8::String> errorMsg = v8::String::NewFromUtf8(isolate, "Invalid arguments: file path array required").ToLocalChecked();
        isolate->ThrowException(v8::Exception::TypeError(errorMsg));
        return;
    }
    
    v8::Local<v8::Array> pathArray = v8::Local<v8::Array>::Cast(args[0]);
    uint32_t length = pathArray->Length();
    
    // Get icon size (optional parameter)
    int size = 256;
    if (args.Length() > 1 && args[1]->IsNumber()) {
        size = args[1]->Int32Value(context).FromMaybe(256);
    }
    
    // Create result array
    v8::Local<v8::Array> result = v8::Array::New(isolate, length);
    
    for (uint32_t i = 0; i < length; i++) {
        v8::Local<v8::Value> pathValue = pathArray->Get(context, i).ToLocalChecked();
        
        if (!pathValue->IsString()) {
            result->Set(context, i, v8::Null(isolate));
            continue;
        }
        
        // Convert path
        v8::String::Utf8Value path(isolate, pathValue);
        std::wstring wpath;
        int len = MultiByteToWideChar(CP_UTF8, 0, *path, -1, nullptr, 0);
        wpath.resize(len - 1);
        MultiByteToWideChar(CP_UTF8, 0, *path, -1, &wpath[0], len);
        
        // Extract icon
        std::vector<BYTE> pngData = FileToShellPNG(wpath.c_str(), size);
        
        if (pngData.empty()) {
            result->Set(context, i, v8::Null(isolate));
        } else {
            v8::Local<v8::Object> buffer = node::Buffer::Copy(isolate, 
                reinterpret_cast<const char*>(pngData.data()), pngData.size()).ToLocalChecked();
            result->Set(context, i, buffer);
        }
    }
    
    args.GetReturnValue().Set(result);
}

// Module initialization
void Initialize(v8::Local<v8::Object> exports) {
    NODE_SET_METHOD(exports, "extractIcon", ExtractIcon);
    NODE_SET_METHOD(exports, "batchExtractIcons", BatchExtractIcons);
}

NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)