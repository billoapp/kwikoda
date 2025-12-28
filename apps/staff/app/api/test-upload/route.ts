import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('=== TEST UPLOAD REQUEST START ===');
    
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    console.log('File received:', file?.name, file?.size, file?.type);
    
    if (!file) {
      console.error('No file provided');
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Just return success without any processing
    const mockUrl = `https://example.com/test-${Date.now()}.jpg`;
    
    console.log('Test upload successful, returning URL:', mockUrl);

    return NextResponse.json({
      success: true,
      url: mockUrl,
      test: true
    });

  } catch (error: any) {
    console.error('=== TEST UPLOAD ERROR ===');
    console.error('Error details:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { error: 'Failed to process image', details: error.message },
      { status: 500 }
    );
  }
}
