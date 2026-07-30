@echo off
title Busan Convenience Map
where node >nul 2>nul
if errorlevel 1 (
  if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" (
    "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "%~dp0busan-map-server.js"
    exit /b %errorlevel%
  ) else (
    echo Node.js 18 or newer is required.
    echo Download: https://nodejs.org/
    pause
    exit /b 1
  )
)
node "%~dp0busan-map-server.js"
if errorlevel 1 (
  pause
)
