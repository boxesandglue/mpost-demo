#!/bin/bash

# Build script for mpgo WASM demo

set -e

echo "Building WASM..."
GOWORK=off GOOS=js GOARCH=wasm go build -o main.wasm .

echo "Copying wasm_exec.js..."
# Go 1.24+ uses lib/wasm, older versions use misc/wasm
if [ -f "$(go env GOROOT)/lib/wasm/wasm_exec.js" ]; then
    cp "$(go env GOROOT)/lib/wasm/wasm_exec.js" .
else
    cp "$(go env GOROOT)/misc/wasm/wasm_exec.js" .
fi

echo "Build complete!"
echo ""
echo "To run the demo:"
echo "  cd wasm-demo"
echo "  python3 -m http.server 8080"
echo "  # Then open http://localhost:8080 in your browser"
