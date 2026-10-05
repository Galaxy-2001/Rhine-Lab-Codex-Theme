@echo off
chcp 65001 >nul
call dsh plugin --profile web add @linxin666/dsh-client-ui-skin-center@0.4.5
if errorlevel 1 (echo 安装失败，请查看上方错误。) else (echo 完成。请在 DSH 设置中打开皮肤中心，应用莱茵生命。)
pause
