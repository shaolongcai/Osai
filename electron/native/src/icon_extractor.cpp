#include "../include/icon_extractor.h"
#include <Shlobj.h>
#include <shellapi.h>
#include <memory>

#pragma comment(lib, "shlwapi.lib")

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
        // 方法1: 优先使用 SHIL_EXTRALARGE (256x256) 获取高质量图标
        SHFILEINFOW sfi = {};
        if (SHGetFileInfoW(filePath.c_str(), 0, &sfi, sizeof(sfi), SHGFI_SYSICONINDEX | SHGFI_USEFILEATTRIBUTES)) {
            HICON hIcon = nullptr;

            // 按优先级尝试不同的图像列表：EXTRALARGE -> JUMBO -> LARGE -> SMALL
            int imageLists[] = { SHIL_JUMBO,SHIL_EXTRALARGE, SHIL_LARGE, SHIL_SMALL };
            IImageList* pImageList = nullptr;
            
            for (int listType : imageLists) {
                if (SUCCEEDED(SHGetImageList(listType, IID_IImageList, reinterpret_cast<void**>(&pImageList))) && pImageList) {
                    if (SUCCEEDED(pImageList->GetIcon(sfi.iIcon, ILD_TRANSPARENT | ILD_IMAGE, &hIcon)) && hIcon) {
                        pngData = ConvertIconToPNG(hIcon, size);
                        DestroyIcon(hIcon);
                        pImageList->Release();
                        break;
                    }
                    pImageList->Release();
                }
            }
        }

        // 方法2: 如果系统图像列表失败，尝试 ExtractIconEx
        if (pngData.empty()) {
            HICON hLargeIcon = nullptr;
            HICON hSmallIcon = nullptr;
            UINT iconCount = ExtractIconExW(filePath.c_str(), 0, &hLargeIcon, &hSmallIcon, 1);
            
            if (iconCount > 0) {
                HICON hIconToUse = (size >= 32) ? hLargeIcon : hSmallIcon;
                if (hIconToUse) {
                    pngData = ConvertIconToPNG(hIconToUse, size);
                }
                
                if (hLargeIcon) DestroyIcon(hLargeIcon);
                if (hSmallIcon) DestroyIcon(hSmallIcon);
            }
        }

        // 方法3: 最后回退到 SHGetFileInfo
        if (pngData.empty()) {
            SHFILEINFOW sfiFallback = {};
            DWORD flags = SHGFI_ICON | (size >= 32 ? SHGFI_LARGEICON : SHGFI_SMALLICON);
            if (SHGetFileInfoW(filePath.c_str(), 0, &sfiFallback, sizeof(sfiFallback), flags)) {
                if (sfiFallback.hIcon) {
                    pngData = ConvertIconToPNG(sfiFallback.hIcon, size);
                    DestroyIcon(sfiFallback.hIcon);
                }
            }
        }
    } catch (...) {
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
        // 获取图标的实际尺寸
        ICONINFO iconInfo = {};
        if (!GetIconInfo(hIcon, &iconInfo)) {
            return pngData;
        }

        // 获取图标位图信息
        BITMAP bmpInfo = {};
        if (iconInfo.hbmColor) {
            GetObject(iconInfo.hbmColor, sizeof(BITMAP), &bmpInfo);
            DeleteObject(iconInfo.hbmColor);
        }
        if (iconInfo.hbmMask) {
            DeleteObject(iconInfo.hbmMask);
        }

        // 创建目标位图，使用32位带alpha通道格式
        std::unique_ptr<Bitmap> dest(new Bitmap(size, size, PixelFormat32bppARGB));
        std::unique_ptr<Graphics> g(new Graphics(dest.get()));
        
        // 设置高质量渲染参数
        g->SetSmoothingMode(SmoothingModeAntiAlias);
        g->SetInterpolationMode(InterpolationModeHighQualityBicubic);
        g->SetPixelOffsetMode(PixelOffsetModeHighQuality);
        g->SetCompositingMode(CompositingModeSourceOver);
        g->SetCompositingQuality(CompositingQualityHighQuality);

        // 清除背景为完全透明
        g->Clear(Color(255, 255, 255, 0));

        // 如果图标尺寸与目标尺寸不同，使用高质量缩放
        if (bmpInfo.bmWidth != size || bmpInfo.bmHeight != size) {
            // 使用 DrawImage 进行高质量缩放
            std::unique_ptr<Bitmap> iconBitmap(Bitmap::FromHICON(hIcon));
            if (iconBitmap) {
                g->DrawImage(iconBitmap.get(), Rect(0, 0, size, size), 0, 0, iconBitmap->GetWidth(), iconBitmap->GetHeight(), UnitPixel);
            }
        } else {
            // 尺寸相同，直接绘制
            HDC hdc = g->GetHDC();
            DrawIconEx(hdc, 0, 0, hIcon, size, size, 0, nullptr, DI_NORMAL);
            g->ReleaseHDC(hdc);
        }

        // 保存为 PNG
        IStream* stream = nullptr;
        if (SUCCEEDED(CreateStreamOnHGlobal(nullptr, TRUE, &stream))) {
            CLSID pngClsid;
            CLSIDFromString(L"{557CF406-1A04-11D3-9A73-0000F81EF32E}", &pngClsid);
            
            // 设置编码参数以获得最佳质量
            EncoderParameters encoderParams;
            encoderParams.Count = 1;
            encoderParams.Parameter[0].Guid = EncoderQuality;
            encoderParams.Parameter[0].Type = EncoderParameterValueTypeLong;
            encoderParams.Parameter[0].NumberOfValues = 1;
            ULONG quality = 100;
            encoderParams.Parameter[0].Value = &quality;

            if (dest->Save(stream, &pngClsid, &encoderParams) == Ok) {
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
    } catch (...) {
        pngData.clear();
    }
    return pngData;
}