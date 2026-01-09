// Test how environment variables are being read in production
async function checkEnvVarReading() {
  console.log('🔍 Testing environment variable reading in production...\n');
  
  // Create a minimal test that will show us what the API is actually seeing
  const formData = new FormData();
  formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
  formData.append('barId', 'invalid-format'); // This will trigger validation error with details
  
  try {
    const response = await fetch('https://tabeza.co.ke/api/upload-menu', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('📊 Response:', JSON.stringify(result, null, 2));
    
    // Look for environment variable details in the response
    if (result.hasSupabaseUrl !== undefined) {
      console.log('\n🔍 Environment Variable Status:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL exists:', result.hasSupabaseUrl);
      console.log('   SUPABASE_SECRET_KEY exists:', result.hasSupabaseKey);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

checkEnvVarReading();