@echo off
setlocal enabledelayedexpansion

set "base=C:\Users\USER\playa"

for /d %%D in ("%base%\*") do (
    set "folder=%%~nxD"
    dir "%%D" /s /b > "%base%\list_!folder!.txt"
)

echo Done!
pause