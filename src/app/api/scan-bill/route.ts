import { NextRequest, NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = 'gemini-2.5-flash';

// ── Exact same prompt as the desktop app (gemini.rs) ──────────────────────────
const SYSTEM_PROMPT = `You are an expert Indian pharmacy invoice OCR and data extractor. Your task is to read the provided pharmacy GST invoice image and extract ALL data with 100% accuracy.

=== MASTER RULE: EXTRACT ONLY — NEVER CALCULATE ===
You must ONLY extract values that are physically PRINTED on the bill.
Do NOT perform ANY arithmetic. Do NOT compute any amounts.
If a field is not printed on the bill, return null for that field.
Every number you return must be a number you can point to on the printed bill.

=== STEP 0 (DO THIS FIRST — BEFORE ANYTHING ELSE) ===
Before extracting any data, COUNT the number of line items in the item table:
1. Look at the SN (serial number) column on the LEFT side of the table.
2. Find the LAST numbered row. That number = total_items.
3. You MUST return EXACTLY that many objects in the "items" array.
4. If any SN row has unusual data (batch=*, expiry blank, non-medicine product like diapers/condoms), you MUST STILL include it.
5. Two items with the same brand but different sizes (e.g. "MANFORCE CONDOM 3'S" at SN 1 and "MANFORCE CONDOM 10'S" at SN 4) are SEPARATE items — extract BOTH with their OWN row data.
6. items.length MUST EQUAL total_items. If it doesn't, you have a bug — go re-read the table.

**IMPORTANT: Each row is INDEPENDENT.** When you extract SN 1, you read ONLY the cells in physical row 1. When you extract SN 4, you read ONLY the cells in physical row 4. NEVER copy or inherit a value from one row to another row, even if the product names look similar.

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no explanations. Starting { ending }. Pure JSON only.

=== OUTPUT SCHEMA ===
{
  "supplier_name": "string or null",
  "supplier_gstin": "string or null",
  "supplier_phone": "string or null",
  "supplier_address": "string or null",
  "supplier_city": "string or null",
  "supplier_state": "string or null",
  "bill_number": "string or null",
  "bill_date": "YYYY-MM-DD or null",
  "payment_type": "CREDIT or CASH",
  "subtotal": number or null,
  "bill_discount": number or null,
  "bill_cgst": number or null,
  "bill_sgst": number or null,
  "bill_igst": number or null,
  "bill_round_off": number or null,
  "total_amount": number or null,
  "gst_amount": number or null,
  "total_items": number,
  "items": [
    {
      "sn": number,
      "medicine_name": "string",
      "hsn_code": "string or null",
      "manufacturer_code": "string or null",
      "batch_number": "string or null",
      "expiry_date": "YYYY-MM-DD or null",
      "quantity": number,
      "free_quantity": number or null,
      "purchase_rate": number,
      "mrp": number,
      "gst_percentage": number or null,
      "discount_percentage": number or null,
      "amount": number,
      "taxable_amount": number or null,
      "cgst_amount": number or null,
      "sgst_amount": number or null,
      "igst_amount": number or null,
      "net_amount": number or null
    }
  ]
}
NOTE: "total_items" = the count from STEP 0. "sn" = the serial number of each row. items.length MUST equal total_items.

=== RULE 1: SUPPLIER vs BUYER (CRITICAL — READ CAREFULLY) ===
Indian GST invoices have TWO parties printed on them. You MUST distinguish them:

**SUPPLIER (SELLER):**
- Usually the LARGEST, BOLDEST heading at the TOP-LEFT or TOP-CENTER of the invoice.
- The company that SOLD/DISPATCHED the goods.
- Often labeled: company name in large font, with "GST Invoice", "Tax Invoice", "Wholesale" in the heading.
- Their GSTIN appears near their name/address block, labeled "GSTIN", "GST No", "GST IN", "GSTIN/UIN".
- This is the GSTIN you MUST extract as supplier_gstin.

**BUYER (PURCHASER):**
- Usually on the RIGHT side or below the supplier block.
- Commonly labeled: "M/s", "Bill To", "Buyer", "Ship To", "Party", "Sold To", "Consignee".
- Their GSTIN appears in the buyer section.
- IGNORE the buyer's GSTIN completely — do NOT extract it.

**HOW TO IDENTIFY THE SUPPLIER GSTIN (step by step):**
1. Find the main company header (largest text at top) — this is the SUPPLIER.
2. Locate the GSTIN printed IN or NEAR this supplier header block.
3. That is supplier_gstin.
4. If you see another GSTIN in the "Bill To" / "M/s" / buyer section → IGNORE it.
5. If the invoice has "Sold By" and "Sold To" — "Sold By" party's GSTIN = supplier_gstin.

**GSTIN FORMAT (15 characters exactly):**
- Characters 1-2: State code (2 digits, 01 to 38). Examples: 21=Odisha, 27=Maharashtra, 29=Karnataka, 07=Delhi, 09=UP, 33=TN
- Characters 3-7: Five uppercase letters (first 5 chars of PAN)
- Characters 8-11: Four digits (PAN digits)
- Character 12: One uppercase letter (PAN check letter)
- Character 13: One alphanumeric (entity identifier, usually 1-9 or A-Z)
- Character 14: Always the letter "Z"
- Character 15: Checksum character (alphanumeric, computed by govt algorithm)
- Valid example: 21AABCT1332L1ZS, 27AAACR5055K1ZQ
- INVALID patterns: random numbers, less than 15 chars, no "Z" at position 14

=== RULE 2: BILL HEADER ===
- bill_number: value after "Invoice No", "Inv No", "Bill No", "GST Invoice:" — e.g. "ASP/933", "C-10710"
- bill_date: convert all formats to YYYY-MM-DD. "12-03-2026" → "2026-03-12". "27/09/25" → "2025-09-27"
- payment_type: look for "CREDIT" or "CASH" printed explicitly on the bill

=== RULE 3: COLUMN IDENTIFICATION (READ HEADER ROW CAREFULLY) ===
Step 1: Read the header row of the item table to find ALL column labels.
Step 2: Note the LEFT-TO-RIGHT order of columns.
Step 3: For EACH data row, extract each value by its column position — do NOT shift columns.

Common column labels and what they map to:
- "PRODUCT", "Particulars", "Description", "Item" → medicine_name
- "MFG", "Mfg.", "Manufacturer" → manufacturer_code (2-3 letter code like BLA, ALK, TOR, P&G)
- "HSN", "HSN Code" → hsn_code (always a 6-digit NUMBER like 300490, 300420, 304200)
- "Batch", "Batch No", "BATCH", "LOT" → batch_number (alphanumeric like BGR12AAA, ACB025007, D0692a026)
- "Exp", "EXP.", "Expiry" → expiry_date
- "QTY", "Qty" → quantity (integer)
- "FR", "F/R", "Free" → free_quantity
- "Rate", "RATE", "P.Rate" → purchase_rate
- "MRP", "M.R.P" → mrp
- "Disc%", "DIS%", "SCH", "DISC", "SPEC DISC", "SPL DISC", "CD%", "Scheme" → discount_percentage
- "GST%", "GST", "Tax%" → gst_percentage
- "Amount", "AMOUNT", "Amt" → amount (this is the GROSS amount = Rate × Qty, BEFORE discount, BEFORE GST)
- "Taxable", "Taxable Amt", "Taxable Val", "Net Val", "Net Value", "Tax Value" → taxable_amount (AFTER discount, BEFORE GST)
- "CGST Amt", "CGST", "CGST Rs" → cgst_amount
- "SGST Amt", "SGST", "SGST Rs" → sgst_amount
- "IGST Amt", "IGST", "IGST Rs" → igst_amount
- "Net Amt", "Net Amount", "Total", "Line Total", "FINAL" → net_amount (FINAL amount for this line = taxable + GST)

=== RULE 4: DISTINGUISHING BATCH NUMBER vs HSN CODE (CRITICAL — #1 ERROR SOURCE) ===
HSN codes and Batch numbers are DIFFERENT columns. Do NOT mix them up.

HSN code characteristics:
- ALWAYS a pure 6-digit number: 300490, 300420, 304200, 304210, 401410, 961900, etc.
- Found in the column labeled "HSN" or "HSN Code"
- Never contains letters

Batch number characteristics:
- Usually alphanumeric: BGR12AAA, ACB025007, D0692a026, PCM23S05, C5038, etc.
- SPECIAL VALUES that mean "no batch": *, //, ////, -, N/A, blank → batch_number = null

**ANTI-COLUMN-SHIFT RULE:** When a row has BLANK or * in the Batch column AND BLANK or * in the Expiry column, do NOT shift the HSN number into the Batch field. Each value STAYS in its OWN column position.

RULE: If you see a 6-digit pure number (like 401410, 300490) → it is ALWAYS an hsn_code, NEVER a batch_number.

=== RULE 5: MRP vs RATE column order ===
Always check the COLUMN HEADER to know which is which.
MRP (Maximum Retail Price) is always HIGHER than purchase Rate.
If MRP column is BEFORE Rate column in the bill, still put the right values in the right fields.

=== RULE 6: DISCOUNT COLUMNS (CRITICAL) ===
Multiple discount-related columns may appear: "SCH", "DISC", "SPEC DISC", "SPL DISC", "CD%"
SOME BILLS split the discount into TWO sub-columns: e.g. "SPEC | DISC" → add them: discount_percentage = SPEC_value + DISC_value
If a cell is blank/empty/asterisk (*) under any discount column → treat as 0 for that row.

**BILL-LEVEL DISCOUNT:** At the BOTTOM of the bill, look for the TOTAL discount amount labeled "Disc Amt", "Total Discount", "Less Discount". Extract into bill_discount as RUPEES (not percentage).

=== RULE 7: GST PERCENTAGE ===
CASE A — Single "GST%" column → use value directly (e.g. 5)
CASE B — Separate "SGST%" and "CGST%" columns per item → add them: gst% = SGST% + CGST%
CASE C — No % per item, only rupee GST amounts → match items to GST class table at bottom of bill

=== RULE 8: QUANTITY AND FREE QUANTITY ===
CASE A — Separate QTY and FR columns: read independently per column position
  → FR column with "*", "-", blank → free_quantity = 0 (not null)
CASE B — Combined "QTY+F/R" format: "5/2" = qty=5, free=2; "5/0" = qty=5, free=0; "5" = qty=5, free=0

=== RULE 9: EXPIRY DATE ===
Convert ALL formats to YYYY-MM-DD, always use 01 as the day:
- "6/27" or "06/27" = 2027-06-01
- "9/26" = 2026-09-01
- "12/2026" = 2026-12-01
- "JAN-27" = 2027-01-01
SPECIAL: If the expiry cell contains "*", "-", "N/A", or is blank → expiry_date = null

=== RULE 10: AMOUNT vs TAXABLE_AMOUNT vs NET_AMOUNT ===
- amount: Gross Amount = Rate × Qty (BEFORE discount, BEFORE GST)
- taxable_amount: After Discount, Before GST (labeled "Taxable", "Net Value", "Tax Value")
- net_amount: Final Line Total = taxable_amount + GST (the LAST numeric column)
- If bill has ONLY ONE amount column → put it in "amount", set taxable_amount and net_amount to null
- NEVER calculate these. ONLY extract what is physically printed.

=== RULE 11: BLANK/NULL FIELDS & ASTERISK (*) ===
- ASTERISK (*) in ANY cell = null for that field
- Exception: free_quantity with * or blank → use 0 (not null)

=== RULE 12: BILL SUMMARY SECTION ===
At the BOTTOM of the bill:
- subtotal: labeled "Sub Total", "Gross Total", "Prd Value", "Product Value" (before GST)
- bill_discount: total discount in RUPEES labeled "Disc Amt", "Total Discount", "Less Discount"
- bill_cgst: labeled "CGST Payable", "Total CGST"
- bill_sgst: labeled "SGST Payable", "Total SGST"
- bill_igst: labeled "IGST Payable", "Total IGST"
- gst_amount: labeled "Total Tax", "Total GST"
- bill_round_off: labeled "Round Off", "Rnd" — can be positive or negative
- total_amount: labeled "Grand Total", "Net Payable", "Bill Amount", "Total Payable" — the FINAL amount

=== RULE 13: FINAL VALIDATION ===
For each item, verify:
1. batch_number contains letters OR is clearly alphanumeric (not a 6-digit pure number)
2. hsn_code is a 6-digit pure number — if empty → null
3. purchase_rate < mrp (rate should be lower than MRP)
4. gst_percentage is one of: 0, 5, 12, 18, 28

=== RULE 14: ITEM COUNT VERIFICATION ===
After extracting all items, COUNT them. Your items array MUST have exactly as many items as the last SN number in the table. NEVER merge rows or skip rows.

=== RULE 16: STRICT ROW-BY-ROW EXTRACTION ===
Extract items ONE ROW AT A TIME. For each SN, read ONLY the cells in that physical row. NEVER copy values from one row to another. Same-brand products with different pack sizes are DIFFERENT items.

Return ONLY the JSON object starting with { and ending with } — nothing else.`;

// ── JSON repair (port of the Rust repair_json function) ────────────────────────
function repairJson(raw: string): string {
  let s = raw.trim();

  // Strip markdown code fences
  if (s.startsWith('```')) {
    const newline = s.indexOf('\n');
    if (newline !== -1) s = s.slice(newline + 1);
    if (s.endsWith('```')) s = s.slice(0, s.length - 3).trimEnd();
  }

  // Fix missing `}` before `, {` inside arrays
  let result = '';
  let braceDepth = 0;
  let bracketDepth = 0;
  let inString = false;
  let escapeNext = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escapeNext) { result += c; escapeNext = false; continue; }
    if (c === '\\' && inString) { result += c; escapeNext = true; continue; }
    if (c === '"') { inString = !inString; result += c; continue; }
    if (inString) { result += c; continue; }
    if (c === '{') { braceDepth++; result += c; }
    else if (c === '}') { braceDepth--; result += c; }
    else if (c === '[') { bracketDepth++; result += c; }
    else if (c === ']') { bracketDepth--; result += c; }
    else if (c === ',') {
      let j = i + 1;
      while (j < s.length && /\s/.test(s[j])) j++;
      if (j < s.length && s[j] === '{' && bracketDepth > 0) {
        const last = result.trimEnd().slice(-1);
        if (last !== '}' && last !== ']') { result += '}'; braceDepth--; }
      }
      result += c;
    } else {
      result += c;
    }
  }

  // Fix trailing commas before ] or }
  let fixed = '';
  for (let i = 0; i < result.length; i++) {
    if (result[i] === ',') {
      let k = i + 1;
      while (k < result.length && /\s/.test(result[k])) k++;
      if (k < result.length && (result[k] === ']' || result[k] === '}')) {
        continue; // skip the comma
      }
    }
    fixed += result[i];
  }
  return fixed;
}

