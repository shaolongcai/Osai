#include "../include/icon_extractor.h"
#include <memory>

using namespace Gdiplus;

// 静态变量用于GDI+管理
static ULONG_PTR g_gdiplusToken = 0;
static bool g_gdiplusInitialized = false;

bool IconExtractor::InitializeGdiPlus() {
    if (g_gdiplusInitialized) {
        return true;
    }
    
    GdiplusStartupInput gdiplusStartupInput;
    Status status = GdiplusStartup(&g_gdiplusToken, &gdiplusStartupInput, nullptr);
    g_gdiplusInitialized = (status == Ok);
    return g_gdiplusInitialized;
}

void IconExtractor::ShutdownGdiPlus() {
    if (g_gdiplusInitialized) {
        GdiplusShutdown(g_gdiplusToken);
        g_gdiplusInitialized = false;
    }
}

std::vector<BYTE> IconExtractor::ExtractIconToPNG(const std::wstring& filePath, int size) {
    if (!InitializeGdiPlus()) {
        return {};
    }

    std::vector<BYTE> pngData;
    
    try {
        SHFILEINFOW sfi = {};
        DWORD flags = SHGFI_ICON | (size > 32 ? SHGFI_LARGEICON : SHGFI_SMALLICON);
        
        if (SHGetFileInfoW(filePath.c_str(), 0, &sfi, sizeof(sfi), flags)) {
            if (sfi.hIcon) {
                pngData = ConvertIconToPNG(sfi.hIcon, size);
                DestroyIcon(sfi.hIcon);
            }
        }
    }
    catch (...) {
        // 异常处理
    }
    
    return pngData;
}

std::vector<std::vector<BYTE>> IconExtractor::BatchExtractIcons(
    const std::vector<std::wstring>& filePaths, 
    int size) {
    
    std::vector<std::vector<BYTE>> results;
    results.reserve(filePaths.size());
    
    for (const auto& filePath : filePaths) {
        results.push_back(ExtractIconToPNG(filePath, size));
    }
    
    return results;
}

std::vector<BYTE> IconExtractor::ConvertIconToPNG(HICON hIcon, int size) {
    std::vector<BYTE> pngData;
    
    try {
        // 创建位图
        std::unique_ptr<Bitmap> bitmap(new Bitmap(size, size, PixelFormat32bppARGB));
        std::unique_ptr<Graphics> graphics(new Graphics(bitmap.get()));
        
        // 获取图标信息
        ICONINFO iconInfo;
        if (GetIconInfo(hIcon, &iconInfo)) {
            // 创建图标位图
            std::unique_ptr<Bitmap> iconBitmap(new Bitmap(iconInfo.hbmColor, nullptr));
            
            // 绘制图标
            graphics->SetInterpolationMode(InterpolationModeHighQualityBicubic);
            graphics->DrawImage(iconBitmap.get(), 0, 0, size, size);
            
            // 清理资源
            DeleteObject(iconInfo.hbmColor);
            DeleteObject(iconInfo.hbmMask);
        }
        
        // 保存为PNG
        IStream* stream = nullptr;
        if (SUCCEEDED(CreateStreamOnHGlobal(nullptr, TRUE, &stream))) {
            CLSID pngClsid;
            CLSIDFromString(L"{557CF406-1A04-11D3-9A73-0000F81EF32E}", &pngClsid);
            
            if (bitmap->Save(stream, &pngClsid, nullptr) == Ok) {
                // 获取数据
                STATSTG statstg;
                if (SUCCEEDED(stream->Stat(&statstg, STATFLAG_DEFAULT))) {
                    pngData.resize(statstg.cbSize.LowPart);
                    
                    LARGE_INTEGER li = {0};
                    stream->Seek(li, STREAM_SEEK_SET, nullptr);
                    
                    ULONG bytesRead;
                    stream->Read(pngData.data(), statstg.cbSize.LowPart, &bytesRead);
                }
            }
            
            stream->Release();
        }
    }
    catch (...) {
        pngData.clear();
    }
    
    return pngData;
}