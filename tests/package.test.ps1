$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
function Assert-True($Value,[string]$Message){if(-not $Value){throw $Message}}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$checks=Join-Path $root '.checks';New-Item -ItemType Directory -Path $checks -Force|Out-Null
$fixture=Join-Path $checks ('package-'+[Guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Path $fixture|Out-Null
$zip=Join-Path $root 'dist\Rhine-Lab-Codex-Theme-1.0.0-Windows.zip'
[IO.Compression.ZipFile]::ExtractToDirectory($zip,(Join-Path $fixture 'extracted'))
$source=Join-Path $fixture 'extracted\Rhine-Lab-Codex-Theme\runtime'
. (Join-Path $source 'package-common.ps1')
$manifest=Read-RhineManifest $source
$state=Join-Path $fixture 'state';$engine=Join-Path $state 'engine'
Copy-RhineRuntime $source $engine $state
Assert-True ((Read-RhineManifest $engine).files.Count -eq $manifest.files.Count) 'Runtime copy incomplete.'
$launcher=Join-Path $engine 'RhineLabTheme.exe'
$desktop=Join-Path $fixture 'desktop\Theme.lnk';$start=Join-Path $fixture 'start\Theme.lnk'
New-RhineLink $desktop $launcher;New-RhineLink $start $launcher
Assert-True ((Get-RhineLink $desktop).icon -eq (Join-Path $engine 'assets\codex-white.ico,0')) 'White icon was not assigned.'
$receipt=@{entries=@(@{path=$desktop;kind='desktop';created=$true;hash=(Get-FileHash -LiteralPath $desktop).Hash},@{path=$start;kind='start-menu';created=$true;hash=(Get-FileHash -LiteralPath $start).Hash})}
Restore-RhineEntries $receipt $state
Assert-True (-not(Test-Path -LiteralPath $desktop)) 'Created desktop entry was not removed.'
Assert-True (Test-Path -LiteralPath $start) 'Normal restore should retain the start menu control entry.'
Restore-RhineEntries $receipt $state -IncludeStartMenu
Assert-True (-not(Test-Path -LiteralPath $start)) 'Uninstall did not remove the owned start menu entry.'
$wsh=New-Object -ComObject WScript.Shell;$original=$wsh.CreateShortcut($desktop);$original.TargetPath=Join-Path $env:WINDIR 'System32\notepad.exe';$original.Save()
$originalHash=(Get-FileHash -LiteralPath $desktop).Hash
$backup=Join-Path $state 'original.lnk';Copy-Item -LiteralPath $desktop -Destination $backup
New-RhineLink $desktop $launcher
$receipt=@{entries=@(@{path=$desktop;kind='desktop';created=$false;backup=$backup;hash=(Get-FileHash -LiteralPath $desktop).Hash})}
Restore-RhineEntries $receipt $state
Assert-True ((Get-FileHash -LiteralPath $desktop).Hash -eq $originalHash) 'Original shortcut was not restored byte-for-byte.'
New-RhineLink $desktop $launcher
$receipt.entries[0].hash=(Get-FileHash -LiteralPath $desktop).Hash
$changed=$wsh.CreateShortcut($desktop);$changed.Description='User changed this entry';$changed.Save();$changedHash=(Get-FileHash -LiteralPath $desktop).Hash
Restore-RhineEntries $receipt $state -WarningAction SilentlyContinue
Assert-True ((Get-FileHash -LiteralPath $desktop).Hash -eq $changedHash) 'User-modified entry was overwritten.'
$escapeRejected=$false;try{Assert-RhinePath (Join-Path $fixture 'outside') $state}catch{$escapeRejected=$true};Assert-True $escapeRejected 'Path boundary was not enforced.'
$outside=Join-Path $fixture 'outside';New-Item -ItemType Directory -Path $outside|Out-Null;Set-Content -LiteralPath (Join-Path $outside 'marker') -Value 'preserve'
$removeRejected=$false;try{Remove-RhineTree $outside $state}catch{$removeRejected=$true};Assert-True ($removeRejected -and (Test-Path -LiteralPath (Join-Path $outside 'marker'))) 'Foreign directory was removed.'
Add-Content -LiteralPath (Join-Path $engine 'assets\theme.css') -Value 'tampered'
$integrityRejected=$false;try{Read-RhineManifest $engine|Out-Null}catch{$integrityRejected=$true};Assert-True $integrityRejected 'Tampered package was accepted.'
$skillDestination=Join-Path $fixture 'skill';[IO.Compression.ZipFile]::ExtractToDirectory((Join-Path $root 'dist\rhine-lab-theme-1.0.0-skill.zip'),$skillDestination)
Assert-True ((Read-RhineManifest (Join-Path $skillDestination 'rhine-lab-theme\assets\runtime')).files.Count -eq $manifest.files.Count) 'Skill runtime is incomplete.'
. (Join-Path $source 'install-core.ps1')
$installState=Join-Path $fixture 'fresh-install'
$installDesktop=Join-Path $fixture 'fresh-desktop';$installStart=Join-Path $fixture 'fresh-start'
$installConfig=Join-Path $fixture 'fresh-config.toml'
Set-Content -LiteralPath $installConfig -Value "model = `"sample`"`n[desktop]`nsidebarWidth = 360" -Encoding UTF8
$installArgs=@{SourceRoot=$source;StateRoot=$installState;DesktopDirectory=$installDesktop;StartMenuDirectory=$installStart;NodePath=(Get-Command node).Source;ConfigPath=$installConfig;NoLaunch=$true}
Install-RhinePackage @installArgs|Out-Null
$installReceipt=Get-Content -LiteralPath (Join-Path $installState 'installed.json') -Encoding UTF8 -Raw|ConvertFrom-Json
Assert-True ($installReceipt.version -eq '1.0.0' -and $installReceipt.entries.Count -eq 2) 'Fresh install receipt is incomplete.'
Assert-True ($installReceipt.entries[0].created -and (Test-RhineLink $installReceipt.desktopEntry (Join-Path $installState 'engine\RhineLabTheme.exe'))) 'Fresh desktop entry was not installed.'
Install-RhinePackage @installArgs|Out-Null
$beforeReceipt=(Get-FileHash -LiteralPath (Join-Path $installState 'installed.json')).Hash
$beforeDesktop=(Get-FileHash -LiteralPath $installReceipt.desktopEntry).Hash
$beforeManager=(Get-FileHash -LiteralPath (Join-Path $installState 'engine\RhineLabTheme.exe')).Hash
Set-Content -LiteralPath $installConfig -Value '[invalid' -Encoding UTF8
$rollback=$false;try{Install-RhinePackage @installArgs 2>&1|Out-Null}catch{$rollback=$true}
Assert-True $rollback 'Invalid configuration did not abort installation.'
Assert-True ((Get-FileHash -LiteralPath (Join-Path $installState 'installed.json')).Hash -eq $beforeReceipt) 'Rollback changed the old receipt.'
Assert-True ((Get-FileHash -LiteralPath $installReceipt.desktopEntry).Hash -eq $beforeDesktop) 'Rollback changed the old shortcut.'
Assert-True ((Get-FileHash -LiteralPath (Join-Path $installState 'engine\RhineLabTheme.exe')).Hash -eq $beforeManager) 'Rollback did not restore the previous runtime.'
$testPreviousAppData=$env:APPDATA
try{
  $env:APPDATA=Join-Path $fixture 'fake-appdata'
  $pin=Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\Theme.lnk'
  $installLauncher=Join-Path $installState 'engine\RhineLabTheme.exe'
  New-RhineLink $pin $installLauncher
  $fakeOfficial=Join-Path $fixture 'official\app'
  New-Item -ItemType Directory -Path (Join-Path $fakeOfficial 'resources') -Force|Out-Null
  Copy-Item -LiteralPath (Join-Path $source 'assets\codex-white.ico') -Destination (Join-Path $fakeOfficial 'resources\chatgpt-app-dark.ico')
  $official=@{Executable=(Join-Path $fakeOfficial 'ChatGPT.exe');AppUserModelId='OpenAI.Codex_2p2nqsd0c76g0!App'}
  Restore-RhineTaskbar $installState $official (Join-Path $source 'RhineLabTheme.exe')
  $officialLink=Get-RhineLink $pin
  Assert-True ($officialLink.appId -eq $official.AppUserModelId -and $officialLink.arguments -eq ('shell:AppsFolder\'+$official.AppUserModelId)) 'Taskbar shortcut did not restore the official Store identity.'
}finally{$env:APPDATA=$testPreviousAppData}
$testPreviousCodexHome=$env:CODEX_HOME
try{
  $env:CODEX_HOME=Join-Path $fixture 'fake-codex-home'
  $skillEntry=Join-Path $fixture 'extracted\Rhine-Lab-Codex-Theme\scripts\entry.ps1'
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $skillEntry -Action install-skill|Out-Null
  Assert-True ($LASTEXITCODE -eq 0) 'Optional Skill installation failed.'
  $installedSkill=Join-Path $env:CODEX_HOME 'skills\rhine-lab-theme'
  Assert-True ((Read-RhineManifest (Join-Path $installedSkill 'assets\runtime')).files.Count -eq $manifest.files.Count) 'Installed Skill was not self-contained.'
  Assert-True (Test-Path -LiteralPath (Join-Path $installedSkill 'references\docs\preview-light.svg')) 'Skill guide preview is missing.'
  & powershell.exe -NoProfile -ExecutionPolicy Bypass -File $skillEntry -Action install-skill|Out-Null
  Assert-True ($LASTEXITCODE -eq 0 -and @(Get-ChildItem -LiteralPath (Join-Path $env:CODEX_HOME 'skill-backups') -Directory).Count -eq 1) 'Skill update did not preserve the previous installation.'
}finally{$env:CODEX_HOME=$testPreviousCodexHome}
$privateNames='(^|/)(profile|session\.json|engine\.json|installed\.json|auth\.json|.*\.log|.*\.lnk|.*\.png|.*\.tgz)(/|$)'
foreach($package in Get-ChildItem -LiteralPath (Join-Path $root 'dist') -Filter '*.zip'){
  $archive=[IO.Compression.ZipFile]::OpenRead($package.FullName)
  try{foreach($entry in $archive.Entries){Assert-True ($entry.FullName -notmatch $privateNames) ('Private artifact in package: '+$entry.FullName)}}finally{$archive.Dispose()}
}
Write-Output 'PASS: extracted ZIPs, fresh/repeat install, transaction rollback, runtime and Skill integrity, white icon, shortcut/taskbar restoration, changed-entry preservation and path boundaries.'
