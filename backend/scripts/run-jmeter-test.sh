#!/bin/bash

# Check if JMeter is installed
if ! command -v jmeter &> /dev/null; then
    echo "JMeter is not installed. Please install it first."
    echo "You can download it from: https://jmeter.apache.org/download_jmeter.cgi"
    exit 1
fi

# Create results directory if it doesn't exist
RESULTS_DIR="jmeter-results"
mkdir -p $RESULTS_DIR

# Run the test plan
echo "Starting JMeter test..."
jmeter -n \
    -t jmeter/bookstore-test-plan.jmx \
    -l $RESULTS_DIR/results.jtl \
    -e -o $RESULTS_DIR/report

echo "Test completed. Results are available in the $RESULTS_DIR directory." 