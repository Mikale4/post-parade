@echo off
rem ---------------------------------------------------------------------------
rem  Umamusume: Post Parade -- double-click this to play.
rem
rem  The game cannot be opened by double-clicking race\index.html. Its art lives
rem  in sibling folders (Racers\, backgrounds\, audio\, cards\), and a page opened
rem  straight off the disk is not allowed to reach them -- you would get the game
rem  with every portrait and background missing. So this serves the whole folder
rem  over a tiny local web server instead, and opens the right page in your browser.
rem
rem  Leave this black window open while you play. Closing it stops the server,
rem  which is also how you quit.
rem ---------------------------------------------------------------------------

title Umamusume Post Parade - server (keep this window open)
cd /d "%~dp0"

rem Python ships the server; nothing is installed and nothing leaves this machine.
where python >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Python was not found on this computer.
  echo   Umamusume: Post Parade needs it to serve the game folder.
  echo.
  echo   Install it from https://www.python.org/downloads/ and tick
  echo   "Add python.exe to PATH" during setup, then run this again.
  echo.
  pause
  exit /b 1
)

set PORT=8712
set URL=http://localhost:%PORT%/race/index.html

echo.
echo   Umamusume: Post Parade
echo   ----------------------
echo   Serving "%CD%"
echo   Opening %URL%
echo.
echo   Keep this window open while you play. Close it to quit.
echo.

rem Give the server a moment to bind before the browser asks for the page.
start "" /b cmd /c "timeout /t 2 /nobreak >nul & start """" ""%URL%"""

rem -d . serves this folder, so ..\Racers and ..\backgrounds resolve from race\.
python -m http.server %PORT% -d .

rem Only reached if the server exits on its own -- usually the port being taken.
echo.
echo   The server stopped. If it closed immediately, port %PORT% may already be
echo   in use by another copy of this window.
echo.
pause
