@echo off
setlocal enabledelayedexpansion

echo ========================================
echo Generating TypeScript from Go Modules
echo ========================================

REM Get GOPATH
for /f "delims=" %%i in ('go env GOPATH') do set GOPATH=%%i
echo GOPATH: %GOPATH%

REM Set proto paths
set DB_SERVICE_PROTO=%GOPATH%\pkg\mod\github.com\yhonda-ohishi\db_service@v1.3.0\src\proto
set SCRAPER_PROTO=%GOPATH%\pkg\mod\github.com\yhonda-ohishi\etc_meisai_scraper@v0.0.22\src\proto
set DESKTOP_SERVER_PROTO=..\desktop-server\proto
set LOCAL_PROTO=proto

echo.
echo Proto paths:
echo   - db_service: %DB_SERVICE_PROTO%
echo   - scraper: %SCRAPER_PROTO%
echo   - desktop-server: %DESKTOP_SERVER_PROTO%
echo   - local (google/api): %LOCAL_PROTO%
echo.

REM Create output directory
if not exist "src\generated" mkdir "src\generated"

REM Generate TypeScript
echo Generating TypeScript clients...
protoc ^
  --plugin=protoc-gen-ts=%~dp0protoc-gen-ts.bat ^
  --ts_opt=generate_dependencies ^
  --ts_out=src\generated ^
  --proto_path=%LOCAL_PROTO% ^
  --proto_path=%DB_SERVICE_PROTO% ^
  --proto_path=%SCRAPER_PROTO% ^
  --proto_path=%DESKTOP_SERVER_PROTO% ^
  %DB_SERVICE_PROTO%\ryohi.proto ^
  %SCRAPER_PROTO%\download.proto ^
  %SCRAPER_PROTO%\download_buffer.proto ^
  %DESKTOP_SERVER_PROTO%\database.proto

if errorlevel 1 (
  echo.
  echo ========================================
  echo ✗ Failed to generate proto files
  echo ========================================
  exit /b 1
)

echo.
echo ========================================
echo ✓ Proto files generated successfully!
echo ========================================
echo.
echo Generated files:
dir /b src\generated\*.ts
