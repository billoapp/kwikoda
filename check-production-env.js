// Check what environment variables are actually set in production
async function checkProductionEnv() {
  console.log('🔍 Checking production environment variables...\n');
  
  try {
    // This will trigger the environment check in the API
    const response = await fetch('https://tabeza.co.ke/api/upload-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // This will trigger env var check
    });
    
    const result = await response.json();
    console.log('📊 Production API Response:', JSON.stringify(result, null, 2));
    
    if (result.error && result.error.includes('environment')) {
      console.log('\n❌ CONFIRMED: Environment variable issue in production');
      console.log('🔍 Missing variables:', result.missingVariables);
      console.log('🔍 Has Supabase URL:', result.hasSupabaseUrl);
      console.log('🔍 Has Supabase Key:', result.hasSupabaseKey);
      
      if (!result.hasSupabaseKey) {
        console.log('\n🚨 ISSUE: SUPABASE_SECRET_KEY is completely missing in production');
      } else if (!result.hasSupabaseUrl) {
        console.log('\n🚨 ISSUE: NEXT_PUBLIC_SUPABASE_URL is missing in production');
      }
    } else {
      console.log('\n✅ Environment variables seem to be set in production');
      console.log('🔍 The issue might be with the key value itself');
    }
    
  } catch (error) {
    console.error('💥 Error checking production env:', error.message);
  }
}

checkProductionEnv();