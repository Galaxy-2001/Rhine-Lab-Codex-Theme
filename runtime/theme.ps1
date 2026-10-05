param([ValidateSet('start','enable','disable','motion-on','motion-off','restore','status')][string]$Action='start')
$ErrorActionPreference='Stop'
$runtimeRoot=Join-Path $env:LOCALAPPDATA 'RhineLabTheme7'
$preferencesPath=Join-Path $runtimeRoot 'preferences.json'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
$preferences=[pscustomobject]@{ enabled=$true; motion=$true; restored=$false }
if(Test-Path -LiteralPath $preferencesPath){$preferences=Get-Content -Encoding UTF8 -LiteralPath $preferencesPath -Raw | ConvertFrom-Json}
if(-not $preferences.PSObject.Properties['restored']){$preferences|Add-Member -NotePropertyName restored -NotePropertyValue $false}
function Write-Preferences {
  $temporary=$preferencesPath+'.tmp'
  [IO.File]::WriteAllText($temporary,($preferences|ConvertTo-Json),[Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $temporary -Destination $preferencesPath -Force
}
function Stop-ThemeEngine {
  $enginePath=Join-Path $runtimeRoot 'engine.json'
  if(-not(Test-Path -LiteralPath $enginePath)){return}
  $engine=Get-Content -Encoding UTF8 -LiteralPath $enginePath -Raw|ConvertFrom-Json
  $process=Get-CimInstance Win32_Process -Filter ("ProcessId = "+[int]$engine.pid)
  if($null -eq $process){return}
  if($process.ExecutablePath -ine $engine.node -or $process.CommandLine -notlike ('*'+$engine.script+'*')){throw 'Engine identity changed; no process was stopped.'}
  Stop-Process -Id ([int]$engine.pid) -ErrorAction Stop
}
try { switch($Action){
  'status' {
    $verification=Join-Path $runtimeRoot 'verification.json'
    @{preferences=$preferences;installedRoot=$PSScriptRoot;verification=if(Test-Path -LiteralPath $verification){Get-Content -Encoding UTF8 -LiteralPath $verification -Raw|ConvertFrom-Json}else{$null}}|ConvertTo-Json -Depth 6
    exit
  }
  'restore' {
    $preferences.enabled=$false;$preferences.restored=$true;Write-Preferences;Stop-ThemeEngine
    $sessionPath=Join-Path $runtimeRoot 'session.json'
    if(Test-Path -LiteralPath $sessionPath){
      . (Join-Path $PSScriptRoot 'vendor/common-windows.ps1')
      $session=Get-Content -Encoding UTF8 -LiteralPath $sessionPath -Raw|ConvertFrom-Json
      $registered=Get-DreamSkinCodexInstall
      $identity=Get-DreamSkinVerifiedCdpIdentity -Port ([int]$session.port) -Codex $registered
      if($null -ne $identity -and $identity.BrowserId -eq $session.identity.BrowserId){
        & (Get-Command node).Source (Join-Path $PSScriptRoot 'engine.mjs') --remove
        $rhineOwners=@(Get-DreamSkinPortListeners -Port ([int]$session.port)|Select-Object -ExpandProperty OwningProcess -Unique)
        if($rhineOwners.Count -ne 1){throw 'No unique theme session can be closed.'}
        $rhineOwnerId=[int]$rhineOwners[0]
        $rhineOfficialProcesses=@(Get-DreamSkinCodexProcesses -Codex $registered)
        $rhineParentMap=@{};foreach($rhineProcess in $rhineOfficialProcesses){$rhineParentMap[[int]$rhineProcess.ProcessId]=[int]$rhineProcess.ParentProcessId}
        $rhinePreserveIds=@(foreach($rhineProcess in $rhineOfficialProcesses){
          $rhineCurrentId=[int]$rhineProcess.ProcessId;$rhineSeen=@{}
          while($rhineCurrentId -ne $rhineOwnerId -and $rhineParentMap.ContainsKey($rhineCurrentId) -and -not $rhineSeen.ContainsKey($rhineCurrentId)){
            $rhineSeen[$rhineCurrentId]=$true;$rhineCurrentId=$rhineParentMap[$rhineCurrentId]
          }
          if($rhineCurrentId -ne $rhineOwnerId){[int]$rhineProcess.ProcessId}
        })
        Stop-DreamSkinCodex -Codex $registered -PreserveProcessIds $rhinePreserveIds
        & (Get-Command node).Source (Join-Path $PSScriptRoot 'appearance.mjs') restore
        if($LASTEXITCODE -ne 0){throw 'The original appearance could not be restored.'}
        Start-DreamSkinCodex -Codex $registered|Out-Null
      }
    }
    & (Get-Command node).Source (Join-Path $PSScriptRoot 'appearance.mjs') restore
    if($LASTEXITCODE -ne 0){throw 'The original appearance could not be restored.'}
    . (Join-Path $PSScriptRoot 'package-common.ps1')
    $installed=Join-Path $runtimeRoot 'installed.json'
    if(Test-Path -LiteralPath $installed){
      $receipt=Get-Content -Encoding UTF8 -LiteralPath $installed -Raw|ConvertFrom-Json
      Restore-RhineEntries $receipt $runtimeRoot
      . (Join-Path $PSScriptRoot 'vendor/common-windows.ps1')
      Restore-RhineTaskbar $runtimeRoot (Get-DreamSkinCodexInstall)
    }
    Write-Output 'Official appearance and the original desktop shortcut restored.';exit
  }
  'disable' {$preferences.enabled=$false;Write-Preferences;exit}
  'motion-off' {$preferences.motion=$false;Write-Preferences;exit}
  'motion-on' {$preferences.motion=$true;Write-Preferences;exit}
  'enable' {$preferences.enabled=$true;$preferences.restored=$false;Write-Preferences}
  'start' {
    Write-Preferences
    if($preferences.restored){
      . (Join-Path $PSScriptRoot 'vendor/common-windows.ps1')
      Start-DreamSkinCodex -Codex (Get-DreamSkinCodexInstall)|Out-Null;exit
    }
  }
}
& (Join-Path $PSScriptRoot 'start-official.ps1')
& (Get-Command node).Source (Join-Path $PSScriptRoot 'engine.mjs') --show
if($LASTEXITCODE -ne 0){throw 'The official theme window could not be shown.'}
}catch{
  [IO.File]::AppendAllText((Join-Path $runtimeRoot 'operations-error.log'),([DateTime]::Now.ToString('s')+' '+$Action+' '+$_.Exception.Message+[Environment]::NewLine),[Text.UTF8Encoding]::new($false))
  throw
}
