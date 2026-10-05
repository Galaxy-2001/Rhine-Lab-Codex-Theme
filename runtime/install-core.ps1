function Install-RhinePackage {
param([string]$SourceRoot,[string]$StateRoot,[string]$DesktopDirectory,[string]$StartMenuDirectory,[string]$NodePath,[string]$ConfigPath,[switch]$NoLaunch)
$manifest=Read-RhineManifest $SourceRoot
$engineRoot=Join-Path $stateRoot 'engine';$launcher=Join-Path $engineRoot 'RhineLabTheme.exe'
$receiptPath=Join-Path $stateRoot 'installed.json'
$previous=$null
if(Test-Path -LiteralPath $receiptPath){
  $previous=Get-Content -LiteralPath $receiptPath -Encoding UTF8 -Raw|ConvertFrom-Json
  if($previous.id -ne 'rhine-lab' -or $previous.engineRoot -ne $engineRoot){throw '已有安装目录不属于此主题。'}
}
if(@(Get-CimInstance Win32_Process -Filter "Name = 'RhineLabTheme.exe'"|Where-Object{$_.ExecutablePath -eq $launcher}).Count){throw '请先右击托盘图标，选择“退出主题管理”，再更新安装。当前客户端不会被自动关闭。'}
$desktop=Join-Path $DesktopDirectory '莱茵生命 Codex.lnk'
if($previous.desktopEntry -and (Test-RhineLink $previous.desktopEntry $launcher)){
  if((Get-FileHash -LiteralPath $previous.desktopEntry).Hash -ne $previous.desktopHash){throw '桌面入口已被修改，请先恢复或更名后再安装。'}
  $desktop=$previous.desktopEntry
}
$startEntry=Join-Path $StartMenuDirectory 'Programs\Codex Rhine Lab.lnk'
foreach($path in @($desktop,$startEntry)){
  if((Test-Path -LiteralPath $path) -and -not(Test-RhineLink $path $launcher)){throw ('已有同名快捷方式，已保留：'+$path)}
}
New-Item -ItemType Directory -Path $stateRoot -Force|Out-Null
$token=[Guid]::NewGuid().ToString('N')
$stage=Join-Path $stateRoot ('stage-'+$token)
$backup=Join-Path $stateRoot ('backups\install-'+$token)
Assert-RhinePath $stage $stateRoot;Assert-RhinePath $backup $stateRoot
New-Item -ItemType Directory -Path $backup -Force|Out-Null
$snapshots=@();$index=0
foreach($path in @($desktop,$startEntry,$receiptPath,(Join-Path $stateRoot 'preferences.json'))){
  $exists=Test-Path -LiteralPath $path;$saved=Join-Path $backup ('before-'+$index);$index++
  if($exists){Copy-Item -LiteralPath $path -Destination $saved}
  $snapshots+=@{path=$path;existed=$exists;saved=$saved}
}
$oldEngine=Join-Path $backup 'engine';$swapped=$false;$movedOld=$false
try{
  Copy-RhineRuntime $SourceRoot $stage $stateRoot
  if(Test-Path -LiteralPath $engineRoot){
    Assert-RhinePath $engineRoot $stateRoot;Assert-RhinePath $oldEngine $stateRoot
    $oldManifest=Get-Content -LiteralPath (Join-Path $engineRoot 'manifest.json') -Encoding UTF8 -Raw|ConvertFrom-Json
    if($oldManifest.id -ne 'rhine-lab'){throw '已有目录不是托管主题。'}
    foreach($item in Get-ChildItem -LiteralPath $engineRoot -Recurse -Force){Assert-RhinePath $item.FullName $stateRoot}
    Stop-RhineEngine $stateRoot
    Move-Item -LiteralPath $engineRoot -Destination $oldEngine;$movedOld=$true
  }
  Move-Item -LiteralPath $stage -Destination $engineRoot;$swapped=$true
  $entries=@()
  foreach($item in @(@{path=$desktop;kind='desktop'},@{path=$startEntry;kind='start-menu'})){
    $oldEntry=$null
    if($previous.entries){$oldEntry=@($previous.entries|Where-Object{$_.path -eq $item.path})|Select-Object -First 1}
    $created=$true;$original=$null
    if($oldEntry){$created=[bool]$oldEntry.created;$original=$oldEntry.backup}
    elseif($previous -and $item.kind -eq 'desktop' -and $previous.originalBackup){$created=$false;$original=$previous.originalBackup}
    New-RhineLink $item.path $launcher
    $entries+=@{path=$item.path;kind=$item.kind;created=$created;backup=$original;hash=(Get-FileHash -LiteralPath $item.path).Hash}
  }
  $receipt=@{id='rhine-lab';version=$manifest.version;engineRoot=$engineRoot;desktopEntry=$desktop;desktopHash=(Get-FileHash -LiteralPath $desktop).Hash;entries=$entries;originalBackup=if($previous){$previous.originalBackup}else{$null};officialClientCopyRequired=$false;taskbarAppId='RhineLab.Codex.Theme'}
  Write-RhineJson $receiptPath $receipt
  & $NodePath (Join-Path $engineRoot 'appearance.mjs') apply $ConfigPath $StateRoot
  if($LASTEXITCODE -ne 0){throw '外观配置未能完成；安装已回滚。'}
  $preferencesPath=Join-Path $stateRoot 'preferences.json'
  $preferences=@{enabled=$true;motion=$true;restored=$false}
  if(Test-Path -LiteralPath $preferencesPath){$oldPreferences=Get-Content -LiteralPath $preferencesPath -Encoding UTF8 -Raw|ConvertFrom-Json;$preferences.motion=$oldPreferences.motion}
  Write-RhineJson $preferencesPath $preferences
}catch{
  $failure=$_
  if($swapped -and (Test-Path -LiteralPath (Join-Path $stateRoot 'appearance.json'))){
    try{& $NodePath (Join-Path $engineRoot 'appearance.mjs') restore $ConfigPath $StateRoot}catch{Write-Warning 'Appearance recovery could not finish; component rollback will still run.'}
  }
  foreach($snapshot in $snapshots){if($snapshot.existed){Copy-Item -LiteralPath $snapshot.saved -Destination $snapshot.path -Force}elseif(Test-Path -LiteralPath $snapshot.path){Remove-Item -LiteralPath $snapshot.path}}
  if($swapped){Remove-RhineTree $engineRoot $stateRoot}
  if($movedOld){Assert-RhinePath $oldEngine $stateRoot;Assert-RhinePath $engineRoot $stateRoot;Move-Item -LiteralPath $oldEngine -Destination $engineRoot}
  throw $failure
}finally{if(Test-Path -LiteralPath $stage){Remove-RhineTree $stage $stateRoot}}
Write-Output ('安装完成。桌面入口：'+$desktop)
Write-Output '运行后右击任务栏中的主题图标，选择“固定到任务栏”。'
if(-not $NoLaunch){Start-Process -FilePath $launcher -WindowStyle Hidden}

}
