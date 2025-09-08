const axios = require('axios');
const cookie = require('cookie');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local if available
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));

    lines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').trim();
        // Remove surrounding quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');
        process.env[key.trim()] = cleanValue;
      }
    });
  }
}

async function debugAuth() {
  console.log('🔍 DEBUGGING SUNO AUTHENTICATION\n');

  // Load environment variables from .env.local
  loadEnvFile();

  // Get cookie from environment
  const cookieString = process.env.SUNO_COOKIE;
  if (!cookieString) {
    console.error('❌ No SUNO_COOKIE environment variable found');
    console.error('💡 Make sure .env.local exists with SUNO_COOKIE=value');
    return;
  }

  console.log(`📝 Cookie length: ${cookieString.length} characters`);
  console.log(`📝 Cookie preview: ${cookieString.substring(0, 100)}...\n`);

  // Parse cookies
  const parsedCookies = cookie.parse(cookieString);
  console.log(`🍪 Parsed ${Object.keys(parsedCookies).length} cookies`);
  console.log(`🔑 Has __client: ${!!parsedCookies.__client}`);
  console.log(`📏 __client length: ${parsedCookies.__client?.length || 0}\n`);

  // Test Clerk API
  const CLERK_BASE_URL = 'https://clerk.suno.com';
  const CLERK_VERSION = '5.15.0';
  const getSessionUrl = `${CLERK_BASE_URL}/v1/client?_is_native=true&_clerk_js_version=${CLERK_VERSION}`;

  console.log(`🌐 Testing Clerk API: ${getSessionUrl}`);

  try {
    const response = await axios.get(getSessionUrl, {
      headers: {
        'Authorization': parsedCookies.__client,
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    });

    console.log(`✅ Clerk API responded with status: ${response.status}`);
    console.log(`📊 Response data keys: ${Object.keys(response.data || {})}`);

    if (response.data?.response?.last_active_session_id) {
      console.log(`🎉 SUCCESS! Session ID: ${response.data.response.last_active_session_id}`);
      console.log('\n🔧 Cookie is VALID - API should work!');
    } else {
      console.log('❌ Response missing last_active_session_id');
      console.log('Full response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.log(`❌ Clerk API failed: ${error.message}`);

    if (error.response) {
      console.log(`📊 Error status: ${error.response.status}`);
      console.log(`📝 Error data:`, JSON.stringify(error.response.data, null, 2));
    } else if (error.code === 'ECONNREFUSED') {
      console.log('🌐 Connection refused - check your internet connection');
    } else {
      console.log(`🔍 Error code: ${error.code}`);
    }
  }
}

// Run the debug
debugAuth().catch(console.error);
