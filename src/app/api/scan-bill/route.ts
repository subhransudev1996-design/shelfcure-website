import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

const SYSTEM_PROMPT = `You are a pharmacy purchase invoice OCR expert. Analyze the image of an Indian pharmaceutical purchase invoice/bill and extract ALL data into the JSON schema below. Be extremely precise with medicine names, batch numbers, and numeric values.

IMPORTANT RULES:
- Extract EVERY line item. Do not skip any.
- For quantity, extract the pack quantity (not loose units).
- MRP is Maximum Retail Price per pack/unit.
- purchase_rate is the rate at which the pharmacy bought the item.
- amount is the line total = purchase_rate × quantity (before GST).
- gst_percentage is the GST rate (0, 5, 12, 18, or 28).
- expiry_date should be in YYYY-MM format if possible, or YYYY-MM-DD.
- batch_number must be extracted exactly as printed.
- If discount is shown per line, include discount_percentage.
- free_quantity is bonus/free goods given by supplier.
- For the bill-level fields, extract exactly as printed on the invoice footer.

Return ONLY valid JSON, no markdown fences, no explanation:

{
  "supplier_name": "string or null",
  "supplier_gstin": "string or null",
  "supplier_phone": "string or null",
  "supplier_city": "string or null",
  "supplier_state": "string or null",
  "bill_number": "string or null",
  "bill_date": "YYYY-MM-DD or null",
  "payment_type": "CASH | CREDIT | UPI | null",
  "items": [
    {
      "medicine_name": "string",
      "batch_number": "string or null",
      "expiry_date": "string or null",
      "quantity": number,
      "free_quantity": number or null,
      "purchase_rate": number,
      "mrp": number,
      "gst_percentage": number or null,
      "discount_percentage": number or null,
      "amount": number,
      "hsn_code": "string or null"
    }
  ],
  "subtotal": number or null,
  "bill_discount": number or null,
  "bill_cgst": number or null,
  "bill_sgst": number or null,
  "bill_igst": number or null,
  "bill_round_off": number or null,
  "total_amount": number or null,
  "gst_amount": number or null
}`;

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured. Add GEMINI_API_KEY to your environment.' }, { status: 500 });
    }

    const body = await request.json();
    const { base64Image, mimeType } = body;

    if (!base64Image || !mimeType) {
      return NextResponse.json({ error: 'Missing base64Image or mimeType' }, { status: 400 });
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const geminiBody = {
      contents: [{
        parts: [
          { text: SYSTEM_PROMPT },
          { inline_data: { mime_type: mimeType, data: base64Image } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    };

    const resp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json({ error: `Gemini API error: ${resp.status} - ${errText}` }, { status: 502 });
    }

    const result = await resp.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return NextResponse.json({ error: 'No response from Gemini AI' }, { status: 502 });
    }

    // Parse the JSON response
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Scan bill error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to process invoice' }, { status: 500 });
  }
}
