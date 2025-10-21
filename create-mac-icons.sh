# 创建临时目录
mkdir icon.iconset

# 复制并重命名不同尺寸的图标
sips -z 16 16 electron/resources/assets/icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32 electron/resources/assets/icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32 electron/resources/assets/icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64 electron/resources/assets/icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128 electron/resources/assets/icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256 electron/resources/assets/icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256 electron/resources/assets/icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512 electron/resources/assets/icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512 electron/resources/assets/icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 electron/resources/assets/icon.png --out icon.iconset/icon_512x512@2x.png

# 生成 .icns 文件
iconutil -c icns icon.iconset

# 移动到正确位置
mv icon.icns electron/assets/

# 清理临时文件
rm -rf icon.iconset