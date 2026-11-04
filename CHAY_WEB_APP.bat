@echo off
title Web App Quan Ly Giai Cau Long
cd /d "%~dp0"

echo =======================================================
echo    KHOI DONG WEB APP QUAN LY GIAI CAU LONG
echo =======================================================
echo.
echo [*] Dang khoi dong may chu...
echo [*] Trinh duyet se tu dong mo http://localhost:5173
echo [*] Neu khong tu mo, hay truy cap: http://localhost:5173
echo.
echo Chu y: KHONG DONG cua so nay khi dang dung web app!
echo =======================================================
echo.

call npm.cmd run dev -- --open

if %ERRORLEVEL% neq 0 (
    echo.
    echo [LOI] Khong the chay 'npm run dev'. Ma loi: %ERRORLEVEL%
)

echo.
pause
