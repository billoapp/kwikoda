// stk-push.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { stkPush } from './lib';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY!;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tabId, amount, phone } = body || {};
    if (!tabId || !amount || !phone) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Lookup tab and bar settings
    const { data: tab, error: tabErr } = await supabase
      .from('tabs')
      .select('id, bar_id')
      .eq('id', tabId)
      .single();
    if (tabErr || !tab) return NextResponse.json({ error: 'Tab not found' }, { status: 404 });

    const { data: bar } = await supabase
      .from('bars')
      .select('id, mpesa_till_number, mpesa_paybill_number, payment_mpesa_enabled')
      .eq('id', tab.bar_id)
      .single();

    if (!bar || !bar.payment_mpesa_enabled) {
      return NextResponse.json({ error: 'M-Pesa not enabled for this venue' }, { status: 400 });
    }

    const shortcode = bar.mpesa_till_number || bar.mpesa_paybill_number;
    if (!shortcode) {
      return NextResponse.json({ error: 'No M-Pesa shortcode on file for this venue' }, { status: 400 });
    }

    // Generate reference
    const ref = `B${String(bar.id).slice(0,6)}-T${String(tabId).slice(0,6)}-${Date.now().toString().slice(-6)}`;

    // Insert pending payment row
    const { error: insErr, data: insData } = await supabase
      .from('tab_payments')
      .insert([{ tab_id: tabId, amount: parseFloat(amount), method: 'mpesa', status: 'pending', reference: ref, metadata: { phone, bar_id: bar.id } }])
      .select('*')
      .single();

    if (insErr) throw insErr;

    // Call Daraja
    let stkResponse;
    try {
      stkResponse = await stkPush({
        businessShortCode: shortcode,
        passkey: bar.mpesa_passkey || undefined,
        amount: Number(amount),
        phoneNumber: phone,
        accountReference: ref
      });
    } catch (e: any) {
      // Update payment as failed if STK request failed synchronously
      await supabase
        .from('tab_payments')
        .update({ status: 'failed', metadata: { ...(insData.metadata || {}), mpesa_error: e.message || String(e) }, updated_at: new Date() })
        .eq('id', insData.id);
      return NextResponse.json({ error: 'STK request failed', details: String(e.message || e) }, { status: 502 });
    }

    // Save STK request IDs in metadata
    await supabase
      .from('tab_payments')
      .update({ metadata: { ...(insData.metadata || {}), stk_request: stkResponse }, updated_at: new Date() })
      .eq('id', insData.id);

    return NextResponse.json({ paymentId: insData.id, status: 'pending', stk: stkResponse });
  } catch (err: any) {
    console.error('STK push error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}