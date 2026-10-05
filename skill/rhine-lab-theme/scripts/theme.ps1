param([ValidateSet('install','start','enable','disable','motion-on','motion-off','restore','uninstall','status')][string]$Action='start')
$ErrorActionPreference='Stop'
$bundled=Join-Path (Split-Path $PSScriptRoot -Parent) 'assets\runtime'
if($Action -eq 'install'){& (Join-Path $bundled 'install.ps1');return}
if($Action -eq 'uninstall'){& (Join-Path $bundled 'uninstall.ps1');return}
$engine=Join-Path $env:LOCALAPPDATA 'RhineLabTheme7\engine'
if(-not(Test-Path -LiteralPath (Join-Path $engine 'manifest.json'))){throw '请先安装莱茵生命主题。'}
if($Action -in @('start','enable')){
  if($Action -eq 'enable'){
    & (Join-Path $engine 'theme.ps1') -Action enable
    if(-not $?){throw '主题未能启用。'}
  }
  Start-Process -FilePath (Join-Path $engine 'RhineLabTheme.exe') -WindowStyle Hidden
}else{& (Join-Path $engine 'theme.ps1') -Action $Action}
