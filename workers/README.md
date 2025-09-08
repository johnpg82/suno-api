# Suno API for Cloudflare Workers

This is a Cloudflare Workers implementation of the Suno API, utilizing Cloudflare's Browser Rendering with Playwright for CAPTCHA solving.

## Prerequisites

1. A Cloudflare account with Workers and Browser Rendering enabled
2. A Suno.ai account cookie
3. A 2Captcha API key (for CAPTCHA solving)
4. Node.js and npm installed

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.dev.vars` file in the workers directory with your credentials:
```
SUNO_COOKIE=your_suno_cookie_here
TWOCAPTCHA_KEY=your_2captcha_key_here
```

3. Deploy to Cloudflare Workers:
```bash
npm run deploy
```

## Local Development

To run locally:
```bash
npm run dev
```

This will start the worker on `http://localhost:8787`

## Environment Variables

- `SUNO_COOKIE`: Your Suno.ai session cookie (required)
- `TWOCAPTCHA_KEY`: Your 2Captcha API key for solving CAPTCHAs (required)

## API Endpoints

- `POST /api/generate` - Generate music from a prompt
- `POST /api/custom_generate` - Generate music with custom parameters
- `POST /api/generate_lyrics` - Generate lyrics only
- `GET /api/get` - Get audio information
- `GET /api/get_limit` - Get account credits/limits

## Example Usage

```bash
# Generate music
curl -X POST https://your-worker.workers.dev/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A happy song about coding",
    "make_instrumental": false,
    "wait_audio": false
  }'

# Generate with custom parameters
curl -X POST https://your-worker.workers.dev/api/custom_generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Verse about the beauty of nature",
    "tags": "folk, acoustic",
    "title": "Nature's Song",
    "make_instrumental": false,
    "wait_audio": true
  }'
```

## Deployment

1. Make sure you have wrangler installed and authenticated:
```bash
npm install -g wrangler
wrangler login
```

2. Deploy the worker:
```bash
npm run deploy
```

3. Set your environment variables in the Cloudflare dashboard:
   - Go to Workers & Pages > Your Worker > Settings > Variables
   - Add `SUNO_COOKIE` and `TWOCAPTCHA_KEY`

## Important Note About Environment Variables

After deployment, you **must** configure your environment variables in the Cloudflare dashboard:

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to Workers & Pages > suno-api-workers
3. Go to Settings > Variables
4. Add the following environment variables:
   - `SUNO_COOKIE`: Your Suno.ai session cookie
   - `TWOCAPTCHA_KEY`: Your 2Captcha API key

Without these variables, the API will not function properly.

## Notes

- The Browser Rendering feature requires a paid Cloudflare Workers plan
- CAPTCHA solving integration with 2Captcha is simplified in this version
- Some features from the original API may be limited due to Workers constraints

## Limitations

- File system operations are not supported in Workers
- Some browser automation features may be limited
- Maximum execution time is subject to Workers limits
