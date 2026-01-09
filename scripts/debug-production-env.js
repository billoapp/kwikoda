// Create a temporary debug endpoint to see what Vercel is actually reading
// This will help us see exactly what environment variables are being loaded

async function createDebugEndpoint() {
  console.log('🔧 Creating debug API endpoint...\n');
  
  const debugCode = `
// Temporary debug endpoint - ADD THIS TO YOUR API ROUTE
export async function GET(request) {
  return NextResponse.json({
    debug: true,
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      
      // Safe partial values (first 10 chars only)
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      supabaseKeyPrefix: process.env.SUPABASE_SECRET_KEY?.substring(0, 15),
      publishableKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20),
      
      // Lengths to check for truncation
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
      supabaseKeyLength: process.env.SUPABASE_SECRET_KEY?.length,
      publishableKeyLength: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length,
      
      // Expected lengths for comparison
      expectedKeyLength: 'sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG'.length,
      expectedUrlLength: 'https://bkaigyrrzsqbfscyznzw.supabase.co'.length,
      expectedPublishableLength: 'sb_publishable_sS8TJmpBNLw5fAHNfTb9og_EurMoc49'.length
    }
  });
}`;

  console.log('📋 Add this GET handler to your upload-menu route.ts:');
  console.log(debugCode);
  console.log('\n📤 Then deploy and test with:');
  console.log('curl https://tabeza.co.ke/api/upload-menu');
  console.log('\n🔍 This will show us exactly what Vercel is reading');
}

// Alternative: Test if we can get debug info from existing endpoint
async function testExistingDebug() {
  console.log('🔍 Testing if we can get debug info from existing endpoint...\n');
  
  try {
    // Try to trigger environment variable logging
    const response = await fetch('https://tabeza.co.ke/api/upload-menu', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ debug: true })
    });
    
    const result = await response.json();
    console.log('📊 Response:', JSON.stringify(result, null, 2));
    
    if (result.hasSupabaseUrl !== undefined) {
      console.log('\n🔍 Environment Status from API:');
      console.log('   Has Supabase URL:', result.hasSupabaseUrl);
      console.log('   Has Supabase Key:', result.hasSupabaseKey);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

createDebugEndpoint();
testExistingDebug();