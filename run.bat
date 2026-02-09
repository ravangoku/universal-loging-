@echo off
REM Universal Logging System - Java Service Build Script (Windows)
REM Compiles and runs the logging service

echo.
echo ======================================================================
echo Universal Logging System - Java Logging Service
echo ======================================================================
echo.

REM Check if Java is installed
where java >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: Java is not installed or not in PATH
    echo Please install Java JDK and add it to your system PATH
    exit /b 1
)

REM Display Java version
echo Java version:
java -version
echo.

REM Compile the Java service
echo Compiling LoggingService.java...
javac -encoding UTF-8 LoggingService.java
if %errorlevel% neq 0 (
    echo Error: Compilation failed
    exit /b 1
)
echo Compilation successful!
echo.

REM Run the Java service
echo Running LoggingService...
echo Make sure the Python API is running on port 5000!
echo.
java LoggingService

pause
