#include <napi.h>
#include "../include/icon_extractor.h"
#include <string>
#include <codecvt>
#include <locale>

// 字符串转换辅助函数
std::wstring StringToWString(const std::string& str) {
    std::wstring_convert<std::codecvt_utf8_utf16<wchar_t>> converter;
    return converter.from_bytes(str);
}

// 提取单个图标的Node.js绑定
Napi::Value ExtractIcon(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "Expected string argument").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    std::string filePath = info[0].As<Napi::String>().Utf8Value();
    int size = 256;
    
    if (info.Length() > 1 && info[1].IsNumber()) {
        size = info[1].As<Napi::Number>().Int32Value();
    }
    
    // 调用C++函数
    std::wstring wFilePath = StringToWString(filePath);
    std::vector<BYTE> pngData = IconExtractor::ExtractIconToPNG(wFilePath, size);
    
    if (pngData.empty()) {
        return env.Null();
    }
    
    // 创建Node.js Buffer
    return Napi::Buffer<BYTE>::Copy(env, pngData.data(), pngData.size());
}

// 批量提取图标的Node.js绑定
Napi::Value BatchExtractIcons(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    
    // 参数验证
    if (info.Length() < 1 || !info[0].IsArray()) {
        Napi::TypeError::New(env, "Expected array argument").ThrowAsJavaScriptException();
        return env.Null();
    }
    
    Napi::Array filePathsArray = info[0].As<Napi::Array>();
    int size = 256;
    
    if (info.Length() > 1 && info[1].IsNumber()) {
        size = info[1].As<Napi::Number>().Int32Value();
    }
    
    // 转换文件路径数组
    std::vector<std::wstring> filePaths;
    for (uint32_t i = 0; i < filePathsArray.Length(); i++) {
        Napi::Value element = filePathsArray[i];
        if (element.IsString()) {
            std::string filePath = element.As<Napi::String>().Utf8Value();
            filePaths.push_back(StringToWString(filePath));
        }
    }
    
    // 调用C++函数
    std::vector<std::vector<BYTE>> results = IconExtractor::BatchExtractIcons(filePaths, size);
    
    // 创建结果数组
    Napi::Array resultArray = Napi::Array::New(env, results.size());
    for (size_t i = 0; i < results.size(); i++) {
        if (results[i].empty()) {
            resultArray[i] = env.Null();
        } else {
            resultArray[i] = Napi::Buffer<BYTE>::Copy(env, results[i].data(), results[i].size());
        }
    }
    
    return resultArray;
}

// 模块初始化
Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set(Napi::String::New(env, "extractIcon"), Napi::Function::New(env, ExtractIcon));
    exports.Set(Napi::String::New(env, "batchExtractIcons"), Napi::Function::New(env, BatchExtractIcons));
    return exports;
}

NODE_API_MODULE(icon_extractor, Init)