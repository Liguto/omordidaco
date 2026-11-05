@echo off
title Enviar O Mordidaco para o GitHub
cd /d "%~dp0"
echo ========================================================
echo   Enviando O Mordidaco para o GitHub...
echo ========================================================
echo.
git push -u origin main
echo.
pause
