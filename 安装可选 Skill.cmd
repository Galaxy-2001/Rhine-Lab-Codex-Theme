@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\entry.ps1" -Action install-skill
set "rhine_exit=%errorlevel%"
echo.
pause
exit /b %rhine_exit%
