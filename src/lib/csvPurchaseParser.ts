/**
 * CSV Purchase Bill Parser — ShelfCure Desktop
 *
 * Parses CSV files exported from distributor software (e.g. Marg ERP, Tally, Busy, RetailGraph)
 * into structured purchase data that can be pre-filled into the Manual Purchase Entry form.
 *
 * Handles common column name variations across different supplier software.
 */

// ─── Types ───────────────────────────────────────────────────────────

export interface CsvPurchaseRow {
  productName: string;
  barcode: string;
  companyName: string; // manufacturer
  itemCode: string;
  batchNumber: string;
  expiryDate: string; // normalized YYYY-MM-DD
  ptr: number; // purchase rate (Price to Retailer)
  mrp: number;
  quantity: number;
  freeQuantity: number;
  discountPercentage: number;
  gstPercentage: number; // SGST+CGST or IGST
  amount: number; // line total from CSV
  hsnCode: string;
  packing: string;
}

export interface CsvBillHeader {
  partyName: string;
  billNumber: string;
  billDate: string; // YYYY-MM-DD
  gstNumber: string; // supplier GSTIN
}

export interface CsvParseResult {
  header: CsvBillHeader;
  items: CsvPurchaseRow[];
  warnings: string[];
}

// ─── Column Name Aliases ─────────────────────────────────────────────
// Maps normalized column names to canonical field names

const COLUMN_ALIASES: Record<string, string> = {
  // Party / Supplier
  "party name": "partyName",
  "party": "partyName",
  "supplier": "partyName",
  "supplier name": "partyName",
  "dealer name": "partyName",

  // Bill Number
  "bill no.": "billNumber",
  "bill no": "billNumber",
  "bill number": "billNumber",
  "invoice no": "billNumber",
  "invoice no.": "billNumber",
  "invoice number": "billNumber",
  "inv no": "billNumber",
  "inv no.": "billNumber",

  // Date
  "date": "billDate",
  "bill date": "billDate",
  "invoice date": "billDate",
  "inv date": "billDate",

  // Company / Manufacturer
  "company name": "companyName",
  "company": "companyName",
  "manufacturer": "companyName",
  "mfr": "companyName",
  "mfg": "companyName",

  // Item Code
  "item code": "itemCode",
  "product code": "itemCode",
  "code": "itemCode",

  // Barcode
  "barcode": "barcode",
  "bar code": "barcode",
  "ean": "barcode",
  "ean code": "barcode",

  // Product Name
  "product name": "productName",
  "product": "productName",
  "item name": "productName",
  "item": "productName",
  "medicine name": "productName",
  "medicine": "productName",
  "description": "productName",
  "particulars": "productName",

  // Packing
  "packing": "packing",
  "pack": "packing",
  "pack size": "packing",
  "unit": "packing",

  // Batch
  "batch no": "batchNumber",
  "batch no.": "batchNumber",
  "batch number": "batchNumber",
  "batch": "batchNumber",
  "lot no": "batchNumber",
  "lot no.": "batchNumber",

  // Expiry
  "expiry": "expiryDate",
  "expiry date": "expiryDate",
  "exp date": "expiryDate",
  "exp": "expiryDate",
  "exp.": "expiryDate",
  "exp dt": "expiryDate",

  // PTR / Purchase Rate
  "ptr": "ptr",
  "rate": "ptr",
  "purchase rate": "ptr",
  "pur rate": "ptr",
  "p.rate": "ptr",
  "p rate": "ptr",
  "price": "ptr",

  // MRP
  "mrp": "mrp",
  "m.r.p": "mrp",
  "m.r.p.": "mrp",
  "retail price": "mrp",

  // Quantity
  "qty": "quantity",
  "quantity": "quantity",
  "qty.": "quantity",

  // Free
  "free": "freeQuantity",
  "free qty": "freeQuantity",
  "free quantity": "freeQuantity",
  "freeqty": "freeQuantity",
  "scheme qty": "freeQuantity",

  // Discount
  "disc1": "discount1",
  "discount": "discountPercentage",
  "disc": "discountPercentage",
  "disc%": "discountPercentage",
  "discount%": "discountPercentage",
  "discount percentage": "discountPercentage",

  // Scheme / Lot discount (secondary discounts — not primary)
  "scheme1": "scheme1",
  "lotdisc": "lotDisc",

  // Amount
  "amount": "amount",
  "net amount": "amount",
  "total": "amount",
  "line amount": "amount",
  "value": "amount",

  // GST
  "igst": "igstPct",
  "igst%": "igstPct",
  "igst amount": "igstAmount",
  "sgst": "sgstPct",
  "sgst%": "sgstPct",
  "sgst amount": "sgstAmount",
  "cgst": "cgstPct",
  "cgst%": "cgstPct",
  "cgst amount": "cgstAmount",
  "gst%": "gstPct",
  "gst": "gstPct",
  "tax%": "gstPct",

  // CESS
  "cess amount": "cessAmount",
  "cess rate": "cessRate",

  // HSN
  "hsn code": "hsnCode",
  "hsn": "hsnCode",
  "hsn no": "hsnCode",
  "hsn no.": "hsnCode",

  // GST Number
  "gst no.": "gstNumber",
  "gst no": "gstNumber",
  "gstin": "gstNumber",
  "gst number": "gstNumber",
  "supplier gstin": "gstNumber",
};

