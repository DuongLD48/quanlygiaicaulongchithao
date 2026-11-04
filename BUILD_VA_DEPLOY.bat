@echo off
title Xuat Ban Web App Len GitHub Pages
cd /d "%~dp0"

echo =======================================================
echo     XUAT BAN WEB APP LEN GITHUB PAGES (1-CLICK)
echo =======================================================
echo.

echo [*] Dang kiem tra va build ma nguon (npm run build)...
call npm.cmd run build
if %ERRORLEVEL% neq 0 (
    echo.
    echo [X] Co loi xay ra trong qua trinh build!
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo [*] Build thanh cong! Dang day len nhanh gh-pages...
call npm.cmd run deploy
if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Chua the deploy. Hay chac chan ban da lien ket voi GitHub repository.
    echo     Xem file HUONG_DAN_SU_DUNG.md de biet chi tiet.
    echo.
    pause
    exit /b %ERRORLEVEL%
)

echo.
echo =======================================================
echo [V] DA XUAT BAN THANH CONG LEN GITHUB PAGES!
echo =======================================================
echo.
pause
