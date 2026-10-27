param([int]$Port = 9436, [switch]$ProbeOnly, [switch]$DiagnoseOnly)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'vendor/common-windows.ps1')
. (Join-Path $PSScriptRoot 'startup-state.ps1')
$runtimeRoot = Join-Path $env:LOCALAPPDATA 'RhineLabTheme7'
$profile = Join-Path $runtimeRoot 'profile'
$codexInstall = Get-DreamSkinCodexInstall
# Diagnostics never launch, focus, stop, or rewrite a live session.
if ($DiagnoseOnly) {
  $snapshot = Get-RhineStartupSnapshot -Port $Port -Codex $codexInstall -Profile $profile
  @{status=$snapshot.status;message=(Get-RhineStartupMessage $snapshot.status);official=$codexInstall.Version} | ConvertTo-Json
  return
}
$operationMutex=[Threading.Mutex]::new($false,'Local\RhineLabThemeOperation7')
if(-not $operationMutex.WaitOne(10000)){$operationMutex.Dispose();throw 'Another theme operation is still running.'}
try {
New-Item -ItemType Directory -Path $runtimeRoot -Force | Out-Null
function Write-StartupStatus([string]$Status, [string]$Message) {
  if (-not $Message) { $Message = Get-RhineStartupMessage $Status }
  $value = @{time=[DateTime]::UtcNow.ToString('o');status=$Status;message=$Message;official=$codexInstall.Version}
  $temporary = Join-Path $runtimeRoot 'startup-status.json.tmp'
  [IO.File]::WriteAllText($temporary,($value | ConvertTo-Json),[Text.UTF8Encoding]::new($false))
  Move-Item -LiteralPath $temporary -Destination (Join-Path $runtimeRoot 'startup-status.json') -Force
}
Write-StartupStatus 'checking'
$probe = { Get-RhineStartupSnapshot -Port $Port -Codex $codexInstall -Profile $profile }
$report = { param($status) Write-StartupStatus $status }
$snapshot = Wait-RhineStartupReady -Probe $probe -OnStatus $report
if ($snapshot.status -eq 'absent') {
  New-Item -ItemType Directory -Path $profile -Force | Out-Null
  $arguments = @('--remote-debugging-address=127.0.0.1', "--remote-debugging-port=$Port", "--user-data-dir=$profile")
  $launch = Start-DreamSkinCodexForDebugging -Codex $codexInstall -Arguments $arguments -Port $Port
  $snapshot = Wait-RhineStartupReady -Probe $probe -WaitWhenAbsent -OnStatus $report
}
if ($snapshot.status -ne 'ready') {
  Write-StartupStatus $snapshot.status
  throw (Get-RhineStartupMessage $snapshot.status)
}
$identity = $snapshot.identity
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
  Write-StartupStatus 'renderer-starting'
  $node = (Get-Command node -ErrorAction Stop).Source
  $engineStatePath=Join-Path $runtimeRoot 'engine.json'
  $engineRunning=$false
  if(Test-Path -LiteralPath $engineStatePath){
    $previous=Get-Content -Encoding UTF8 -LiteralPath $engineStatePath -Raw|ConvertFrom-Json
    $process=Get-CimInstance Win32_Process -Filter ("ProcessId = "+[int]$previous.pid)
    if($null -ne $process){
      # A saved PID may now belong to an unrelated process. Leave it running
      # and start a new theme engine instead of blocking theme recovery.
      $recordedEngineMatches=$process.ExecutablePath -ieq $previous.node -and $process.CommandLine -like ('*'+$previous.script+'*')
      if($recordedEngineMatches){
        $engineRunning=$previous.browserId -eq $identity.BrowserId -and $previous.script -eq (Join-Path $PSScriptRoot 'engine.mjs')
        if(-not $engineRunning){Stop-Process -Id ([int]$previous.pid)}
      }
    }
  }
  if(-not $engineRunning){
    $started=Start-Process -FilePath $node -ArgumentList @((ConvertTo-DreamSkinProcessArgument (Join-Path $PSScriptRoot 'engine.mjs')), '--watch') -WindowStyle Hidden -RedirectStandardOutput (Join-Path $runtimeRoot 'engine.log') -RedirectStandardError (Join-Path $runtimeRoot 'engine-error.log') -PassThru
    $engineDeadline=(Get-Date).AddSeconds(55)
    do{
      if($started.HasExited){throw 'The theme renderer did not confirm startup. See engine-error.log.'}
      if(Test-Path -LiteralPath $engineStatePath){
        try{$created=Get-Content -Encoding UTF8 -LiteralPath $engineStatePath -Raw|ConvertFrom-Json;if($created.pid -eq $started.Id){$engineRunning=$true;break}}catch{}
      }
      Start-Sleep -Milliseconds 200
    }while((Get-Date) -lt $engineDeadline)
    if(-not $engineRunning){throw 'Theme startup was not verified before timeout.'}
  }
  Write-StartupStatus 'ready'
}
$state | ConvertTo-Json -Depth 7
} catch {
  try {
    if ($snapshot.status -in @('normal-running','unverified-running','port-conflict','theme-timeout')) { $failureStatus=$snapshot.status } else { $failureStatus='failed' }
    Write-StartupStatus $failureStatus $_.Exception.Message
  } catch {}
  throw
} finally {$operationMutex.ReleaseMutex();$operationMutex.Dispose()}
