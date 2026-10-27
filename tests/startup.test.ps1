$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
. (Join-Path $root 'runtime/vendor/common-windows.ps1')
. (Join-Path $root 'runtime/startup-state.ps1')
function Assert-Startup($Condition, [string]$Message) { if (-not $Condition) { throw $Message } }
$script:checks = 0
function Pass([string]$Name) { $script:checks++; Write-Output ('PASS: '+$Name) }
$profile = 'C:\Theme Profile\profile'
$codexInstall = [pscustomobject]@{Version='test';Executable='C:\Official\ChatGPT.exe'}
$theme = [pscustomobject]@{ProcessId=42;CommandLine='"C:\Official\ChatGPT.exe" --remote-debugging-port=9436 --user-data-dir="C:\Theme Profile\profile"'}
$ordinary = [pscustomobject]@{ProcessId=43;CommandLine='"C:\Official\ChatGPT.exe"'}
$script:identity=$null; $script:processes=@(); $script:listeners=@()
function Get-DreamSkinVerifiedCdpIdentity { param($Port,$Codex) return $script:identity }
function Get-DreamSkinCodexProcesses { param($Codex) return $script:processes }
function Get-DreamSkinPortListeners { param($Port) return $script:listeners }
function Snapshot { Get-RhineStartupSnapshot -Port 9436 -Codex $codexInstall -Profile $profile }

$script:processes=@($theme,$ordinary)
Assert-Startup ((Snapshot).status -eq 'theme-starting') 'A starting theme beside a normal session was rejected.'
Pass 'theme startup is distinguished from an ordinary session, including coexistence'
foreach ($line in @('"app.exe" --remote-debugging-port=9436 "--user-data-dir=C:\Theme Profile\profile"', 'app.exe --remote-debugging-port=9436 --user-data-dir=C:\Profile')) {
  $expected = if ($line -like '*Theme Profile*') { $profile } else { 'C:\Profile' }
  Assert-Startup (Test-RhineThemeProcess ([pscustomobject]@{CommandLine=$line}) 9436 $expected) 'A quoted profile argument was rejected.'
}
Pass 'quoted paths and complete argument tokens are recognized'
foreach ($line in @(
  'app.exe --remote-debugging-port=94360 --user-data-dir="C:\Theme Profile\profile"',
  'app.exe --remote-debugging-port=9436 --user-data-dir="C:\Theme Profile\profile-other"',
  'app.exe --type=renderer --remote-debugging-port=9436 --user-data-dir="C:\Theme Profile\profile"',
  'app.exe codex://open/--remote-debugging-port%3D9436 --user-data-dir="C:\Theme Profile\profile"'
)) {
  Assert-Startup (-not (Test-RhineThemeProcess ([pscustomobject]@{CommandLine=$line}) 9436 $profile)) 'A foreign profile, child process, or protocol URL counted as the theme main process.'
}
Pass 'wrong port/profile, renderer children and protocol-redirected arguments cannot impersonate theme startup'
$script:processes=@($ordinary)
Assert-Startup ((Snapshot).status -eq 'normal-running') 'A normal running window was misclassified.'
$script:processes=@([pscustomobject]@{ProcessId=43;CommandLine=$null})
Assert-Startup ((Snapshot).status -eq 'unverified-running') 'Unreadable process identity was called a normal launch.'
$script:processes=@([pscustomobject]@{ProcessId=43;CommandLine='app.exe --remote-debugging-port=9436 --user-data-dir=C:\Other'})
Assert-Startup ((Snapshot).status -eq 'unverified-running') 'A different debugging profile was adopted.'
Pass 'ordinary and ambiguous processes receive different statuses'
$script:processes=@($theme)
foreach ($listener in @([pscustomobject]@{LocalAddress='127.0.0.1';OwningProcess=999},[pscustomobject]@{LocalAddress='0.0.0.0';OwningProcess=42})) {
  $script:listeners=@($listener)
  Assert-Startup ((Snapshot).status -eq 'port-conflict') 'An unverified listener was adopted.'
}
Pass 'foreign and non-loopback port owners are rejected without stopping them'
$script:listeners=@(); $script:processes=@()
Assert-Startup ((Snapshot).status -eq 'absent') 'An absent app was called ready.'
$script:identity=[pscustomobject]@{BrowserId='verified'}
Assert-Startup ((Snapshot).identity.BrowserId -eq 'verified') 'A verified endpoint was not reused.'
$script:identity=$null
Pass 'absent and verified sessions are classified correctly'

