// ADD THIS TO YOUR apps/staff/app/api/upload-menu/route.ts file
// (Add it right after the POST function)

export async function GET(request: NextRequest) {
  return NextResponse.json({
    debug: true,
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SECRET_KEY,
      hasPublishableKey: !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      
      // Safe partial values (first 15 chars only for security)
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30),
      supabaseKeyPrefix: process.env.SUPABASE_SECRET_KEY?.substring(0, 15),
      publishableKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.substring(0, 20),
      
      // Lengths to check for truncation
      supabaseUrlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
      supabaseKeyLength: process.env.SUPABASE_SECRET_KEY?.length,
      publishableKeyLength: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.length,
      
      // Expected lengths for comparison
      expectedKeyLength: 47, // Length of sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG
      expectedUrlLength: 41,  // Length of https://bkaigyrrzsqbfscyznzw.supabase.co
      expectedPublishableLength: 49 // Length of sb_publishable_sS8TJmpBNLw5fAHNfTb9og_EurMoc49
    }
  });
}