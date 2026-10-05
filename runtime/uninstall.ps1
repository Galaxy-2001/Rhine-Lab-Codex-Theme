$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot 'package-common.ps1')
$stateRoot=Join-Path $env:LOCALAPPDATA 'RhineLabTheme7'
$receiptPath=Join-Path $stateRoot 'installed.json'
if(-not(Test-Path -LiteralPath $receiptPath)){Write-Output '没有找到已安装的莱茵生命主题。';return}
$receipt=Get-Content -LiteralPath $receiptPath -Encoding UTF8 -Raw|ConvertFrom-Json
$engine=Join-Path $stateRoot 'engine';$launcher=Join-Path $engine 'RhineLabTheme.exe'
if($receipt.id -ne 'rhine-lab' -or $receipt.engineRoot -ne $engine){throw '不是本主题的安装记录。'}
Assert-RhinePath $engine $stateRoot
$manifest=Get-Content -LiteralPath (Join-Path $engine 'manifest.json') -Encoding UTF8 -Raw|ConvertFrom-Json
if($manifest.id -ne 'rhine-lab'){throw '安装目录身份不匹配，未删除任何组件。'}
. (Join-Path $PSScriptRoot 'vendor\common-windows.ps1')
$official=Get-DreamSkinCodexInstall
Stop-RhineManager $launcher
# Restore first. If the client cannot close gracefully, leave all installed files in place.
$restore=Start-Process -FilePath 'powershell.exe' -ArgumentList @('-NoProfile','-ExecutionPolicy','RemoteSigned','-File',('"{0}"' -f (Join-Path $engine 'theme.ps1')),'-Action','restore') -WindowStyle Hidden -Wait -PassThru
if($restore.ExitCode -ne 0){throw '恢复尚未完成，主题文件已保留。请完全退出主题客户端后重试；日志在 %LOCALAPPDATA%\RhineLabTheme7\operations-error.log。'}
Stop-RhineEngine $stateRoot
Restore-RhineTaskbar $stateRoot $official (Join-Path $PSScriptRoot 'RhineLabTheme.exe')
Restore-RhineEntries $receipt $stateRoot -IncludeStartMenu
if(-not $receipt.entries){
  $legacyStart=Join-Path ([Environment]::GetFolderPath('StartMenu')) 'Programs\Codex Rhine Lab.lnk'
  if(Test-RhineLink $legacyStart $launcher){Remove-Item -LiteralPath $legacyStart}
}
Remove-RhineTree $engine $stateRoot
Move-Item -LiteralPath $receiptPath -Destination (Join-Path $stateRoot 'uninstalled.json') -Force
Write-Output '主题组件已卸载，官方客户端可正常打开。应用数据、入口备份和可选 Skill 已保留。'
Write-Output '如任务栏仍显示旧图标，可取消固定后重新固定官方客户端。'
