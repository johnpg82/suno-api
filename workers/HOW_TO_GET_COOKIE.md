# How to Get Your Suno Cookie

## Steps to obtain your Suno cookie:

1. **Open Suno.ai in your browser**
   - Go to https://suno.com/create
   - Make sure you're logged in

2. **Open Developer Tools**
   - Press `F12` or right-click and select "Inspect"
   - Go to the **Network** tab

3. **Refresh the page**
   - Press `F5` or click the refresh button

4. **Find the right request**
   - Look for any request that includes `?__clerk_api_version` in the URL
   - Click on that request

5. **Copy the Cookie**
   - Go to the **Headers** tab
   - Find the **Cookie** section under Request Headers
   - Copy the entire cookie value (it's usually very long)

## What the cookie looks like:

The cookie will be a long string that includes values like:
```
__client=eyJ....; __client_uat=1234567890; ajs_user_id=...; ajs_anonymous_id=...; [and many more]
```

## Setting the Cookie:

### For Cloudflare Dashboard:
1. Go to your Cloudflare Dashboard
2. Navigate to Workers & Pages → suno-api-workers → Settings → Variables
3. Add variable name: `SUNO_COOKIE`
4. Add variable value: [paste your entire cookie string]
5. Click "Save"

### For API Requests:
Include the cookie in the `Cookie` header:
```bash
curl -X POST "https://suno-api-workers.biomimic.workers.dev/api/generate" \
  -H "Cookie: [your-entire-cookie-string-here]" \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test"}'
```

## Important Notes:
- The cookie expires after some time, so you may need to update it periodically
- Make sure to copy the ENTIRE cookie string, not just parts of it
- The cookie must include the `__client` value to work properly
