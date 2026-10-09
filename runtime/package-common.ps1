$ErrorActionPreference='Stop'
function Write-RhineJson($Path,$Value){
  [IO.File]::WriteAllText($Path,($Value|ConvertTo-Json -Depth 8),[Text.UTF8Encoding]::new($false))
}
function Assert-RhinePath([string]$Path,[string]$Boundary){
  $base=[IO.Path]::GetFullPath($Boundary).TrimEnd('\')
  $full=[IO.Path]::GetFullPath($Path)
  if($full -eq $base -or -not $full.StartsWith($base+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Theme file operation escaped its directory.'}
  for($current=$full;$current -and $current.Length -ge $base.Length;$current=Split-Path $current -Parent){
    if((Test-Path -LiteralPath $current) -and ((Get-Item -LiteralPath $current).Attributes -band [IO.FileAttributes]::ReparsePoint)){throw 'Theme directories cannot contain links.'}
  }
}
function Read-RhineManifest([string]$Root){
  $manifest=Get-Content -LiteralPath (Join-Path $Root 'manifest.json') -Encoding UTF8 -Raw|ConvertFrom-Json
  if($manifest.id -ne 'rhine-lab' -or $manifest.version -notmatch '^\d+\.\d+\.\d+$' -or $manifest.files.Count -lt 1){throw 'Unknown theme package.'}
  $seen=@{}
  foreach($entry in $manifest.files){
    $relative=[string]$entry.path
    if($relative -match '(^[/\\]|(^|[/\\])\.\.([/\\]|$)|:)' -or $relative.Contains([char]0) -or $relative -eq 'manifest.json' -or $seen.ContainsKey($relative)){throw 'Invalid package path.'}
    $seen[$relative]=$true;$file=Join-Path $Root $relative;Assert-RhinePath $file $Root
    if((Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash -ine $entry.sha256){throw ('Package integrity mismatch: '+$relative)}
  }
  return $manifest
}
function Copy-RhineRuntime([string]$Source,[string]$Stage,[string]$StateRoot){
  $manifest=Read-RhineManifest $Source;Assert-RhinePath $Stage $StateRoot
  if(Test-Path -LiteralPath $Stage){throw 'Stage directory already exists.'}
  New-Item -ItemType Directory -Path $Stage -Force|Out-Null
  foreach($entry in $manifest.files){
    $destination=Join-Path $Stage $entry.path;Assert-RhinePath $destination $StateRoot
    New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force|Out-Null
    Copy-Item -LiteralPath (Join-Path $Source $entry.path) -Destination $destination
    if((Get-FileHash -LiteralPath $destination).Hash -ine $entry.sha256){throw 'Staged package integrity mismatch.'}
    Unblock-File -LiteralPath $destination
  }
  Copy-Item -LiteralPath (Join-Path $Source 'manifest.json') -Destination $Stage
}
function Remove-RhineTree([string]$Path,[string]$StateRoot){
  Assert-RhinePath $Path $StateRoot
  if(-not(Test-Path -LiteralPath $Path)){return}
  foreach($item in Get-ChildItem -LiteralPath $Path -Recurse -Force){Assert-RhinePath $item.FullName $StateRoot}
  Remove-Item -LiteralPath $Path -Recurse -Force
}
function Get-RhineLink([string]$Path){
  if(-not(Test-Path -LiteralPath $Path)){return $null}
  $wsh=New-Object -ComObject WScript.Shell;$link=$wsh.CreateShortcut($Path)
  $shell=New-Object -ComObject Shell.Application
  $folder=$shell.NameSpace((Split-Path $Path -Parent));$item=$folder.ParseName((Split-Path $Path -Leaf))
  return [pscustomobject]@{target=$link.TargetPath;arguments=$link.Arguments;icon=$link.IconLocation;appId=$item.ExtendedProperty('System.AppUserModel.ID');hash=(Get-FileHash -LiteralPath $Path).Hash}
}
function Test-RhineLink([string]$Path,[string]$Launcher){
  $link=Get-RhineLink $Path
  return ($null -ne $link -and $link.target -eq $Launcher -and $link.appId -eq 'RhineLab.Codex.Theme')
}
function New-RhineLink([string]$Path,[string]$Launcher){
  New-Item -ItemType Directory -Path (Split-Path $Path -Parent) -Force|Out-Null
  $child=Start-Process -FilePath $Launcher -ArgumentList @('--make-link',('"{0}"' -f $Path),('"{0}"' -f $Launcher)) -WindowStyle Hidden -Wait -PassThru
  if($child.ExitCode -ne 0 -or -not(Test-RhineLink $Path $Launcher)){throw 'Theme shortcut could not be generated.'}
}
function Stop-RhineManager([string]$Launcher){
  foreach($process in @(Get-CimInstance Win32_Process -Filter "Name = 'RhineLabTheme.exe'"|Where-Object{$_.ExecutablePath -eq $Launcher})){
    Stop-Process -Id $process.ProcessId
    Wait-Process -Id $process.ProcessId -Timeout 5 -ErrorAction SilentlyContinue
  }
}
function Stop-RhineEngine([string]$StateRoot){
  $file=Join-Path $StateRoot 'engine.json';if(-not(Test-Path -LiteralPath $file)){return}
  $engine=Get-Content -LiteralPath $file -Encoding UTF8 -Raw|ConvertFrom-Json
  $process=Get-CimInstance Win32_Process -Filter ("ProcessId = "+[int]$engine.pid)
  if($null -eq $process){return}
  $expected=Join-Path $StateRoot 'engine\engine.mjs'
  if($engine.script -ne $expected -or $process.ExecutablePath -ine $engine.node -or $process.CommandLine -notlike ('*'+$expected+'*')){throw 'Engine identity changed; no process was stopped.'}
  if($engine.startedAtUtcTicks -and (Get-Process -Id $engine.pid).StartTime.ToUniversalTime().Ticks -ne [long]$engine.startedAtUtcTicks){throw 'Engine process was reused.'}
  Stop-Process -Id ([int]$engine.pid)
}
function Restore-RhineEntries($Receipt,[string]$StateRoot,[switch]$IncludeStartMenu){
  $launcher=Join-Path $StateRoot 'engine\RhineLabTheme.exe'
  $entries=@()
  if($Receipt.entries){$entries=@($Receipt.entries)}
  elseif($Receipt.desktopEntry){$entries=@([pscustomobject]@{path=$Receipt.desktopEntry;hash=$Receipt.desktopHash;created=$false;backup=$Receipt.originalBackup;kind='desktop'})}
  foreach($entry in $entries){
    if($entry.kind -eq 'start-menu' -and -not $IncludeStartMenu){continue}
    if(-not(Test-Path -LiteralPath $entry.path)){continue}
    if((Get-FileHash -LiteralPath $entry.path).Hash -ne $entry.hash -or -not(Test-RhineLink $entry.path $launcher)){Write-Warning 'A changed shortcut was preserved.';continue}
    if($entry.created){Remove-Item -LiteralPath $entry.path}
    elseif($entry.backup -and (Test-Path -LiteralPath $entry.backup)){
      Assert-RhinePath $entry.backup $StateRoot
      Copy-Item -LiteralPath $entry.backup -Destination $entry.path -Force
    }else{throw 'The original shortcut backup is missing; theme files were preserved.'}
  }
}
function Restore-RhineTaskbar([string]$StateRoot,$Official,[string]$LinkTool){
  $launcher=Join-Path $StateRoot 'engine\RhineLabTheme.exe'
  if(-not $LinkTool){$LinkTool=$launcher}
  $folder=Join-Path $env:APPDATA 'Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar'
  if(-not(Test-Path -LiteralPath $folder)){return}
  $officialIcon=Join-Path (Split-Path $Official.Executable -Parent) 'resources\chatgpt-app-dark.ico'
  if(-not(Test-Path -LiteralPath $officialIcon)){$officialIcon=$Official.Executable}
  foreach($item in Get-ChildItem -LiteralPath $folder -Filter '*.lnk' -File){
    if(-not(Test-RhineLink $item.FullName $launcher)){continue}
    $child=Start-Process -FilePath $LinkTool -ArgumentList @('--make-official-link',('"{0}"' -f $item.FullName),('"{0}"' -f $Official.AppUserModelId),('"{0}"' -f $officialIcon)) -WindowStyle Hidden -Wait -PassThru
    if($child.ExitCode -ne 0 -or (Get-RhineLink $item.FullName).appId -ne $Official.AppUserModelId){throw 'The taskbar shortcut could not be restored.'}
  }
}
