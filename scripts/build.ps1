$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$runtime=Join-Path $root 'runtime'
$version=(Get-Content -LiteralPath (Join-Path $root 'VERSION') -Raw).Trim()
if($version -notmatch '^\d+\.\d+\.\d+$'){throw 'Invalid release version.'}
$compiler=Join-Path $env:WINDIR 'Microsoft.NET\Framework64\v4.0.30319\csc.exe'
if(-not(Test-Path -LiteralPath $compiler)){throw 'The Windows x64 .NET Framework C# compiler was not found.'}
Push-Location $runtime
try{& $compiler /nologo /target:winexe /platform:x64 /optimize+ /out:RhineLabTheme.exe /win32icon:assets\codex-white.ico /reference:System.Windows.Forms.dll /reference:System.Drawing.dll /reference:System.Web.Extensions.dll Manager.cs;if($LASTEXITCODE -ne 0){throw 'Manager compilation failed.'}}finally{Pop-Location}
Copy-Item -LiteralPath (Join-Path $root 'LICENSE') -Destination (Join-Path $runtime 'LICENSE') -Force
Copy-Item -LiteralPath (Join-Path $root 'THIRD_PARTY_NOTICES.md') -Destination $runtime -Force
# Windows PowerShell 5.1 needs a BOM for Chinese script text.
foreach($file in Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.ps1'|Where-Object{$_.FullName -notlike '*\node_modules\*' -and $_.FullName -notlike '*\dist\*' -and $_.FullName -notlike '*\.checks\*'}){
  $text=[IO.File]::ReadAllText($file.FullName);$text=$text -replace '\r?\n',"`r`n"
  [IO.File]::WriteAllText($file.FullName,$text,[Text.UTF8Encoding]::new($true))
}
$commands=@{'安装主题.cmd'='install';'启动主题.cmd'='start';'恢复与卸载.cmd'='uninstall';'安装可选 Skill.cmd'='install-skill'}
foreach($name in $commands.Keys){
  $text=@('@echo off','chcp 65001 >nul','cd /d "%~dp0"',('powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\entry.ps1" -Action '+$commands[$name]),'set "rhine_exit=%errorlevel%"','echo.','pause','exit /b %rhine_exit%') -join "`r`n"
  [IO.File]::WriteAllText((Join-Path $root $name),$text+"`r`n",[Text.UTF8Encoding]::new($false))
}
$runtimeNames=@('RhineLabTheme.exe','Manager.cs','install.ps1','install-core.ps1','uninstall.ps1','package-common.ps1','appearance.mjs','start-official.ps1','theme.ps1','engine.mjs','cdp.mjs','renderer.js','LICENSE','THIRD_PARTY_NOTICES.md','assets/theme.css','assets/codex-white.ico','assets/rhine-lab-light.json','assets/rhine-lab-dark.json','vendor/common-windows.ps1','vendor/config-utf8.ps1','vendor/LICENSE','vendor/provenance.json','vendor/smol-toml/index.cjs','vendor/smol-toml/LICENSE','vendor/smol-toml/provenance.json')
$runtimeNames+=@(Get-ChildItem -LiteralPath (Join-Path $runtime 'assets') -Filter '*.svg' -File|ForEach-Object{'assets/'+$_.Name})
$entries=@(foreach($name in $runtimeNames|Sort-Object){$file=Get-Item -LiteralPath (Join-Path $runtime $name);if($file.Attributes -band [IO.FileAttributes]::ReparsePoint){throw 'Package file is a link.'};@{path=$name;sha256=(Get-FileHash -LiteralPath $file.FullName).Hash.ToLowerInvariant();size=$file.Length}})
$manifest=@{id='rhine-lab';version=$version;runtime='official-store-cdp';files=$entries}
[IO.File]::WriteAllText((Join-Path $runtime 'manifest.json'),($manifest|ConvertTo-Json -Depth 5),[Text.UTF8Encoding]::new($false))
$dist=Join-Path $root 'dist';New-Item -ItemType Directory -Path $dist -Force|Out-Null
$stage=Join-Path $dist ('build-'+[Guid]::NewGuid().ToString('N'));New-Item -ItemType Directory -Path $stage|Out-Null
Add-Type -AssemblyName System.IO.Compression
function Write-RhineZip([string]$Destination,[string]$Base,[string[]]$Files,[string]$Prefix){
  $temporary=$Destination+'.tmp'
  $stream=[IO.File]::Open($temporary,[IO.FileMode]::Create)
  $zip=[IO.Compression.ZipArchive]::new($stream,[IO.Compression.ZipArchiveMode]::Create)
  try{
    foreach($relative in $Files|Sort-Object -Unique){
      $entry=$zip.CreateEntry(($Prefix+'/'+$relative).Replace('\','/'),[IO.Compression.CompressionLevel]::Optimal)
      $input=[IO.File]::OpenRead((Join-Path $Base $relative));$output=$entry.Open()
      try{$input.CopyTo($output)}finally{$input.Dispose();$output.Dispose()}
    }
  }finally{$zip.Dispose();$stream.Dispose()}
  Move-Item -LiteralPath $temporary -Destination $Destination -Force
}
try{
  $rootFiles=@('README.md','LICENSE','THIRD_PARTY_NOTICES.md','CHANGELOG.md','VERSION','.gitignore','.gitattributes')
  $documents=@(Get-ChildItem -LiteralPath (Join-Path $root 'docs') -File|Where-Object{$_.Extension -in @('.md','.svg')}|ForEach-Object{'docs/'+$_.Name})
  $runtimeFiles=@($runtimeNames|ForEach-Object{'runtime/'+$_})+@('runtime/manifest.json')
  $skillTemplate=@('skill/rhine-lab-theme/SKILL.md','skill/rhine-lab-theme/scripts/theme.ps1','skill/rhine-lab-theme/agents/openai.yaml')
  $userFiles=$rootFiles+$documents+$runtimeFiles+$skillTemplate+@('scripts/entry.ps1')+@($commands.Keys)
  $sourceFiles=$userFiles+@('scripts/build.ps1','scripts/generate-watermark.mjs','scripts/ribbon-geometry.mjs','tests/ribbon.test.mjs','tests/appearance.test.mjs','tests/package.test.ps1')
  Write-RhineZip (Join-Path $dist ('Rhine-Lab-Codex-Theme-'+$version+'-Windows.zip')) $root $userFiles 'Rhine-Lab-Codex-Theme'
  Write-RhineZip (Join-Path $dist ('Rhine-Lab-Codex-Theme-'+$version+'-Source.zip')) $root $sourceFiles 'Rhine-Lab-Codex-Theme'
  $skill=Join-Path $stage 'rhine-lab-theme';New-Item -ItemType Directory -Path $skill|Out-Null
  foreach($item in Get-ChildItem -LiteralPath (Join-Path $root 'skill/rhine-lab-theme')){Copy-Item -LiteralPath $item.FullName -Destination $skill -Recurse -Force}
  New-Item -ItemType Directory -Path (Join-Path $skill 'assets/runtime') -Force|Out-Null
  foreach($relative in $runtimeNames+@('manifest.json')){$destination=Join-Path $skill ('assets/runtime/'+$relative);New-Item -ItemType Directory -Path (Split-Path $destination -Parent) -Force|Out-Null;Copy-Item -LiteralPath (Join-Path $runtime $relative) -Destination $destination}
  New-Item -ItemType Directory -Path (Join-Path $skill 'references/docs') -Force|Out-Null
  Copy-Item -LiteralPath (Join-Path $root 'README.md') -Destination (Join-Path $skill 'references/user-guide.md')
  Copy-Item -LiteralPath (Join-Path $root 'THIRD_PARTY_NOTICES.md') -Destination (Join-Path $skill 'references')
  foreach($doc in $documents){Copy-Item -LiteralPath (Join-Path $root $doc) -Destination (Join-Path $skill 'references/docs')}
  $skillFiles=@(Get-ChildItem -LiteralPath $skill -Recurse -File|ForEach-Object{$_.FullName.Substring($skill.Length+1)})
  Write-RhineZip (Join-Path $dist ('rhine-lab-theme-'+$version+'-skill.zip')) $skill $skillFiles 'rhine-lab-theme'
  $sums=@(Get-ChildItem -LiteralPath $dist -Filter ('*'+$version+'*.zip') -File|Sort-Object Name|ForEach-Object{(Get-FileHash -LiteralPath $_.FullName).Hash.ToLowerInvariant()+'  '+$_.Name})
  [IO.File]::WriteAllText((Join-Path $dist 'SHA256SUMS.txt'),($sums -join "`n")+"`n",[Text.UTF8Encoding]::new($false))
}finally{
  . (Join-Path $runtime 'package-common.ps1')
  if(Test-Path -LiteralPath $stage){Remove-RhineTree $stage $dist}
}
Get-ChildItem -LiteralPath $dist -File|Select-Object Name,Length
