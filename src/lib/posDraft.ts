/**
 * posDraft.ts
 * Persists the in-progress POS cart to localStorage so the pharmacist can
 * resume an unsaved bill on the next visit. Key scheme: pos_draft_<pharmacyId>.
 */

import type { CartItem } from '@/store/posCartStore';

export interface PosDraftState {
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
  savedAt: string;
}

function draftKey(pharmacyId: string): string {
  return `pos_draft_${pharmacyId}`;
}

export function saveDraft(pharmacyId: string, state: PosDraftState): void {
  try { localStorage.setItem(draftKey(pharmacyId), JSON.stringify(state)); } catch {}
}

export function loadDraft(pharmacyId: string): PosDraftState | null {
  try {
    const raw = localStorage.getItem(draftKey(pharmacyId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PosDraftState;
    if (!Array.isArray(parsed.items)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearDraft(pharmacyId: string): void {
  try { localStorage.removeItem(draftKey(pharmacyId)); } catch {}
}

export function draftAge(savedAt: string): string {
  try {
    const diffMs = Date.now() - new Date(savedAt).getTime();
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return 'just now';
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} min ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hr ago`;
    const days = Math.floor(hr / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } catch {
    return 'recently';
  }
}

/** Persistent per-pharmacy POS hotkey storage (Alt+1..9). */
export interface PosHotkey {
  digit: number;
  medicine_id: string;
  medicine_name: string;
  manufacturer?: string | null;
  mrp?: number | null;
}

function hotkeyKey(pharmacyId: string): string {
  return `pos_hotkeys_${pharmacyId}`;
}

export function loadHotkeys(pharmacyId: string): PosHotkey[] {
  try {
    const raw = localStorage.getItem(hotkeyKey(pharmacyId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function setHotkey(pharmacyId: string, hk: PosHotkey): PosHotkey[] {
  const existing = loadHotkeys(pharmacyId).filter(h => h.digit !== hk.digit);
  const next = [...existing, hk].sort((a, b) => a.digit - b.digit);
  try { localStorage.setItem(hotkeyKey(pharmacyId), JSON.stringify(next)); } catch {}
  return next;
}

export function removeHotkey(pharmacyId: string, digit: number): PosHotkey[] {
  const next = loadHotkeys(pharmacyId).filter(h => h.digit !== digit);
  try { localStorage.setItem(hotkeyKey(pharmacyId), JSON.stringify(next)); } catch {}
  return next;
}

/** Per-pharmacy favourites (medicine ids). Local-only; mirrors desktop's DB-backed flag. */
function favKey(pharmacyId: string): string {
  return `pos_favs_${pharmacyId}`;
}
export function loadFavourites(pharmacyId: string): string[] {
  try {
    const raw = localStorage.getItem(favKey(pharmacyId));
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}
export function toggleFavourite(pharmacyId: string, medicineId: string): { ids: string[]; isFav: boolean } {
  const cur = loadFavourites(pharmacyId);
  const has = cur.includes(medicineId);
  const next = has ? cur.filter(id => id !== medicineId) : [...cur, medicineId];
  try { localStorage.setItem(favKey(pharmacyId), JSON.stringify(next)); } catch {}
  return { ids: next, isFav: !has };
}
