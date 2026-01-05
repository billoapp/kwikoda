// Test the debug endpoint to see what environment variables are actually set
async function testDebugEndpoint() {
  console.log('🔍 Testing debug endpoint...\n');
  
  try {
    const response = await fetch('https://tabeza.co.ke/api/upload-menu', {
      method: 'GET'
    });
    
    const result = await response.json();
    console.log('📊 Debug Response:', JSON.stringify(result, null, 2));
    
    if (result.debug) {
      console.log('\n🔍 Environment Analysis:');
      const env = result.environment;
      
      // Check if variables exist
      console.log('✅ Variables exist:');
      console.log('   NEXT_PUBLIC_SUPABASE_URL:', env.hasSupabaseUrl);
      console.log('   SUPABASE_SECRET_KEY:', env.hasSupabaseKey);
      console.log('   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:', env.hasPublishableKey);
      
      // Check lengths
      console.log('\n📏 Variable lengths:');
      console.log('   URL length:', env.supabaseUrlLength, '(expected:', env.expectedUrlLength, ')');
      console.log('   Secret key length:', env.supabaseKeyLength, '(expected:', env.expectedKeyLength, ')');
      console.log('   Publishable key length:', env.publishableKeyLength, '(expected:', env.expectedPublishableLength, ')');
      
      // Check prefixes
      console.log('\n🔍 Variable prefixes:');
      console.log('   URL prefix:', env.supabaseUrlPrefix);
      console.log('   Secret key prefix:', env.supabaseKeyPrefix);
      console.log('   Publishable key prefix:', env.publishableKeyPrefix);
      
      // Check format validation
      console.log('\n✅ Format validation:');
      console.log('   Key starts with sb_secret_:', env.keyStartsCorrectly);
      console.log('   URL starts with https://:', env.urlStartsCorrectly);
      console.log('   Publishable starts with sb_publishable_:', env.publishableStartsCorrectly);
      
      // Identify issues
      console.log('\n🚨 Issues detected:');
      if (!env.hasSupabaseKey) {
        console.log('   - SUPABASE_SECRET_KEY is missing!');
      } else if (env.supabaseKeyLength !== env.expectedKeyLength) {
        console.log('   - SUPABASE_SECRET_KEY length mismatch! Got:', env.supabaseKeyLength, 'Expected:', env.expectedKeyLength);
      } else if (!env.keyStartsCorrectly) {
        console.log('   - SUPABASE_SECRET_KEY does not start with sb_secret_');
      }
      
      if (!env.hasSupabaseUrl) {
        console.log('   - NEXT_PUBLIC_SUPABASE_URL is missing!');
      } else if (env.supabaseUrlLength !== env.expectedUrlLength) {
        console.log('   - NEXT_PUBLIC_SUPABASE_URL length mismatch!');
      }
      
      if (!env.hasPublishableKey) {
        console.log('   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing!');
      }
    }
    
  } catch (error) {
    console.error('💥 Error testing debug endpoint:', error.message);
  }
}

testDebugEndpoint();