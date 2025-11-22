#!/bin/bash

echo "🎵 Testing Suno API with Fresh Cookie"
echo "====================================="
echo ""

# Check if server is running
echo "1. Checking if server is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Server is running at http://localhost:3000"
else
    echo "❌ Server is not running. Start it with: npm run dev"
    exit 1
fi

echo ""
echo "2. Testing account limits..."
response=$(curl -s "http://localhost:3000/api/get_limit" -H "Content-Type: application/json")
if echo "$response" | grep -q "error"; then
    echo "❌ Account limits check failed: $response"
else
    echo "✅ Account limits: $response"
fi

echo ""
echo "3. Testing lyrics generation..."
response=$(curl -s -X POST "http://localhost:3000/api/generate_lyrics" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A happy song about coding and APIs"}')
if echo "$response" | grep -q "error"; then
    echo "❌ Lyrics generation failed: $response"
else
    echo "✅ Lyrics generation successful!"
    echo "Response: $response"
fi

echo ""
echo "4. Testing music generation (basic)..."
response=$(curl -s -X POST "http://localhost:3000/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "An upbeat electronic song about serverless computing",
    "make_instrumental": false,
    "wait_audio": false
  }')
if echo "$response" | grep -q "error"; then
    echo "❌ Music generation failed: $response"
else
    echo "✅ Music generation successful!"
    echo "Response preview: $(echo "$response" | head -c 200)..."
fi

echo ""
echo "🎉 Testing complete!"
echo ""
echo "If all tests passed, your Suno API is working correctly!"
echo "If you see errors, your cookie may still be expired - try getting a fresh one."

