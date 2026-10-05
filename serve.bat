@echo off
REM Starts a local web server for the UEQ-S site and opens it in your browser.
REM Requires Python (https://www.python.org/). Close this window to stop the server.
cd /d "%~dp0"
start "" http://localhost:8000/index.html
python -m http.server 8000
