{
  "targets": [
    {
      "target_name": "toIcon",
      "sources": [
        "toIcon.cpp"
      ],
      "include_dirs": [
        "<!(node -e \"console.log(require('node-addon-api').include)\")"
      ],
      "libraries": [
        "gdiplus.lib",
        "shell32.lib"
      ],
      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      }
    }
  ]
}