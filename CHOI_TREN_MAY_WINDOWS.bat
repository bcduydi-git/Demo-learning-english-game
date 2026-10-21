@echo off
chcp 65001 >nul
title Beacon Isle - may chu
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Chua cai Node.js. Hay tai ban LTS tai https://nodejs.org roi chay lai file nay.
  pause
  exit /b
)
echo Dang chuan bi (lan dau se lau hon mot chut)...
call npm install --no-audit --no-fund
call npm run build
start "" http://localhost:8080
echo Dang chay game. Dong cua so nay de tat may chu.
call npm start
pause
