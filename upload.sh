#!/bin/bash
echo "=== Browns ERP Git Force Push Utility ==="
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com
echo "Uploading code to GitHub..."
git push -f origin main
