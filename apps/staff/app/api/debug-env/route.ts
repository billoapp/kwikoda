import { NextResponse } from 'next/server';

export async function GET() {
  // Debug environment variables
  const envStatus = {
    resendApiKey: !!process.env.RESEND_API_KEY,
    resendFromEmail: !!process.env.RESEND_FROM_EMAIL,
    resendSupportEmail: !!process.env.RESEND_SUPPORT_EMAIL,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'not-set',
    supportEmail: process.env.RESEND_SUPPORT_EMAIL || 'not-set',
    nodeEnv: process.env.NODE_ENV,
    allEnv: Object.keys(process.env).filter(key => key.includes('RESEND'))
  };

  console.log('🔧 Environment variables debug:', envStatus);

  return NextResponse.json(envStatus);
}
