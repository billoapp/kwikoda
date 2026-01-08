import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('📧 Test feedback API called');
    
    // Parse request body
    const body = await request.json();
    const { name, email, barName, message } = body;

    console.log('📧 Test request data:', { name, email, barName, messageLength: message?.length });

    // Validation
    if (!name || !email || !message) {
      console.log('❌ Validation failed: missing fields');
      return NextResponse.json(
        { error: 'Missing required fields: name, email, and message are required' },
        { status: 400 }
      );
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Validation failed: invalid email');
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Simulate success without actually sending email
    console.log('✅ Test feedback received successfully');
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Test feedback received successfully! (Email not actually sent in test mode)',
        testData: { name, email, barName, messageLength: message?.length }
      },
      { status: 200 }
    );

  } catch (error: any) {
    console.error('❌ Unexpected error in test feedback API:', error);
    return NextResponse.json(
      { error: `An unexpected error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: 'Feedback test API - POST to test feedback submission' },
    { status: 200 }
  );
}
