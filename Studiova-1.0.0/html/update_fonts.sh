#!/bin/bash

# Add custom fonts CSS to all HTML files
find /home/peter-karingithi/Videos/Linkivo/Studiova-1.0.0/html -type f -name "*.html" -exec sed -i '/<link.*styles\.css" \/>/a \  <link rel="stylesheet" href="../assets/css/custom-fonts.css" />' {} \;

echo "Custom fonts CSS has been added to all HTML files"