$script:probeCount=0; $script:reported=@()
$result=Wait-RhineStartupReady -PollMilliseconds 1 -TimeoutSeconds 2 -Probe {
  $script:probeCount++
  if ($script:probeCount -lt 3) { [pscustomobject]@{status='theme-starting';identity=$null} } else { [pscustomobject]@{status='ready';identity='same-session'} }
} -OnStatus {param($status) $script:reported+=,$status}
Assert-Startup ($result.status -eq 'ready' -and $result.identity -eq 'same-session' -and $script:probeCount -eq 3) 'Delayed readiness was rejected.'
Assert-Startup (($script:reported -join ',') -eq 'theme-starting,ready') 'Status notifications were missing or repeated each poll.'
Pass 'delayed endpoint readiness retries successfully and reports state transitions'
$script:probeCount=0
$result=Wait-RhineStartupReady -PollMilliseconds 1 -TimeoutSeconds 2 -WaitWhenAbsent -Probe {
  $script:probeCount++
  [pscustomobject]@{status=(@('absent','theme-starting','ready')[$script:probeCount-1]);identity=$null}
}
Assert-Startup ($result.status -eq 'ready' -and $script:probeCount -eq 3) 'A just-launched process was rejected before appearing.'
Pass 'a newly launched process can appear after its first probe'
$result=Wait-RhineStartupReady -TimeoutSeconds 0 -Probe { [pscustomobject]@{status='theme-starting';identity=$null} }
Assert-Startup ($result.status -eq 'theme-timeout' -and $result.lastStatus -eq 'theme-starting') 'A pending session lacked a bounded timeout.'
foreach ($state in @('normal-running','unverified-running','port-conflict','absent')) {
  $script:probeCount=0
  $result=Wait-RhineStartupReady -TimeoutSeconds 0 -Probe { $script:probeCount++; [pscustomobject]@{status=$state;identity=$null} }
  Assert-Startup ($result.status -eq $state -and $script:probeCount -eq 1) 'A terminal state was retried or misreported as a timeout.'
}
Pass 'timeouts remain distinct from ordinary sessions, unknown identity, and occupied ports'

# Execute the actual launcher in a fully isolated LOCALAPPDATA with stubbed OS
# discovery. Every process mutation raises an error instead of touching Windows.
$fixture=Join-Path $root ('.checks/startup-'+[Guid]::NewGuid().ToString('N'))
$fakeEngine=Join-Path $fixture 'engine'
New-Item -ItemType Directory -Path (Join-Path $fakeEngine 'vendor') -Force | Out-Null
Copy-Item (Join-Path $root 'runtime/start-official.ps1') $fakeEngine
Copy-Item (Join-Path $root 'runtime/startup-state.ps1') $fakeEngine
$fakeCommon=@'
function Get-DreamSkinCodexInstall { [pscustomobject]@{Version='fixture'} }
function Get-DreamSkinVerifiedCdpIdentity { param($Port,$Codex) return $null }
function Get-DreamSkinCodexProcesses { param($Codex) [pscustomobject]@{ProcessId=99;CommandLine='app.exe'} }
function Get-DreamSkinPortListeners { param($Port) }
function Get-DreamSkinCodexDebugArgumentStatus { param($Processes,$Port) 'not-forwarded' }
function Start-DreamSkinCodexForDebugging { throw 'TEST BLOCKED: unexpected application start' }
function Start-DreamSkinCodexDirect { throw 'TEST BLOCKED: unexpected application reopen' }
function Start-Process { throw 'TEST BLOCKED: unexpected process start' }
function Stop-Process { throw 'TEST BLOCKED: unexpected process stop' }
'@
[IO.File]::WriteAllText((Join-Path $fakeEngine 'vendor/common-windows.ps1'),$fakeCommon,[Text.UTF8Encoding]::new($true))
$savedLocal=$env:LOCALAPPDATA
try {
  $env:LOCALAPPDATA=Join-Path $fixture 'state'
  $diagnostic= & (Join-Path $fakeEngine 'start-official.ps1') -DiagnoseOnly | ConvertFrom-Json
  Assert-Startup ($diagnostic.status -eq 'normal-running') 'Read-only diagnostics failed.'
  Assert-Startup (-not (Test-Path -LiteralPath $env:LOCALAPPDATA)) 'Diagnostics wrote session or status files.'
  $failed=$false
  try { & (Join-Path $fakeEngine 'start-official.ps1') | Out-Null } catch {
    Assert-Startup ($_.Exception.Message -like '*ordinary entry*') 'Unexpected startup failure.'
    $failed=$true
  }
  Assert-Startup $failed 'An ordinary running window was silently replaced.'
  $state=Get-Content -Raw (Join-Path $env:LOCALAPPDATA 'RhineLabTheme7/startup-status.json') | ConvertFrom-Json
  Assert-Startup ($state.status -eq 'normal-running') 'The recorded failure lost its specific state.'
  Assert-Startup (-not (Test-Path (Join-Path $env:LOCALAPPDATA 'RhineLabTheme7/session.json'))) 'An unverified session was persisted.'
  Pass 'actual launcher preserves a normal window, records its status, and supports side-effect-free diagnostics'
} finally { $env:LOCALAPPDATA=$savedLocal }
Write-Output ('PASS: '+$script:checks+' startup regression scenarios; no real application was launched or stopped.')
