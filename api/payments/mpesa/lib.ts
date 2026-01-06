// lib.ts - minimal Daraja helper
const MPESA_BASE = process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke';
const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const GLOBAL_PASSKEY = process.env.MPESA_PASSKEY; // fallback global passkey; per-bar passkey is recommended
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL; // must be set to receive Daraja callbacks

function timestamp() {
  const d = new Date();
  const YYYY = d.getUTCFullYear();
  const MM = String(d.getUTCMonth() + 1).padStart(2, '0');
  const DD = String(d.getUTCDate()).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${YYYY}${MM}${DD}${hh}${mm}${ss}`;
}

async function getAccessToken(): Promise<string> {
  if (!CONSUMER_KEY || !CONSUMER_SECRET) throw new Error('Missing M-Pesa consumer key/secret');
  const basic = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(`${MPESA_BASE}/oauth/v1/generate?grant_type=client_credentials`, {
    method: 'GET',
    headers: {
      Authorization: `Basic ${basic}`
    }
  });
  if (!res.ok) throw new Error(`Failed to get access token: ${res.statusText}`);
  const j = await res.json();
  return j.access_token;
}

export type StkRequestParams = {
  businessShortCode: string;
  passkey?: string; // optional - fallback to GLOBAL_PASSKEY
  amount: number;
  phoneNumber: string; // in international format 2547...
  accountReference: string;
  transactionDesc?: string;
};

export async function stkPush(params: StkRequestParams) {
  const token = await getAccessToken();
  const tstamp = timestamp();
  const passkey = params.passkey || GLOBAL_PASSKEY;
  if (!passkey) throw new Error('Missing M-Pesa passkey (per-bar or global)');
  const password = Buffer.from(`${params.businessShortCode}${passkey}${tstamp}`).toString('base64');

  const body = {
    BusinessShortCode: params.businessShortCode,
    Password: password,
    Timestamp: tstamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: params.amount,
    PartyA: params.phoneNumber,
    PartyB: params.businessShortCode,
    PhoneNumber: params.phoneNumber,
    CallBackURL: CALLBACK_URL,
    AccountReference: params.accountReference,
    TransactionDesc: params.transactionDesc || 'Tabeza payment'
  };

  const res = await fetch(`${MPESA_BASE}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const json = await res.json();
  if (!res.ok || json.errorCode) {
    throw new Error(`STK request failed: ${JSON.stringify(json)}`);
  }
  return json; // contains MerchantRequestID, CheckoutRequestID, ResponseCode, ResponseDescription
}

export function parseCallbackPayload(payload: any) {
  // Daraja sends { Body: { stkCallback: { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } } }
  try {
    const cb = payload?.Body?.stkCallback || payload?.stkCallback || payload;
    const resultCode = cb?.ResultCode;
    const resultDesc = cb?.ResultDesc;
    const checkoutRequestId = cb?.CheckoutRequestID || cb?.CheckoutRequestID;
    const merchantRequestId = cb?.MerchantRequestID;
    // AccountReference often inside CallbackMetadata.Items
    const items = cb?.CallbackMetadata?.Item || [];
    const getItem = (name: string) => items.find((i: any) => i.Name === name)?.Value;
    const amount = getItem('Amount');
    const mpesaReceiptNumber = getItem('MpesaReceiptNumber');
    const phoneNumber = getItem('PhoneNumber');
    const accountReference = getItem('AccountReference');

    return {
      resultCode,
      resultDesc,
      checkoutRequestId,
      merchantRequestId,
      amount,
      mpesaReceiptNumber,
      phoneNumber,
      accountReference
    };
  } catch (e) {
    return { raw: payload };
  }
}
