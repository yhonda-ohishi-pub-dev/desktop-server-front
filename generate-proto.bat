@echo off
setlocal
set PLUGIN=%~dp0protoc-gen-ts.bat

echo Generating TypeScript from proto files...

if not exist "src\generated" mkdir "src\generated"

REM Generate for all proto files in proto directory
for %%f in (proto\*.proto) do (
  echo Compiling %%f...
  protoc --plugin=protoc-gen-ts=%PLUGIN% --ts_opt=generate_dependencies --ts_out=src\generated --proto_path=proto %%f
  if errorlevel 1 (
    echo ✗ Failed to compile %%f
    exit /b 1
  )
)

echo ✓ All proto files compiled successfully!
echo ✓ Generated TypeScript clients for gRPC-Web
