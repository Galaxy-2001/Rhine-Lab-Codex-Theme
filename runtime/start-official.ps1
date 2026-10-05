param([int]$Port = 9436, [switch]$ProbeOnly)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'vendor/common-windows.ps1')
$operationMutex=[Threading.Mutex]::new($false,'Local\RhineLabThemeOperation7')
if(-not $operationMutex.WaitOne(10000)){$operationMutex.Dispose();throw 'Another theme operation is still running.'}
try {
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'RhineLabTheme7'
$profile = Join-Path $runtimeRoot 'profile'
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
$codexInstall = Get-DreamSkinCodexInstall
$identity = Get-DreamSkinVerifiedCdpIdentity -Port $Port -Codex $codexInstall
if ($null -eq $identity) {
  $runningOfficial = @(Get-DreamSkinCodexProcesses -Codex $codexInstall)
  if ($runningOfficial.Count -gt 0) { throw 'Official Codex is running without the theme endpoint. Close that official window before applying; the current session will not be stopped automatically.' }
  if (-not (Test-DreamSkinPortAvailable -Port $Port)) { throw 'Theme port is occupied by another process.' }
  New-Item -ItemType Directory -Path $profile -Force | Out-Null
  $arguments = @('--remote-debugging-address=127.0.0.1', "--remote-debugging-port=$Port", "--user-data-dir=$profile")
  $launch = Start-DreamSkinCodexForDebugging -Codex $codexInstall -Arguments $arguments -Port $Port
  $deadline = (Get-Date).AddSeconds(18)
  do {
    $identity = Get-DreamSkinVerifiedCdpIdentity -Port $Port -Codex $codexInstall
    if ($null -ne $identity) { break }
    Start-Sleep -Milliseconds 250
  } while ((Get-Date) -lt $deadline)
  if ($null -eq $identity) { throw 'The official app did not expose a verified theme endpoint.' }
}
$rhineListeners=@(Get-DreamSkinPortListeners -Port $Port)
$rhineOwnerIds=@($rhineListeners | Select-Object -ExpandProperty OwningProcess -Unique)
if($rhineOwnerIds.Count -ne 1){throw 'The theme endpoint has no unique official owner.'}
$rhineOwner=Get-Process -Id ([int]$rhineOwnerIds[0]) -ErrorAction Stop
$rhineMainProcess=@{id=$rhineOwner.Id;startedAtUtcTicks=$rhineOwner.StartTime.ToUniversalTime().Ticks.ToString()}
if($rhineOwner.MainWindowHandle -eq [IntPtr]::Zero){
  $rhineReopenArguments=@('--remote-debugging-address=127.0.0.1',"--remote-debugging-port=$Port","--user-data-dir=$profile")
  Start-DreamSkinCodexDirect -Codex $codexInstall -Arguments $rhineReopenArguments|Out-Null
  $rhineWindowDeadline=(Get-Date).AddSeconds(8)
  do{
    $rhineOwner.Refresh()
    if($rhineOwner.MainWindowHandle -ne [IntPtr]::Zero){break}
    Start-Sleep -Milliseconds 200
  }while((Get-Date) -lt $rhineWindowDeadline)
  if($rhineOwner.MainWindowHandle -eq [IntPtr]::Zero){throw 'The theme session is alive, but its official window could not be reopened.'}
}
$state = [ordered]@{ port=$Port; official=$codexInstall; identity=$identity; mainProcess=$rhineMainProcess; sourceRoot=$PSScriptRoot }
$state | ConvertTo-Json -Depth 7 | Set-Content -LiteralPath (Join-Path $runtimeRoot 'session.json') -Encoding utf8
if (-not $ProbeOnly) {
  $node = (Get-Command node -ErrorAction Stop).Source
  $engineStatePath=Join-Path $runtimeRoot 'engine.json'
  $engineRunning=$false
  if(Test-Path -LiteralPath $engineStatePath){
    $previous=Get-Content -Encoding UTF8 -LiteralPath $engineStatePath -Raw|ConvertFrom-Json
    $process=Get-CimInstance Win32_Process -Filter ("ProcessId = "+[int]$previous.pid)
    if($null -ne $process){
      if($process.ExecutablePath -ine $previous.node -or $process.CommandLine -notlike ('*'+$previous.script+'*')){throw 'Recorded theme process identity changed.'}
      $engineRunning=$previous.browserId -eq $identity.BrowserId -and $previous.script -eq (Join-Path $PSScriptRoot 'engine.mjs')
      if(-not $engineRunning){Stop-Process -Id ([int]$previous.pid)}
    }
  }
  if(-not $engineRunning){
    $started=Start-Process -FilePath $node -ArgumentList @((ConvertTo-DreamSkinProcessArgument (Join-Path $PSScriptRoot 'engine.mjs')), '--watch') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'engine.log') -RedirectStandardError (Join-Path $runtimeRoot 'engine-error.log') -PassThru
    $engineDeadline=(Get-Date).AddSeconds(20)
    do{
      if($started.HasExited){throw 'The theme renderer did not confirm startup. See engine-error.log.'}
      if(Test-Path -LiteralPath $engineStatePath){
        try{$created=Get-Content -Encoding UTF8 -LiteralPath $engineStatePath -Raw|ConvertFrom-Json;if($created.pid -eq $started.Id){$engineRunning=$true;break}}catch{}
      }
      Start-Sleep -Milliseconds 200
    }while((Get-Date) -lt $engineDeadline)
    if(-not $engineRunning){throw 'Theme startup was not verified before timeout.'}
  }
}
$state | ConvertTo-Json -Depth 7
} finally {$operationMutex.ReleaseMutex();$operationMutex.Dispose()}
