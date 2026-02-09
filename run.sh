#!/bin/bash

# Universal Logging System - Java Service Build Script (Unix/Linux/Mac)
# Compiles and runs the logging service

echo ""
echo "======================================================================"
echo "Universal Logging System - Java Logging Service"
echo "======================================================================"
echo ""

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "Error: Java is not installed or not in PATH"
    echo "Please install Java JDK and add it to your system PATH"
    exit 1
fi

# Display Java version
echo "Java version:"
java -version
echo ""

# Compile the Java service
echo "Compiling LoggingService.java..."
javac -encoding UTF-8 LoggingService.java
if [ $? -ne 0 ]; then
    echo "Error: Compilation failed"
    exit 1
fi
echo "Compilation successful!"
echo ""

# Run the Java service
echo "Running LoggingService..."
echo "Make sure the Python API is running on port 5000!"
echo ""
java LoggingService
