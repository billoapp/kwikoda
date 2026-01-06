// callback.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseCallbackPayload } from './lib';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const parsed = parseCallbackPayload(payload);

    // Use accountReference to find payment; fallback to searching metadata if needed
    const accountReference = parsed.accountReference || payload?.Body?.stkCallback?.CallbackMetadata?.Item?.find((i: any) => i.Name === 'AccountReference')?.Value;
    if (!accountReference) {
      // Acknowledge but log
      console.warn('MPesa callback without account reference:', JSON.stringify(payload));
      return NextResponse.json({ message: 'ok' });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: payment } = await supabase
      .from('tab_payments')
      .select('*')
      .eq('reference', accountReference)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!payment) {
      console.warn('MPesa callback: payment not found for reference', accountReference);
      return NextResponse.json({ message: 'ok' });
    }

    if (payment.status !== 'pending') {
      // idempotent: already processed
      return NextResponse.json({ message: 'already_processed' });
    }

    const status = parsed.resultCode === 0 ? 'success' : 'failed';

    const { error } = await supabase
      .from('tab_payments')
      .update({
        status,
        metadata: { ...(payment.metadata || {}), mpesa_result: parsed },
        updated_at: new Date()
      })
      .eq('id', payment.id);

    if (error) console.error('Failed updating payment from MPesa callback', error);

    return NextResponse.json({ message: 'ok' });
  } catch (err: any) {
    console.error('MPesa callback error:', err);
    return NextResponse.json({ message: 'error' }, { status: 500 });
  }
}