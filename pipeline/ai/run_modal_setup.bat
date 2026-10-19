@echo off
cd /d "%~dp0"
echo LevlPrep Modal setup
where python >nul 2>nul
if errorlevel 1 (
  where py >nul 2>nul
  if errorlevel 1 (
    echo Python not found. Installing Python 3.12 with winget...
    winget install -e --id Python.Python.3.12 --scope user --accept-package-agreements --accept-source-agreements
    set "PATH=%LOCALAPPDATA%\Programs\Python\Python312;%LOCALAPPDATA%\Programs\Python\Python312\Scripts;%PATH%"
  )
)
where python >nul 2>nul
if not errorlevel 1 (
  python setup_modal.py
) else (
  py -3 setup_modal.py
)
