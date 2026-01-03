// Deep diagnosis of production Supabase connection
async function deepProductionDiagnosis() {
  console.log('🔍 Deep production diagnosis...\n');
  
  // Create a test file
  const testFile = new Blob(['test content for diagnosis'], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', testFile, 'test-diagnosis.pdf');
  formData.append('barId', '123e4567-e89b-12d3-a456-426614174000');
  
  try {
    console.log('📤 Testing production upload with detailed logging...');
    const response = await fetch('https://tabeza.co.ke/api/upload-menu', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('📊 Status:', response.status);
    console.log('📊 Full Response:', JSON.stringify(result, null, 2));
    
    // Analyze the specific error
    if (result.supabaseError) {
      console.log('\n🔍 Analyzing Supabase Error:', result.supabaseError);
      
      if (result.supabaseError.includes('Invalid Compact JWS')) {
        console.log('🚨 JWT/Key Format Issue Detected');
        console.log('💡 Possible causes:');
        console.log('   1. Key has invisible characters (spaces, newlines)');
        console.log('   2. Key was truncated during copy/paste');
        console.log('   3. Environment variable has quotes around it');
        console.log('   4. Different key than local (check Supabase dashboard)');
      } else if (result.supabaseError.includes('bucket')) {
        console.log('🚨 Storage Bucket Issue');
      } else if (result.supabaseError.includes('permission')) {
        console.log('🚨 Permission Issue');
      } else {
        console.log('🚨 Unknown Supabase Error');
      }
    }
    
    // Check if it's a different error type
    if (result.error && !result.supabaseError) {
      console.log('\n🔍 Non-Supabase Error:', result.error);
      if (result.details) {
        console.log('🔍 Details:', result.details);
      }
    }
    
  } catch (error) {
    console.error('💥 Network/Request Error:', error.message);
  }
}

// Also test the Supabase connection directly
async function testSupabaseConnection() {
  console.log('\n🔗 Testing Supabase connection health...');
  
  try {
    // Test the storage bucket directly
    const testResponse = await fetch('https://bkaigyrrzsqbfscyznzw.supabase.co/storage/v1/bucket/menu-files', {
      headers: {
        'Authorization': 'Bearer sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG',
        'apikey': 'sb_secret_wRBvATftWPqlT9hL660eYw_FbSXYpLG'
      }
    });
    
    console.log('📊 Direct Supabase Status:', testResponse.status);
    
    if (testResponse.status === 401) {
      console.log('🚨 Authentication failed - key is invalid');
    } else if (testResponse.status === 200) {
      console.log('✅ Direct Supabase connection works');
    } else {
      console.log('🔍 Unexpected status:', testResponse.status);
    }
    
  } catch (error) {
    console.error('💥 Direct Supabase test failed:', error.message);
  }
}

// Run both tests
deepProductionDiagnosis().then(() => testSupabaseConnection());