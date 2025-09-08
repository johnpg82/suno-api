#!/bin/bash

# Script to deploy Cloudflare Workers with environment variables
# This handles the complex cookie string properly

echo "🔧 Setting up environment variables..."

# Read the cookie from the main .env.local file
SUNO_COOKIE=$(cat ../.env.local | grep SUNO_COOKIE | cut -d'=' -f2 | sed 's/^"//' | sed 's/"$//')
TWOCAPTCHA_KEY=$(cat ../.env.local | grep TWOCAPTCHA_KEY | cut -d'=' -f2 | sed 's/^"//' | sed 's/"$//')

echo "📝 Cookie length: ${#SUNO_COOKIE} characters"
echo "🔑 API Key: ${TWOCAPTCHA_KEY:0:10}..."

echo "🚀 Deploying to Cloudflare Workers..."
npx wrangler deploy --var SUNO_COOKIE:"$SUNO_COOKIE" --var TWOCAPTCHA_KEY:"$TWOCAPTCHA_KEY"

echo "✅ Deployment complete!"
echo "🌐 API URL: https://suno-api-workers.biomimic.workers.dev"
echo ""
echo "🧪 Test commands:"
echo "curl https://suno-api-workers.biomimic.workers.dev/api/get_limit"
echo "curl -X POST https://suno-api-workers.biomimic.workers.dev/api/generate -H 'Content-Type: application/json' -d '{\"prompt\": \"A happy song about coding\"}'"
