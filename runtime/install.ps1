param([switch]$NoLaunch,[switch]$CheckOnly)
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'package-common.ps1')
$manifest=Read-RhineManifest $PSScriptRoot
if(-not(Get-Command node -ErrorAction SilentlyContinue)){throw '请先从 https://nodejs.org/en/download 安装 Node.js 22 或更新版本，再重新安装主题。'}
$nodeMajor=[int]((& node --version).TrimStart('v').Split('.')[0])
if($nodeMajor -lt 22){throw '需要 Node.js 22 或更新版本。'}
. (Join-Path $PSScriptRoot 'vendor\common-windows.ps1')
$official=Get-DreamSkinCodexInstall
if($CheckOnly){Write-Output ('检查通过：资源完整，Node.js '+$nodeMajor+'，官方客户端 '+$official.Version);return}
if(-not $NoLaunch -and @(Get-DreamSkinCodexProcesses -Codex $official).Count -gt 0 -and $null -eq (Get-DreamSkinVerifiedCdpIdentity -Port 9436 -Codex $official)){throw '请先完全退出普通官方客户端，再安装主题。当前窗口不会被自动关闭。'}
. (Join-Path $PSScriptRoot 'install-core.ps1')
$codexRoot=if($env:CODEX_HOME){$env:CODEX_HOME}else{Join-Path $env:USERPROFILE '.codex'}
Install-RhinePackage -SourceRoot $PSScriptRoot -StateRoot (Join-Path $env:LOCALAPPDATA 'RhineLabTheme7') -DesktopDirectory ([Environment]::GetFolderPath('DesktopDirectory')) -StartMenuDirectory ([Environment]::GetFolderPath('StartMenu')) -NodePath (Get-Command node).Source -ConfigPath (Join-Path $codexRoot 'config.toml') -NoLaunch:$NoLaunch
