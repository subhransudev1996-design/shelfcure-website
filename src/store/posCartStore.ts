import { create } from 'zustand';

/* ─── Types ─── */
export interface PosMedicine {
  id: string;
  name: string;
  generic_name: string | null;
  manufacturer: string | null;
  salt_composition: string | null;
  strength: string | null;
  dosage_form: string | null;
  pack_size: number | null;
  pack_unit: string | null;
  sale_unit_mode: 'pack_only' | 'both' | 'unit' | string | null;
  units_per_pack: number | null;
  rack_location: string | null;
  gst_rate: number | null;
  barcode?: string | null;
}

export interface PosBatch {
  id: string;
  batch_number: string;
  expiry_date: string;          // ISO yyyy-mm-dd
  stock_quantity: number;       // current available
  mrp: number;
  purchase_price: number | null;
  selling_price?: number | null; // optional override
}

export interface CartItem {
  medicine: PosMedicine;
  batch: PosBatch;
  /** "pack" → non-flexible per-strip; "unit" → non-flexible per-unit; "both" → flexible (use strip_qty/unit_qty) */
  selling_unit: 'pack' | 'unit' | 'both';
  quantity: number;        // for "both": raw units = strip*upp + unit; otherwise human qty
  effective_qty: number;   // mirrors quantity (kept for compat)
  mrp: number;             // per-strip price for "pack"/"both"; per-unit for "unit"
  strip_qty?: number;
  unit_qty?: number;
  discount_percentage: number;
  gst_percentage: number;
  amount: number;          // line total
  taxable_amount: number;
  cgst_percentage: number;
  sgst_percentage: number;
  igst_percentage: number;
  cgst_amount: number;
  sgst_amount: number;
  igst_amount: number;
}

interface PosStore {
  items: CartItem[];
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  customerCreditLimit: number | null;
  customerOutstandingBalance: number;
  customerType: 'b2c' | 'b2b';
  customerGstin: string | null;
  customerState: string | null;

  paymentMethod: string;
  discountType: 'amount' | 'percentage';
  discountValue: number;
  notes: string;
  isPrescriptionSale: boolean;

  billGstRate: number;
  billGstInclusive: boolean;

  addItem: (item: CartItem) => void;
  updateItem: (batchId: string, updates: Partial<CartItem>) => void;
  removeItem: (batchId: string) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;

  setCustomer: (
    id: string | null, name: string | null, phone?: string | null,
    limit?: number | null, outstanding?: number,
    state?: string | null, gstin?: string | null,
  ) => void;
  setCustomerType: (t: 'b2c' | 'b2b') => void;
  setPaymentMethod: (m: string) => void;
  setDiscount: (type: 'amount' | 'percentage', value: number) => void;
  setNotes: (notes: string) => void;
  setPrescriptionSale: (v: boolean) => void;

  setBillGstRate: (rate: number) => void;
  setBillGstInclusive: (incl: boolean) => void;

  subtotal: () => number;
  totalGst: () => number;
  calculatedDiscount: () => number;
  total: () => number;
}

export const usePosCartStore = create<PosStore>((set, get) => ({
  items: [],
  customerId: null,
  customerName: null,
  customerPhone: null,
  customerCreditLimit: null,
  customerOutstandingBalance: 0,
  customerType: 'b2c',
  customerGstin: null,
  customerState: null,

  paymentMethod: 'cash',
  discountType: 'amount',
  discountValue: 0,
  notes: '',
  isPrescriptionSale: false,

  billGstRate: 0,
  billGstInclusive: false,

  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.batch.id === item.batch.id);
      if (existing) {
        if (existing.selling_unit === 'both' && item.selling_unit === 'both') {
          const addStrips = item.strip_qty ?? 1;
          const addUnits = item.unit_qty ?? 0;
          const newStrip = (existing.strip_qty ?? 0) + addStrips;
          const newUnit = (existing.unit_qty ?? 0) + addUnits;
          const upp = existing.medicine.units_per_pack ?? 1;
          const unitPrice = existing.mrp / upp;
          const newAmount = newStrip * existing.mrp + newUnit * unitPrice;
          const rawQty = newStrip * upp + newUnit;
          return {
            items: state.items.map((i) =>
              i.batch.id === item.batch.id
                ? { ...i, strip_qty: newStrip, unit_qty: newUnit, quantity: rawQty, effective_qty: rawQty, amount: newAmount }
                : i,
            ),
          };
        }
        const newQty = existing.quantity + item.quantity;
        const newAmount = newQty * existing.mrp;
        return {
          items: state.items.map((i) =>
            i.batch.id === item.batch.id ? { ...i, quantity: newQty, effective_qty: newQty, amount: newAmount } : i,
          ),
        };
      }
      return { items: [...state.items, item] };
    }),

  updateItem: (batchId, updates) =>
    set((state) => ({
      items: state.items.map((i) => (i.batch.id === batchId ? { ...i, ...updates } : i)),
    })),

  removeItem: (batchId) =>
    set((state) => ({ items: state.items.filter((i) => i.batch.id !== batchId) })),

  clearCart: () =>
    set({
      items: [],
      customerId: null, customerName: null, customerPhone: null,
      customerCreditLimit: null, customerOutstandingBalance: 0,
      customerGstin: null, customerState: null,
      discountType: 'amount', discountValue: 0,
      notes: '', isPrescriptionSale: false, paymentMethod: 'cash',
    }),

  setItems: (items) => set({ items }),

  setCustomer: (id, name, phone = null, limit = null, out = 0, state = null, gstin = null) =>
    set({
      customerId: id, customerName: name, customerPhone: phone,
      customerCreditLimit: limit, customerOutstandingBalance: out,
      customerState: state ?? null, customerGstin: gstin ?? null,
    }),
  setCustomerType: (t) => set({ customerType: t }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setDiscount: (type, value) => set({ discountType: type, discountValue: value }),
  setNotes: (notes) => set({ notes }),
  setPrescriptionSale: (v) => set({ isPrescriptionSale: v }),
  setBillGstRate: (rate) => set({ billGstRate: rate }),
  setBillGstInclusive: (incl) => set({ billGstInclusive: incl }),

  subtotal: () => get().items.reduce((acc, i) => acc + i.amount, 0),
  totalGst: () => get().items.reduce((acc, i) => acc + i.cgst_amount + i.sgst_amount + i.igst_amount, 0),
  calculatedDiscount: () => {
    const { subtotal, discountType, discountValue } = get();
    if (discountType === 'percentage') return (subtotal() * discountValue) / 100;
    return discountValue;
  },
  total: () => {
    const { subtotal, calculatedDiscount, totalGst, billGstInclusive } = get();
    const base = subtotal() - calculatedDiscount();
    return Math.max(0, billGstInclusive ? base : base + totalGst());
  },
}));
