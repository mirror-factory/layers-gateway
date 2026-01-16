#!/bin/bash
# Run this manually: ./run-test.sh
export AI_GATEWAY_API_KEY=vck_4scut4ubleBRZpHenKJBEMEK2oOSwVgn8NdBXAVkCEyUtr7GOv3plspc
cd /home/dev/repos/layers-dev
node quick-test.js 2>&1 | tee /home/dev/test-results.txt
echo "Results saved to /home/dev/test-results.txt"
