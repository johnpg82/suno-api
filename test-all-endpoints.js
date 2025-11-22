#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(name, method, url, data = null) {
  console.log(`\n🧪 Testing ${name}...`);
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);

    if (response.status === 200) {
      console.log(`✅ ${name}: SUCCESS`);
      if (response.data) {
        // Show summary for different response types
        if (Array.isArray(response.data)) {
          console.log(`   📊 Generated ${response.data.length} items`);
          if (response.data[0]?.id) {
            console.log(`   🎵 First item ID: ${response.data[0].id}`);
          }
        } else if (response.data.text) {
          console.log(`   📝 Generated lyrics: ${response.data.title || 'Untitled'}`);
        } else if (response.data.credits_left !== undefined) {
          console.log(`   💰 Credits: ${response.data.credits_left}/${response.data.monthly_limit}`);
        }
      }
      return true;
    } else {
      console.log(`❌ ${name}: FAILED (${response.status})`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`);
    if (error.response) {
      console.log(`   📊 Status: ${error.response.status}`);
    }
    return false;
  }
}

async function runAllTests() {
  console.log('🎵 SUNO API COMPREHENSIVE TEST SUITE');
  console.log('=====================================\n');

  const tests = [
    {
      name: 'Get Account Limits',
      method: 'GET',
      url: '/api/get_limit'
    },
    {
      name: 'Generate Music',
      method: 'POST',
      url: '/api/generate',
      data: {
        prompt: 'A cheerful acoustic song about testing APIs',
        make_instrumental: false,
        wait_audio: false
      }
    },
    {
      name: 'Generate Custom Music',
      method: 'POST',
      url: '/api/custom_generate',
      data: {
        prompt: 'A upbeat electronic track about cloud computing',
        tags: 'electronic, upbeat',
        title: 'Cloud Symphony',
        make_instrumental: false,
        wait_audio: false
      }
    },
    {
      name: 'Generate Lyrics',
      method: 'POST',
      url: '/api/generate_lyrics',
      data: {
        prompt: 'A song about successful software development'
      }
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const success = await testEndpoint(test.name, test.method, test.url, test.data);
    if (success) {
      passed++;
    } else {
      failed++;
    }

    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('========================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Total: ${passed + failed}`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Suno API is working perfectly!');
    console.log('🚀 You can now generate music and lyrics with your API!');
  } else {
    console.log('\n⚠️  Some tests failed. Check the cookie or network connection.');
  }
}

// Run the tests
runAllTests().catch(console.error);

