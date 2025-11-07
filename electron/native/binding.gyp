{
  "targets": [
    {
      "target_name": "icon_extractor",
      "sources": [
        "src/toIcon.cpp",
      ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "libraries": [
        "gdiplus.lib",
        "shell32.lib",
        "ole32.lib"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "AdditionalOptions": ["/utf-8"]
        }
      }
    }
  ]
}