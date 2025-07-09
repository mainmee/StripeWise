#!/usr/bin/env node

/**
 * Quick test script to verify API connectivity
 * Run with: node test-connection.js
 */

const API_BASE_URL = 'http://localhost:8787';

async function testEndpoint(endpoint, method = 'GET', body = null) {
  try {
    console.log(`🔍 Testing ${method} ${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      ...(body && { body: JSON.stringify(body) })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${endpoint} - SUCCESS`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Data preview:`, JSON.stringify(data).substring(0, 100) + '...');
    } else {
      console.log(`❌ ${endpoint} - FAILED`);
      console.log(`   Status: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.log(`❌ ${endpoint} - ERROR`);
    console.log(`   Error: ${error.message}`);
  }
  console.log('');
}

async function runTests() {
  console.log('🧪 Testing API Connectivity\n');
  console.log(`Base URL: ${API_BASE_URL}\n`);

  // Test each endpoint
  await testEndpoint('/api/health');
  await testEndpoint('/api/financial-advice');
  await testEndpoint('/api/esg-investments');
  await testEndpoint('/api/sustainability-tips');
  await testEndpoint('/api/transactions', 'POST', { userId: 'test123' });
  await testEndpoint('/api/spending-insights', 'POST', { 
    userId: 'test123', 
    monthlyIncome: 25000 
  });
  await testEndpoint('/api/carbon', 'POST', { userId: 'test123' });

  console.log('🏁 Test complete!');
  console.log('\nIf you see ✅ for most endpoints, your API is working!');
  console.log('If you see ❌ errors, check:');
  console.log('1. Is the API server running? (npm run dev in Tech-Xplore-API-2025)');
  console.log('2. Is it running on port 8787?');
  console.log('3. Try visiting http://localhost:8787/ui in your browser');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This script requires Node.js 18+ (for built-in fetch)');
  console.log('Or install node-fetch: npm install node-fetch');
  process.exit(1);
}

runTests().catch(console.error);
