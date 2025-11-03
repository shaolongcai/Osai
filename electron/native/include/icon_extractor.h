#pragma once

#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif

#include <windows.h>
#include <objbase.h>
#include <combaseapi.h>
#include <shellapi.h>
#include <gdiplus.h>
#include <vector>
#include <string>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "shell32.lib")
#pragma comment(lib, "ole32.lib")

/**
 * 图标提取器类
 * 负责从文件中提取图标并转换为PNG格式
 */
class IconExtractor {
public:
    /**
     * 从文件路径提取图标并转换为PNG字节数组
     * @param filePath 文件路径
     * @param size 图标大小 (默认256x256)
     * @return PNG字节数组，失败时返回空数组
     */
    static std::vector<BYTE> ExtractIconToPNG(const std::wstring& filePath, int size = 256);

    /**
     * 批量提取图标
     * @param filePaths 文件路径数组
     * @param size 图标大小
     * @return PNG字节数组的数组
     */
    static std::vector<std::vector<BYTE>> BatchExtractIcons(
        const std::vector<std::wstring>& filePaths, 
        int size = 256
    );

private:
    /**
     * 初始化GDI+
     */
    static bool InitializeGdiPlus();
    
    /**
     * 清理GDI+
     */
    static void ShutdownGdiPlus();
    
    /**
     * 将HICON转换为PNG字节数组
     */
    static std::vector<BYTE> ConvertIconToPNG(HICON hIcon, int size);
};