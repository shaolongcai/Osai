# get_programs.ps1 - 兼容 WinPS 5.1
$ErrorActionPreference = 'SilentlyContinue'

# 1. 经典三大卸载路径
$uninst = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\SOFTWARE\Wow6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*'
)

# 2. App Paths
$appPaths = @(
    'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\*',
    'HKCU:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\*'
)

# 3. Classes
$classes = 'HKLM:\SOFTWARE\Classes\Applications\*'

# 4. Program 目录（补漏绿色/便携软件）
$progDirs = @("$env:ProgramFiles", "${env:ProgramFiles(x86)}") |
            Where-Object { Test-Path $_ }

function Get-AppsFromPath {
    param([string[]]$RegPath, [switch]$ByNameOnly)

    Get-ItemProperty $RegPath |
        Where-Object { $_.'(default)' -and (Test-Path $_.'(default)') -and ($_.'(default)' -match '\.exe$') } |
        ForEach-Object {
            $exe = $_.'(default)'
            # 兼容旧版 PS：不用 ?.
            $name = if ($ByNameOnly) {
                        (Get-Item $exe).VersionInfo.FileDescription
                    } else {
                        $val = $_.PSObject.Properties['DisplayName']
                        if ($val) { $val.Value } else { $null }
                    }
            if (-not $name) { $name = [IO.Path]::GetFileNameWithoutExtension($exe) }

            [PSCustomObject]@{
                DisplayName      = $name
                DisplayVersion   = $_.DisplayVersion
                Publisher        = $_.Publisher
                InstallLocation  = Split-Path -Parent $exe
                DisplayIcon      = $exe
            }
        }
}

# 5. 目录枚举：只找一级子目录下的 exe，避免全盘慢
function Get-AppsFromFolder {
    param([string]$Root)

    Get-ChildItem $Root -Directory |
        ForEach-Object {
            $dir = $_.FullName
            Get-ChildItem $dir -Filter *.exe -File -ErrorAction SilentlyContinue |
                Select-Object -First 1 |
                ForEach-Object {
                    $exe = $_.FullName
                    [PSCustomObject]@{
                        DisplayName      = [IO.Path]::GetFileNameWithoutExtension($exe)
                        DisplayVersion   = $null
                        Publisher        = $null
                        InstallLocation  = $dir
                        DisplayIcon      = $exe
                    }
                }
        }
}

# 汇总 & 去重
$list = @(
    Get-ItemProperty $uninst |
        Where-Object { $_.DisplayName } |
        Select-Object DisplayName, DisplayVersion, Publisher, InstallLocation, DisplayIcon

    Get-AppsFromPath -RegPath $appPaths -ByNameOnly
    Get-AppsFromPath -RegPath $classes  -ByNameOnly

    # 目录补漏
    foreach ($pf in $progDirs) { Get-AppsFromFolder $pf }
) | Sort-Object DisplayName -Unique

$list | ConvertTo-Json -Depth 2 -Compress