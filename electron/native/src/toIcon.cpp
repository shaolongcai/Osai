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
#include <memory>
#include <node.h>
#include <node_buffer.h>
#include <commoncontrols.h>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "ole32.lib")
#pragma comment(lib, "shlwapi.lib")
#pragma comment(lib, "comctl32.lib") // For IImageList

using namespace Gdiplus;

// Helper function to convert HICON to PNG bytes
std::vector<BYTE> ConvertHIconToPng(HICON hIcon, int size) {
    std::vector<BYTE> pngData;
    
    // Create a high-quality bitmap
    Bitmap* bmp = new Bitmap(size, size, PixelFormat32bppARGB);
    Graphics* g = new Graphics(bmp);

    // Set high-quality rendering options
    g->SetSmoothingMode(SmoothingModeAntiAlias);
    g->SetInterpolationMode(InterpolationModeHighQualityBicubic);
    g->SetPixelOffsetMode(PixelOffsetModeHighQuality);
    g->SetCompositingMode(CompositingModeSourceOver);
    g->SetCompositingQuality(CompositingQualityHighQuality);
    g->Clear(Color(0, 0, 0, 0)); // Use a transparent white background

    // Use DrawIconEx for robust icon drawing with transparency
    HDC hdc = g->GetHDC();
    if (hdc) {
        DrawIconEx(hdc, 0, 0, hIcon, size, size, 0, NULL, DI_NORMAL);
        g->ReleaseHDC(hdc);
    }

    // Save the bitmap to a PNG stream
    IStream* stm = nullptr;
    if (SUCCEEDED(CreateStreamOnHGlobal(nullptr, TRUE, &stm))) {
        CLSID pngClsid;
        CLSIDFromString(L"{557CF406-1A04-11D3-9A73-0000F81EF32E}", &pngClsid);
        
        if (bmp->Save(stm, &pngClsid, nullptr) == Ok) {
            STATSTG stg{};
            stm->Stat(&stg, STATFLAG_DEFAULT);
            pngData.resize(stg.cbSize.LowPart);
            LARGE_INTEGER li{ 0 };
            stm->Seek(li, STREAM_SEEK_SET, nullptr);
            ULONG read;
            stm->Read(pngData.data(), stg.cbSize.LowPart, &read);
        }
        stm->Release();
    }

    delete g;
    delete bmp;
    return pngData;
}

// Extracts an icon from a file path and returns it as PNG bytes. Returns an empty vector on failure.
std::vector<BYTE> FileToShellPNG(const wchar_t* path, int size = 256) {
    GdiplusStartupInput inp;
    ULONG_PTR tok;
    GdiplusStartup(&tok, &inp, nullptr);
    
    std::vector<BYTE> png;
    HICON hIcon = nullptr;

    // Method 1: Use SHGetImageList (user's suggestion) for the highest quality icons.
    SHFILEINFOW sfi;
    if (SHGetFileInfoW(path, FILE_ATTRIBUTE_NORMAL, &sfi, sizeof(sfi), SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES)) {
        IImageList* piml = nullptr;
        int imageLists[] = { SHIL_JUMBO, SHIL_EXTRALARGE, SHIL_LARGE }; // Try from largest to smallest
        for (int listType : imageLists) {
            if (SUCCEEDED(SHGetImageList(listType, IID_PPV_ARGS(&piml))) && piml) {
                if (SUCCEEDED(piml->GetIcon(sfi.iIcon, ILD_TRANSPARENT, &hIcon)) && hIcon) {
                    piml->Release();
                    break; // Icon found, break the loop
                }
                piml->Release();
            }
        }
    }

    if (hIcon) {
        png = ConvertHIconToPng(hIcon, size);
        DestroyIcon(hIcon);
    }

    // Method 2: Fallback to ExtractIconEx if the first method fails.
    if (png.empty()) {
        HICON hLargeIcon = nullptr;
        HICON hSmallIcon = nullptr;
        if (ExtractIconExW(path, 0, &hLargeIcon, &hSmallIcon, 1) > 0) {
            HICON hIconToUse = (size >= 32 && hLargeIcon) ? hLargeIcon : hSmallIcon;
            if (hIconToUse) {
                png = ConvertHIconToPng(hIconToUse, size);
            }
            if (hLargeIcon) DestroyIcon(hLargeIcon);
            if (hSmallIcon) DestroyIcon(hSmallIcon);
        }
    }

    // Method 3: Final fallback to the basic SHGetFileInfo.
    if (png.empty()) {
        SHFILEINFOW sfiFallback{};
        DWORD flags = SHGFI_ICON | (size >= 32 ? SHGFI_LARGEICON : SHGFI_SMALLICON);
        if (SHGetFileInfoW(path, 0, &sfiFallback, sizeof(sfiFallback), flags)) {
            if (sfiFallback.hIcon) {
                png = ConvertHIconToPng(sfiFallback.hIcon, size);
                DestroyIcon(sfiFallback.hIcon);
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