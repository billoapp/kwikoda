import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stkPush } from './lib';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { barId, amount, phone } = body || {};
    if (!barId || !amount || !phone) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    const { data: bar } = await supabase
      .from('bars')
      .select('id, mpesa_till_number, mpesa_paybill_number, payment_mpesa_enabled')
      .eq('id', barId)
      .single();

    if (!bar || !bar.payment_mpesa_enabled) {
      return NextResponse.json({ error: 'M-Pesa not enabled for this venue' }, { status: 400 });
    }

    const shortcode = bar.mpesa_till_number || bar.mpesa_paybill_number;

    const res = await stkPush({ businessShortCode: shortcode, amount: Number(amount), phoneNumber: phone, accountReference: `TEST-${Date.now()}` });

    return NextResponse.json({ result: res });
  } catch (err: any) {
    console.error('MPesa test error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}