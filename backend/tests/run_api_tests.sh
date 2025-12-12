#!/bin/bash

# Configuration
COLLECTION="Linkivo_API_Tests.collection.json"
ENVIRONMENT="Linkivo_Environment.json"
REPORT_DIR="reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Create report directory
mkdir -p $REPORT_DIR

echo "=========================================="
echo "🚀 Starting Linkivo API Tests"
echo "=========================================="
echo "Date: $(date)"

# Prompt for target
echo ""
echo "Select target environment:"
echo "1) Localhost (http://localhost:3000)"
echo "2) Production (https://linkivo-backend.onrender.com)"
read -p "Enter choice [1]: " choice
choice=${choice:-1}

if [ "$choice" -eq "2" ]; then
    BASE_URL="https://linkivo-backend.onrender.com"
    REPORT_NAME="Production_Report_$TIMESTAMP.html"
    echo "🌍 Targeting: PRODUCTION ($BASE_URL)"
else
    BASE_URL="http://localhost:3000"
    REPORT_NAME="Local_Report_$TIMESTAMP.html"
    echo "💻 Targeting: LOCALHOST ($BASE_URL)"
fi

echo "=========================================="
echo "Running tests..."
echo "=========================================="

# Run Newman using npx (no global install needed)
npx newman run "$COLLECTION" \
    -e "$ENVIRONMENT" \
    --env-var "base_url=$BASE_URL" \
    --reporters cli,htmlextra \
    --reporter-htmlextra-export "$REPORT_DIR/$REPORT_NAME" \
    --insecure

EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Tests PASSED!"
else
    echo "❌ Tests FAILED!"
fi
echo "=========================================="
echo "📄 HTML Report generated at: $REPORT_DIR/$REPORT_NAME"
echo ""
