# Read-only classification: this file never starts or stops an application.
function Test-RhineThemeProcess {
  param([object]$ProcessInfo, [int]$Port, [string]$Profile)
  $line = [string]$ProcessInfo.CommandLine
  if (-not $line -or $line -match '(?i)(?:^|\s)"?--type=') { return $false }
  if ((Get-DreamSkinCodexDebugArgumentStatus -Processes @($ProcessInfo) -Port $Port) -ne 'forwarded') { return $false }
  $argument = [regex]::Match($line, '(?i)(?:^|\s)(?:"--user-data-dir=([^"]+)"|--user-data-dir="([^"]+)"|--user-data-dir=([^\s"]+))(?=\s|$)')
  if (-not $argument.Success) { return $false }
  foreach ($index in 1..3) {
    if ($argument.Groups[$index].Success) {
      return Test-DreamSkinPathEqual -Left $argument.Groups[$index].Value -Right $Profile
    }
  }
  return $false
}

function Get-RhineStartupSnapshot {
  param([int]$Port, [object]$Codex, [string]$Profile)
  $identity = Get-DreamSkinVerifiedCdpIdentity -Port $Port -Codex $Codex
  if ($null -ne $identity) { return [pscustomobject]@{status='ready';identity=$identity} }
  $processes = @(Get-DreamSkinCodexProcesses -Codex $Codex)
  $listeners = @(Get-DreamSkinPortListeners -Port $Port)
  # A listener must belong to an official process and bind only to loopback.
  $officialIds = @($processes | ForEach-Object { [int]$_.ProcessId })
  foreach ($listener in $listeners) {
    if ($listener.LocalAddress -notin @('127.0.0.1','::1') -or [int]$listener.OwningProcess -notin $officialIds) {
      return [pscustomobject]@{status='port-conflict';identity=$null}
    }
  }
  if (@($processes | Where-Object { Test-RhineThemeProcess -ProcessInfo $_ -Port $Port -Profile $Profile }).Count -gt 0) {
    return [pscustomobject]@{status='theme-starting';identity=$null}
  }
  if ($processes.Count -gt 0) {
    $main = @($processes | Where-Object { $_.CommandLine -and $_.CommandLine -notmatch '(?i)(?:^|\s)"?--type=' })
    # Unreadable commands, unexpected debugging flags, and owned-but-unready
    # listeners are ambiguous. Do not label them as an ordinary launch.
    $unreadable = @($processes | Where-Object { -not $_.CommandLine }).Count -gt 0
    $debugging = @($main | Where-Object { $_.CommandLine -match '(?i)--remote-debugging-(?:port|pipe)' }).Count -gt 0
    $status = if ($main.Count -gt 0 -and -not $unreadable -and -not $debugging -and $listeners.Count -eq 0) { 'normal-running' } else { 'unverified-running' }
    return [pscustomobject]@{status=$status;identity=$null}
  }
  return [pscustomobject]@{status='absent';identity=$null}
}

function Wait-RhineStartupReady {
  param(
    [scriptblock]$Probe,
    [ValidateRange(0,120)][int]$TimeoutSeconds=40,
    [ValidateRange(1,2000)][int]$PollMilliseconds=400,
    [switch]$WaitWhenAbsent,
    [scriptblock]$OnStatus
  )
  $clock = [Diagnostics.Stopwatch]::StartNew()
  $lastStatus = $null
  do {
    $snapshot = & $Probe
    if ($snapshot.status -ne $lastStatus -and $null -ne $OnStatus) { & $OnStatus $snapshot.status }
    $lastStatus = $snapshot.status
    if ($snapshot.status -ne 'theme-starting' -and -not ($WaitWhenAbsent -and $snapshot.status -eq 'absent')) { return $snapshot }
    if ($clock.Elapsed.TotalSeconds -ge $TimeoutSeconds) {
      return [pscustomobject]@{status='theme-timeout';identity=$null;lastStatus=$snapshot.status}
    }
    Start-Sleep -Milliseconds $PollMilliseconds
  } while ($true)
}

function Get-RhineStartupMessage {
  param([string]$Status)
  switch ($Status) {
    'checking' { 'Checking the official Codex theme connection.' }
    'absent' { 'Starting the official Codex theme session.' }
    'theme-starting' { 'The theme session is starting; waiting for its verified connection.' }
    'normal-running' { 'Codex is running from an ordinary entry without a theme connection. Close that window yourself before opening the theme entry. No window was closed.' }
    'unverified-running' { 'A running Codex session could not be identified safely. Leave it open and check the theme logs; no process was stopped.' }
    'port-conflict' { 'The theme port is occupied by an unverified process or a non-loopback listener. No process was stopped.' }
    'theme-timeout' { 'The theme session did not become ready within 40 seconds. Its window was left open; use the theme entry to retry.' }
    'renderer-starting' { 'The official connection is ready; waiting for the theme renderer.' }
    'ready' { 'The official Codex theme connection is ready.' }
    default { 'Theme startup did not complete. Check operations-error.log and engine-error.log; existing Codex windows were left open.' }
  }
}
