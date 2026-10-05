param([ValidateSet('install','start','uninstall','install-skill','check')][string]$Action='install')
$ErrorActionPreference='Stop'
$root=Split-Path $PSScriptRoot -Parent
$runtime=Join-Path $root 'runtime'
try{
  . (Join-Path $runtime 'package-common.ps1')
  $null=Read-RhineManifest $runtime
  switch($Action){
    'check'{& (Join-Path $runtime 'install.ps1') -CheckOnly}
    'install'{& (Join-Path $runtime 'install.ps1')}
    'uninstall'{& (Join-Path $runtime 'uninstall.ps1')}
    'start'{
      $launcher=Join-Path $env:LOCALAPPDATA 'RhineLabTheme7\engine\RhineLabTheme.exe'
      if(-not(Test-Path -LiteralPath $launcher)){throw '请先运行“安装主题.cmd”。'}
      Start-Process -FilePath $launcher -WindowStyle Hidden
    }
    'install-skill'{
      $codexRoot=if($env:CODEX_HOME){$env:CODEX_HOME}else{Join-Path $env:USERPROFILE '.codex'}
      $skill=Join-Path $codexRoot 'skills\rhine-lab-theme'
      Assert-RhinePath $skill $codexRoot
      $stage=Join-Path $codexRoot ('skill-staging-'+[Guid]::NewGuid().ToString('N'))
      Assert-RhinePath $stage $codexRoot
      $backup=$null
      try{
        New-Item -ItemType Directory -Path $stage -Force|Out-Null
        foreach($item in Get-ChildItem -LiteralPath (Join-Path $root 'skill\rhine-lab-theme')){Copy-Item -LiteralPath $item.FullName -Destination $stage -Recurse -Force}
        Copy-RhineRuntime $runtime (Join-Path $stage 'assets\runtime') $codexRoot
        New-Item -ItemType Directory -Path (Join-Path $stage 'references') -Force|Out-Null
        Copy-Item -LiteralPath (Join-Path $root 'README.md') -Destination (Join-Path $stage 'references\user-guide.md')
        Copy-Item -LiteralPath (Join-Path $root 'THIRD_PARTY_NOTICES.md') -Destination (Join-Path $stage 'references')
        Copy-Item -LiteralPath (Join-Path $root 'docs') -Destination (Join-Path $stage 'references') -Recurse
        foreach($file in Get-ChildItem -LiteralPath $stage -Recurse -File){Unblock-File -LiteralPath $file.FullName}
        if(Test-Path -LiteralPath $skill){
          $backup=Join-Path $codexRoot ('skill-backups\rhine-lab-theme-'+[DateTime]::Now.ToString('yyyyMMdd-HHmmss')+'-'+[Guid]::NewGuid().ToString('N').Substring(0,8))
          Assert-RhinePath $backup $codexRoot
          foreach($item in Get-ChildItem -LiteralPath $skill -Recurse -Force){Assert-RhinePath $item.FullName $codexRoot}
          New-Item -ItemType Directory -Path (Split-Path $backup -Parent) -Force|Out-Null
          Move-Item -LiteralPath $skill -Destination $backup
        }
        New-Item -ItemType Directory -Path (Split-Path $skill -Parent) -Force|Out-Null
        Move-Item -LiteralPath $stage -Destination $skill
      }catch{
        if($backup -and (Test-Path -LiteralPath $backup) -and -not(Test-Path -LiteralPath $skill)){
          Assert-RhinePath $backup $codexRoot;Assert-RhinePath $skill $codexRoot
          Move-Item -LiteralPath $backup -Destination $skill
        }
        throw
      }finally{if(Test-Path -LiteralPath $stage){Remove-RhineTree $stage $codexRoot}}
      Write-Output ('Skill 已安装：'+$skill)
      Write-Output '在新聊天中可说“安装莱茵生命主题”“应用莱茵生命主题”或“暂停缺口动画”。'
    }
  }
}catch{Write-Host ('操作未完成：'+$_.Exception.Message) -ForegroundColor Red;exit 1}
