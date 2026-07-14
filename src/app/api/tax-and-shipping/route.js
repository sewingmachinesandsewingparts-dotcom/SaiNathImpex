import { NextResponse } from 'next/server';

// Simple server-side calculator for shipping + tax breakdown.
// Configurable seller state via SELLER_STATE env var.

const REMOTE_SURCHARGE_STATES = [
  'Andaman and Nicobar Islands',
  'Lakshadweep',
  'Daman and Diu',
  'Dadra and Nagar Haveli',
];

export async function POST(req) {
  try {
    const body = await req.json();
    const { state, shippingMethod, items = [], subtotal = 0 } = body || {};

    const sellerState = process.env.SELLER_STATE || 'Punjab';

    // Compute item tax total
    let itemTaxTotal = 0;
    const itemTaxes = items.map((it) => {
      const rate = it.hasMotor ? 0.18 : 0.05;
      const tax = Math.round((it.price || 0) * (it.qty || 0) * rate);
      itemTaxTotal += tax;
      return { sku: it.sku, qty: it.qty, price: it.price, rate, tax };
    });

    // Tax breakdown
    let cgst = 0,
      sgst = 0,
      igst = 0,
      taxType = 'intra';

    if (!state || state === sellerState) {
      taxType = 'intra';
      cgst = Math.round(itemTaxTotal / 2);
      sgst = itemTaxTotal - cgst;
    } else {
      taxType = 'inter';
      igst = itemTaxTotal;
    }

    // Shipping calculation (always charged when subtotal > 0)
    const base = shippingMethod === 'express' ? 499 : 199;
    const surcharge = REMOTE_SURCHARGE_STATES.includes(state) ? 300 : 0;
    const shipping = subtotal === 0 ? 0 : base + surcharge;
    const shippingGst = Math.round(shipping * 0.05);

    return NextResponse.json({
      ok: true,
      shipping,
      shippingGst,
      tax: {
        total: itemTaxTotal,
        cgst,
        sgst,
        igst,
        type: taxType,
      },
      items: itemTaxes,
    });
  } catch (err) {
    console.error('tax-and-shipping error', err);
    return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
