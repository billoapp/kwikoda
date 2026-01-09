// Comprehensive production diagnosis script
async function diagnoseProductionIssue() {
  console.log('🔍 Diagnosing production upload issue...\n');
  
  // Test with a small file first
  const testFile = new Blob(['test content'], { type: 'application/pdf' });
  const formData = new FormData();
  formData.append('file', testFile, 'test.pdf');
  formData.append('barId', '123e4567-e89b-12d3-a456-426614174000'); // Valid UUID format
  
  try {
    console.log('📤 Testing small file upload to production...');
    const response = await fetch('https://tabeza.co.ke/api/upload-menu', {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Data:', JSON.stringify(result, null, 2));
    
    if (!response.ok) {
      console.log('\n❌ Production upload failed!');
      console.log('🔍 Analyzing error...');
      
      if (result.error) {
        if (result.error.includes('environment')) {
          console.log('🚨 ISSUE: Missing environment variables in production');
          console.log('Missing:', result.missingVariables);
        } else if (result.error.includes('bucket')) {
          console.log('🚨 ISSUE: Storage bucket configuration problem');
        } else if (result.error.includes('permission')) {
          console.log('🚨 ISSUE: Permission/authentication problem');
        } else if (result.error.includes('barId')) {
          console.log('🚨 ISSUE: Invalid barId or database connection problem');
        } else {
          console.log('🚨 ISSUE: Unknown error -', result.error);
        }
      }
    } else {
      console.log('✅ Small file upload successful!');
      console.log('🔍 Issue might be with larger files or specific file types');
    }
    
  } catch (error) {
    console.error('💥 Network error:', error.message);
    console.log('🚨 ISSUE: Network connectivity or CORS problem');
  }
}

// Run diagnosis
diagnoseProductionIssue();