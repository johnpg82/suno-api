#!/bin/bash

# Example test script for the Suno API on Cloudflare Workers
# Replace PASTE_YOUR_SUNO_COOKIE_HERE with your actual Suno cookie

API_URL="https://suno-api-workers.biomimic.workers.dev"
SUNO_COOKIE="PASTE_YOUR_SUNO_COOKIE_HERE"

echo "Testing Suno API on Cloudflare Workers..."
echo "==========================================="

# Test 1: Get account limits (to verify authentication)
echo -e "\n1. Testing GET /api/get_limit"
curl -X GET "$API_URL/api/get_limit" \
  -H "Cookie: $SUNO_COOKIE" \
  -H "Content-Type: application/json" | jq '.'

# Test 2: Generate lyrics
echo -e "\n\n2. Testing POST /api/generate_lyrics"
curl -X POST "$API_URL/api/generate_lyrics" \
  -H "Cookie: $SUNO_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A happy song about coding on Cloudflare Workers"
  }' | jq '.'

# Test 3: Generate music (without waiting for audio)
echo -e "\n\n3. Testing POST /api/generate"
curl -X POST "$API_URL/api/generate" \
  -H "Cookie: $SUNO_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A happy electronic song about cloud computing",
    "make_instrumental": false,
    "wait_audio": false
  }' | jq '.'

# Test 4: Custom generate with tags
echo -e "\n\n4. Testing POST /api/custom_generate"
curl -X POST "$API_URL/api/custom_generate" \
  -H "Cookie: $SUNO_COOKIE" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Verse about the beauty of serverless architecture",
    "tags": "electronic, upbeat",
    "title": "Cloudflare Song",
    "make_instrumental": false,
    "wait_audio": false
  }' | jq '.'
