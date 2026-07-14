import { NextResponse } from 'next/server';
import axios from 'axios';

// GSTIN verification endpoint wrapper.
// If GST_API_URL and GST_API_KEY are configured, it will proxy the request.
// Otherwise performs a basic regex check and returns a best-effort result.

const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;

export async function POST(req) {
  try {
    const body = await req.data;
    const { gstin } = body || {};
    if (!gstin) return NextResponse.json({ ok: false, message: 'missing gstin' }, { status: 400 });

    const apiUrl = process.env.GST_API_URL;
    const apiKey = process.env.GST_API_KEY;

    if (apiUrl && apiKey) {
      try {
        const res = await axios(`${apiUrl.replace(/\/$/, '')}/${encodeURIComponent(gstin)}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          method: 'GET',
        });
        if (!res.ok) {
          const text = await res.text();
          return NextResponse.json({ ok: false, message: text }, { status: res.status });
        }
        const data = await res.data;
        return NextResponse.json({ ok: true, source: 'api', data });
      } catch (e) {
        console.error('GST API call failed', e);
        // fallthrough to regex fallback
      }
    }

    const valid = GST_REGEX.test(gstin);
    return NextResponse.json({ ok: true, source: 'local', valid });
  } catch (err) {
    console.error('gst verify error', err);
    return NextResponse.json({ ok: false, message: String(err) }, { status: 500 });
  }
}