// ─── CSV Parser ──────────────────────────────────────────────────────

/**
 * Parse CSV text respecting quoted fields (handles commas within quotes).
 */
function parseCsvText(text: string): string[][] {
  const lines: string[][] = [];
  const rows = text.split(/\r?\n/);

  for (const row of rows) {
    if (!row.trim()) continue;

    const fields: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (inQuotes) {
        if (ch === '"') {
          if (i + 1 < row.length && row[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = false;
          }
        } else {
          current += ch;
        }
      } else {
        if (ch === '"') {
          inQuotes = true;
        } else if (ch === ",") {
          fields.push(current.trim());
          current = "";
        } else {
          current += ch;
        }
      }
    }
    fields.push(current.trim());
    lines.push(fields);
  }

  return lines;
}

/**
 * Normalize a column header string for alias matching.
 */
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
}

/**
 * Parse a date string from various supplier formats into YYYY-MM-DD.
 * Supports: DD/MM/YYYY, YYYY/MM/DD, DD-MM-YYYY, YYYY-MM-DD, MM/YYYY
 */
function parseDate(raw: string): string {
  if (!raw) return "";
  const s = raw.trim();

  // YYYY/MM/DD or YYYY-MM-DD
  const isoMatch = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }

  // MM/YYYY (expiry shorthand)
  const myMatch = s.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (myMatch) {
    return `${myMatch[2]}-${myMatch[1].padStart(2, "0")}-01`;
  }

  // YYYY/MM (another expiry shorthand)
  const ymMatch = s.match(/^(\d{4})[\/\-](\d{1,2})$/);
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2].padStart(2, "0")}-01`;
  }

  return s; // return as-is if unrecognized
}

function parseNum(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

// ─── Main Parser ─────────────────────────────────────────────────────

/**
 * Parse a CSV purchase bill string into structured data.
 */
export function parsePurchaseCsv(csvText: string): CsvParseResult {
  const warnings: string[] = [];
  const rows = parseCsvText(csvText);

  if (rows.length < 2) {
    return {
      header: { partyName: "", billNumber: "", billDate: "", gstNumber: "" },
      items: [],
      warnings: ["CSV file is empty or has no data rows."],
    };
  }

  // ── Map headers ──
  const headerRow = rows[0];
  const columnMap: Record<string, number> = {};

  for (let i = 0; i < headerRow.length; i++) {
    const normalized = normalizeHeader(headerRow[i]);
    const canonical = COLUMN_ALIASES[normalized];
    if (canonical) {
      columnMap[canonical] = i;
    }
  }

  // Check for required columns
  const requiredColumns = ["productName", "quantity"];
  for (const col of requiredColumns) {
    if (!(col in columnMap)) {
      warnings.push(`Required column "${col}" not found in CSV headers. Available: ${headerRow.join(", ")}`);
    }
  }

  if (!("productName" in columnMap)) {
    return {
      header: { partyName: "", billNumber: "", billDate: "", gstNumber: "" },
      items: [],
      warnings,
    };
  }

  // ── Helper to get value from a row ──
  const get = (row: string[], field: string): string => {
    const idx = columnMap[field];
    if (idx === undefined || idx >= row.length) return "";
    return row[idx].trim();
  };

  // ── Extract header info from first data row ──
  const firstDataRow = rows[1];
  const header: CsvBillHeader = {
    partyName: get(firstDataRow, "partyName"),
    billNumber: get(firstDataRow, "billNumber"),
    billDate: parseDate(get(firstDataRow, "billDate")),
    gstNumber: get(firstDataRow, "gstNumber"),
  };

  // ── Parse line items ──
  const items: CsvPurchaseRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const productName = get(row, "productName");

    // Skip empty rows
    if (!productName) continue;

    // Determine GST percentage
    const igstPct = parseNum(get(row, "igstPct"));
    const sgstPct = parseNum(get(row, "sgstPct"));
    const cgstPct = parseNum(get(row, "cgstPct"));
    const directGst = parseNum(get(row, "gstPct"));

    let gstPercentage = 0;
    if (directGst > 0) {
      gstPercentage = directGst;
    } else if (igstPct > 0) {
      gstPercentage = igstPct;
    } else if (sgstPct > 0 || cgstPct > 0) {
      gstPercentage = sgstPct + cgstPct;
    }

    // Use DISCOUNT column; fall back to DISC1 if DISCOUNT is missing
    let discPct = parseNum(get(row, "discountPercentage"));
    if (discPct === 0) {
      discPct = parseNum(get(row, "discount1"));
    }

    items.push({
      productName: productName.trim(),
      barcode: get(row, "barcode"),
      companyName: get(row, "companyName"),
      itemCode: get(row, "itemCode"),
      batchNumber: get(row, "batchNumber"),
      expiryDate: parseDate(get(row, "expiryDate")),
      ptr: parseNum(get(row, "ptr")),
      mrp: parseNum(get(row, "mrp")),
      quantity: Math.round(parseNum(get(row, "quantity"))),
      freeQuantity: Math.round(parseNum(get(row, "freeQuantity"))),
      discountPercentage: discPct,
      gstPercentage,
      amount: parseNum(get(row, "amount")),
      hsnCode: get(row, "hsnCode"),
      packing: get(row, "packing"),
    });
  }

  if (items.length === 0) {
    warnings.push("No valid data rows found in CSV.");
  }

  return { header, items, warnings };
}
