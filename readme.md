


# 打包注意

需放在 extraResources的数组中

## windows端

```
{
"from": "dist-electron/resources/Ollama",
"to": "Ollama",
"filter": [
    "**/*",
    "!cuda_v12/**/*",
    "!**/cuda_v12/**"
]
},
```

## MAC端
```
{
        "from": "dist-electron/resources/",
        "to": "ollama"
      },
      ```