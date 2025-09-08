#!/bin/bash

# Quick test script after updating cookie
API_URL="https://suno-api-workers.biomimic.workers.dev"

echo "1. Testing authentication..."
curl -X GET "$API_URL/api/get_limit" -s | python -m json.tool

echo -e "\n2. Testing lyrics generation..."
curl -X POST "$API_URL/api/generate_lyrics" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A song about deploying to Cloudflare Workers"}' \
  -s | python -m json.tool

echo -e "\n3. Testing music generation (no wait)..."
curl -X POST "$API_URL/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "An upbeat electronic song about serverless computing",
    "make_instrumental": false,
    "wait_audio": false
  }' -s | python -m json.tool
