export interface PurchaseLineItem {
  id: string; // local temp id
  medicine_id: string | null;
  medicine_name: string;
  batch_number: string;
  expiry_date: string;
  quantity: number;
  free_quantity: number;
  purchase_rate: number;
  mrp: number;
  selling_price: number;
  gst_percentage: number;
  discount_percentage: number;
  sale_unit_mode: string;
  units_per_pack: number;
  barcode: string;
  original_barcode: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string | null;
  gstin: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
}

export interface PharmacyProfile {
  id: string;
  name: string;
  state: string | null;
  gstin: string | null;
}

export function calcPurchaseItemGst(
  ptr: number,
  qty: number,
  gstPercentage: number,
  discPercentage: number,
  interState: boolean
) {
  const baseAmount = ptr * qty;
  const discountAmount = baseAmount * (discPercentage / 100);
  const taxableAmount = baseAmount - discountAmount;
  const gstAmount = taxableAmount * (gstPercentage / 100);

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (interState) {
    igstAmount = gstAmount;
  } else {
    cgstAmount = gstAmount / 2;
    sgstAmount = gstAmount / 2;
  }

  const totalAmount = taxableAmount + gstAmount;

  return {
    baseAmount,
    discountAmount,
    taxableAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalAmount,
  };
}

export function isInterState(
  supplierState?: string | null,
  pharmacyState?: string | null,
  supplierGstin?: string | null,
  pharmacyGstin?: string | null
): boolean {
  if (supplierGstin && pharmacyGstin && supplierGstin.length >= 2 && pharmacyGstin.length >= 2) {
    return supplierGstin.substring(0, 2) !== pharmacyGstin.substring(0, 2);
  }
  if (supplierState && pharmacyState) {
    return supplierState.toLowerCase().trim() !== pharmacyState.toLowerCase().trim();
  }
  return false;
}
