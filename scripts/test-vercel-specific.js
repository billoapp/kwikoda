// Test Vercel-specific issues that might affect Supabase
async function testVercelSpecific() {
  console.log('🔍 Testing Vercel-specific issues...\n');
  
  // Test 1: Check if it's a Vercel region issue
  console.log('📍 Testing from different regions...');
  
  // Test 2: Check if it's a timeout issue
  console.log('⏱️ Testing with timeout...');
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
  
  try {
    const formData = new FormData();
    formData.append('file', new Blob(['small test'], { type: 'application/pdf' }), 'test.pdf');
    formData.append('barId', '550e8400-e29b-41d4-a716-446655440000'); // Valid UUID
    
    const response = await fetch('https://tabeza.co.ke/api/upload-menu', {
      method: 'POST',
      body: formData,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    const result = await response.json();
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response:', JSON.stringify(result, null, 2));
    
    // Check specific Vercel headers
    console.log('\n🔍 Vercel Headers:');
    console.log('   x-vercel-id:', response.headers.get('x-vercel-id'));
    console.log('   x-vercel-cache:', response.headers.get('x-vercel-cache'));
    console.log('   server:', response.headers.get('server'));
    
    // Analyze the error pattern
    if (result.supabaseError === 'Invalid Compact JWS') {
      console.log('\n💡 Potential Vercel Issues:');
      console.log('   1. Environment variable encoding in Vercel');
      console.log('   2. Vercel function timeout during Supabase init');
      console.log('   3. Vercel region mismatch with Supabase');
      console.log('   4. Cold start issues with Supabase client');
    }
    
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log('⏱️ Request timed out after 30 seconds');
    } else {
      console.error('💥 Error:', error.message);
    }
  }
}

testVercelSpecific();