/**
 * GST utilities for ShelfCure website panel POS / sales / purchases.
 * Mirrors desktop's gst.ts + gstCalc.ts behavior.
 *
 * Indian rule: MRP is inclusive of tax. Same state → CGST+SGST, different state → IGST.
 */

export type GstType = 'cgst_sgst' | 'igst';

export interface GstLineItem {
  taxableAmount: number;
  cgstPercentage: number;
  sgstPercentage: number;
  igstPercentage: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
}

export interface GstSummary {
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  totalGstAmount: number;
}

const INDIAN_STATE_ALIASES: Record<string, string> = {
  an: 'andaman and nicobar islands', ap: 'andhra pradesh', ar: 'arunachal pradesh',
  as: 'assam', br: 'bihar', ch: 'chandigarh', ct: 'chhattisgarh', cg: 'chhattisgarh',
  dn: 'dadra and nagar haveli and daman and diu', dd: 'daman and diu', dl: 'delhi',
  'new delhi': 'delhi', ga: 'goa', gj: 'gujarat', hr: 'haryana', hp: 'himachal pradesh',
  jk: 'jammu and kashmir', jh: 'jharkhand', ka: 'karnataka', kl: 'kerala',
  la: 'ladakh', ld: 'lakshadweep', mp: 'madhya pradesh', mh: 'maharashtra',
  mn: 'manipur', ml: 'meghalaya', mz: 'mizoram', nl: 'nagaland', or: 'odisha',
  od: 'odisha', py: 'puducherry', pb: 'punjab', rj: 'rajasthan', sk: 'sikkim',
  tn: 'tamil nadu', tg: 'telangana', ts: 'telangana', tr: 'tripura',
  up: 'uttar pradesh', ut: 'uttarakhand', uk: 'uttarakhand', wb: 'west bengal',
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function isInterState(
  otherState: string | null | undefined,
  pharmacyState: string | null | undefined,
  otherGstin?: string | null,
  pharmacyGstin?: string | null,
): boolean {
  if (otherGstin && pharmacyGstin) {
    const oCode = otherGstin.substring(0, 2);
    const pCode = pharmacyGstin.substring(0, 2);
    if (/^\d{2}$/.test(oCode) && /^\d{2}$/.test(pCode)) {
      return oCode !== pCode;
    }
  }
  if (!otherState || !pharmacyState) return false;
  const normalize = (s: string) => {
    let lower = s.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '');
    return INDIAN_STATE_ALIASES[lower] || lower;
  };
  return normalize(otherState) !== normalize(pharmacyState);
}

export function getGstType(
  businessState: string | null | undefined,
  customerState: string | null | undefined,
  businessGstin?: string | null,
  customerGstin?: string | null,
): GstType {
  return isInterState(customerState, businessState, customerGstin, businessGstin) ? 'igst' : 'cgst_sgst';
}

/**
 * Extract or add GST for a single line.
 * @param baseAmount  the line total (mrp×qty for inclusive, or pre-tax for exclusive)
 * @param gstRate     percent (e.g. 12)
 * @param gstType     'igst' for inter-state, otherwise CGST+SGST split
 * @param isInclusive true → tax extracted from baseAmount; false → tax added on top
 */
export function calculateSaleItemGst(
  baseAmount: number,
  gstRate: number,
  gstType: GstType,
  isInclusive: boolean = true,
): GstLineItem {
  if (gstRate === 0) {
    return {
      taxableAmount: round2(baseAmount),
      cgstPercentage: 0, sgstPercentage: 0, igstPercentage: 0,
      cgstAmount: 0, sgstAmount: 0, igstAmount: 0,
      totalGstAmount: 0,
    };
  }
  let taxableAmount: number;
  let totalGst: number;
  if (isInclusive) {
    taxableAmount = round2(baseAmount / (1 + gstRate / 100));
    totalGst = round2(baseAmount - taxableAmount);
  } else {
    taxableAmount = round2(baseAmount);
    totalGst = round2(baseAmount * (gstRate / 100));
  }
  if (gstType === 'igst') {
    return {
      taxableAmount,
      cgstPercentage: 0, sgstPercentage: 0, igstPercentage: gstRate,
      cgstAmount: 0, sgstAmount: 0, igstAmount: totalGst,
      totalGstAmount: totalGst,
    };
  }
  const halfRate = gstRate / 2;
  const half = round2(totalGst / 2);
  return {
    taxableAmount,
    cgstPercentage: halfRate, sgstPercentage: halfRate, igstPercentage: 0,
    cgstAmount: half, sgstAmount: round2(totalGst - half), igstAmount: 0,
    totalGstAmount: totalGst,
  };
}

export function sumGstLineItems(items: GstLineItem[]): GstSummary {
  return items.reduce(
    (acc, item) => ({
      taxableAmount: round2(acc.taxableAmount + item.taxableAmount),
      cgstAmount: round2(acc.cgstAmount + item.cgstAmount),
      sgstAmount: round2(acc.sgstAmount + item.sgstAmount),
      igstAmount: round2(acc.igstAmount + item.igstAmount),
      totalGstAmount: round2(acc.totalGstAmount + item.totalGstAmount),
    }),
    { taxableAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, totalGstAmount: 0 },
  );
}