// ── Post-process: fix amount=0 when rate*qty is available ─────────────────────
function postprocessItemAmounts(parsed: any): void {
  if (!Array.isArray(parsed.items)) return;
  for (const item of parsed.items) {
    const amount = Number(item.amount) || 0;
    if (amount < 0.01) {
      const rate = Number(item.purchase_rate) || 0;
      const qty = Number(item.quantity) || 0;
      if (rate > 0.01 && qty > 0) {
        item.amount = Math.round(rate * qty * 100) / 100;
      }
    }
  }
}

// ── Post-process: fix HSN/batch column-shift errors ────────────────────────────
function postprocessHsnBatch(parsed: any): void {
  if (!Array.isArray(parsed.items)) return;
  for (const item of parsed.items) {
    const batchVal = String(item.batch_number ?? '');
    const hsnVal = String(item.hsn_code ?? '');
    const batchIsHsn = batchVal.length === 6 && /^\d+$/.test(batchVal);
    if (batchIsHsn) {
      if (!hsnVal) item.hsn_code = batchVal;
      item.batch_number = null;
    }
    const hsnHasLetters = hsnVal.length > 0 && /[a-zA-Z]/.test(hsnVal);
    if (hsnHasLetters) {
      const currentBatch = item.batch_number;
      if (!currentBatch || currentBatch === null) item.batch_number = hsnVal;
      item.hsn_code = null;
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API key not configured. Add GEMINI_API_KEY to .env.local' },
        { status: 500 }
      );
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
        temperature: 0.05,
        // NOTE: Do NOT set responseMimeType here — it causes empty responses
        // when the model can't guarantee valid JSON. We parse text manually instead.
      },
    };

    const resp = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiBody),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return NextResponse.json(
        { error: `Gemini API error ${resp.status}: ${errText}` },
        { status: 502 }
      );
    }

    const result = await resp.json();
    const text: string | undefined = result?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No response from Gemini AI. The image may be too blurry or unreadable.' },
        { status: 502 }
      );
    }

    // Try direct parse first, then repair and retry (mirrors Rust logic)
    let parsed: any;
    try {
      const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      try {
        const repaired = repairJson(text);
        parsed = JSON.parse(repaired);
      } catch (repairErr: any) {
        console.error('JSON repair failed. Raw text:', text.slice(0, 500));
        return NextResponse.json(
          { error: `Failed to parse AI response: ${repairErr?.message}. Try a clearer image.` },
          { status: 502 }
        );
      }
    }

    // Post-process (mirrors Rust pipeline)
    postprocessHsnBatch(parsed);
    postprocessItemAmounts(parsed);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Scan bill error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process invoice' },
      { status: 500 }
    );
  }
}
