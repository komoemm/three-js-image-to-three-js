@echo off
title img2threejs 3D Model Viewer
echo Starting img2threejs interactive 3D workbench...
cd /d "%~dp0viewer"
start http://localhost:5173/
npm run dev
pause
