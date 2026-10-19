@echo off
setlocal
cd /d "%~dp0"
where g++ >nul 2>nul
if errorlevel 1 (
  echo ERROR: g++ was not found. Install MinGW-w64 and add its bin folder to PATH.
  pause
  exit /b 1
)
echo Building Smart Emergency Response C++ API bridge...
g++ -std=c++17 -O2 -Iinclude src\api_bridge.cpp src\Emergency.cpp src\EmergencyManager.cpp src\Graph.cpp src\PriorityManager.cpp src\Resource.cpp src\ResourceManager.cpp src\RouteUtils.cpp src\SeverityCalculator.cpp -o api_bridge.exe
if errorlevel 1 (
  echo Build failed. Check the compiler errors above.
  pause
  exit /b 1
)
echo Build successful: api_bridge.exe updated.
pause
