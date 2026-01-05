// Test script to diagnose production upload issues
async function testProductionAPI() {
  const productionURL = 'https://tabeza.co.ke/api/upload-menu';
  
  console.log('🔍 Testing production API endpoint...');
  
  try {
    // Test 1: Check if API endpoint is accessible
    console.log('📡 Testing API accessibility...');
    const response = await fetch(productionURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('✅ API Response:', data);
    
    // Test 2: Check environment variables (this will show in the API response)
    if (data.error && data.error.includes('environment')) {
      console.log('❌ Environment variable issue detected');
      console.log('Missing variables:', data.missingVariables);
    }
    
  } catch (error) {
    console.error('❌ Production API test failed:', error);
  }
}

// Run the test
testProductionAPI();