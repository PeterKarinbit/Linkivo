#!/bin/bash

# Configuration
COLLECTION="Linkivo_API_Tests.collection.json"
ENVIRONMENT="Linkivo_Environment.json"
TARGET_URL="https://linkivo-backend.onrender.com"

echo "Started API Monitor for $TARGET_URL"
echo "Press [CTRL+C] to stop."

while true; do
    TIMESTAMP=$(date +"%H:%M:%S")
    echo "[$TIMESTAMP] Running tests..."
    
    # Run silently, only output if failed? Or just minimal output.
    # We use grep to just show the final summary line usually printed by newman cli
    npx newman run "$COLLECTION" \
        -e "$ENVIRONMENT" \
        --env-var "base_url=$TARGET_URL" \
        --reporters cli \
        --reporter-cli-no-banner \
        --insecure > /tmp/linkivo_test_run.log 2>&1
        
    if [ $? -eq 0 ]; then
        echo "[$TIMESTAMP] ✅ PASS"
    else
        echo "[$TIMESTAMP] ❌ FAIL"
        # Print the last few lines of the log to see what failed
        tail -n 20 /tmp/linkivo_test_run.log
    fi
    
    echo "Sleeping for 10 minutes..."
    sleep 600
done
