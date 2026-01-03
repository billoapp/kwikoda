// apps/staff/app/api/test-key/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;
  
  // Try to create a client and test permissions
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SECRET_KEY!);
  
  try {
    // Test 1: Try to list buckets (requires admin permissions)
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    // Test 2: Try to upload a tiny test file
    const testPath = `test_${Date.now()}.txt`;
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('menu-files')
      .upload(testPath, testBlob, {
        contentType: 'text/plain',
        upsert: false
      });
    
    // Clean up if successful
    if (uploadData) {
      await supabase.storage
        .from('menu-files')
        .remove([testPath]);
    }
    
    return NextResponse.json({
      key_info: {
        has_url: !!SUPABASE_URL,
        has_secret_key: !!SUPABASE_SECRET_KEY,
        url: SUPABASE_URL?.substring(0, 30) + '...',
        key_prefix: SUPABASE_SECRET_KEY?.substring(0, 20) + '...',
        key_length: SUPABASE_SECRET_KEY?.length,
        is_jwt: SUPABASE_SECRET_KEY?.startsWith('eyJ')
      },
      permissions_test: {
        can_list_buckets: !bucketError,
        bucket_error: bucketError?.message,
        can_upload_file: !uploadError,
        upload_error: uploadError?.message,
        upload_details: uploadError ? JSON.stringify(uploadError) : null
      },
      diagnosis: uploadError ? 
        `Key lacks upload permissions. Error: ${uploadError.message}` :
        'Key has proper upload permissions!'
    });
    
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}