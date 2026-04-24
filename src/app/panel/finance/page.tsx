'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { usePanelStore } from '@/store/panelStore';
import { formatCurrency, formatDate, formatRelativeTime, monthRange } from '@/lib/utils/format';
import toast from 'react-hot-toast';
import {
  Wallet, Plus, Calendar, Search, X,
  Trash2, Save, Loader2, IndianRupee,
  FileText, Tag, ArrowDownRight,
  BarChart2, BarChart3, TrendingDown, AlertCircle, CreditCard,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
interface Expense {
  id: number;
  category_id?: number;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  payment_method?: string;
  notes?: string;
}

interface ExpenseCategory {
  id: number;
  name: string;
  is_system: boolean;
}

/* ─── Palette ────────────────────────────────────────── */
const C = {
  card: '#0b0f24', cardBorder: 'rgba(255,255,255,0.06)',
  text: '#f1f5f9', muted: '#475569', subtle: '#94a3b8',
  indigo: '#6366f1', indigoLight: '#818cf8',
  emerald: '#10b981', amber: '#f59e0b', rose: '#f43f5e',
  blue: '#3b82f6', purple: '#a855f7', teal: '#14b8a6',
  orange: '#f97316',
  input: '#0d1127', inputBorder: 'rgba(255,255,255,0.1)',
};

const CATEGORY_COLORS: Record<string, string> = {
  Rent: C.indigo, Salary: C.blue, Electricity: C.amber,
  Supplies: C.teal, Transport: C.orange, Maintenance: C.rose,
  Marketing: C.purple, Other: C.muted,
};

function todayStr() { return new Date().toISOString().split('T')[0]; }

function getMonthRange(offset = 0) {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear();
  const m = d.getMonth();
  const last = new Date(y, m + 1, 0).getDate();
  return {
    from: `${y}-${String(m + 1).padStart(2, '0')}-01`,
    to: `${y}-${String(m + 1).padStart(2, '0')}-${last}`,
  };
}

/* ─── Shared input style ─────────────────────────────── */
const inp: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  backgroundColor: C.input, border: `1.5px solid ${C.inputBorder}`,
  borderRadius: 12, padding: '10px 14px', fontSize: 13, fontWeight: 500,
  color: C.text, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.15s ease',
};
const inpL: React.CSSProperties = { ...inp, paddingLeft: 34 };

/* ─── Page ───────────────────────────────────────────── */
export default function FinancePage() {
  const supabase = createClient();
  const pharmacyId = usePanelStore(s => s.pharmacyId);
  const pharmacyIdRef = useRef(pharmacyId);
  useEffect(() => { pharmacyIdRef.current = pharmacyId; }, [pharmacyId]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  /* ── Date range (matches desktop: from/to + quick buttons) ── */
  const { from: mFrom, to: mTo } = monthRange(0);
  const [fromDate, setFromDate] = useState(mFrom);
  const [toDate, setToDate] = useState(mTo);

  /* ── Category management ── */
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [catSaving, setCatSaving] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  /* ── Add expense form ── */
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [form, setForm] = useState({
    description: '', amount: '', category_id: '',
    expense_date: todayStr(), payment_method: 'cash', notes: '',
  });
  const setF = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }));

  const PAYMENT_METHODS = [
    { id: 'cash', label: 'CASH' }, { id: 'upi', label: 'UPI' },
    { id: 'card', label: 'CARD' }, { id: 'bank_transfer', label: 'BANK TRANSFER' },
    { id: 'cheque', label: 'CHEQUE' },
  ];

  /* ─── Load ─── */
  async function load() {
    const pid = pharmacyIdRef.current;
    if (!pid) { setLoading(false); return; }
    setLoading(true);
    try {
      // Query expenses — use wildcard to avoid breaking on missing columns
      const expRes = await supabase
        .from('expenses')
        .select('*')
        .eq('pharmacy_id', pid)
        .gte('expense_date', fromDate)
        .lte('expense_date', toDate)
        .order('expense_date', { ascending: false })
        .limit(500);

      if (expRes.error) throw expRes.error;

      // Map payment_mode → payment_method for backward compatibility
      const mapped = (expRes.data || []).map((e: any) => ({
        ...e,
        payment_method: e.payment_method || e.payment_mode || null,
      }));
      setExpenses(mapped);

      // Try loading expense_categories — may not exist yet
      try {
        const catRes = await supabase
          .from('expense_categories')
          .select('*')
          .eq('pharmacy_id', pid)
          .order('name', { ascending: true });
        setCategories(catRes.data || []);
      } catch {
        // Table doesn't exist yet — use empty categories
        setCategories([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (pharmacyId) load();
    else setLoading(false);
  }, [pharmacyId]);

  useEffect(() => {
    if (pharmacyId) load();
  }, [fromDate, toDate]);

  /* ─── Client-side search filter ─── */
  const filtered = useMemo(() => {
    if (!search.trim()) return expenses;
    const q = search.toLowerCase();
    return expenses.filter(e =>
      (e.description || '').toLowerCase().includes(q) ||
      (e.category || '').toLowerCase().includes(q)
    );
  }, [expenses, search]);

  /* ─── Stats ─── */
  const totalExpenses = filtered.reduce((s, e) => s + e.amount, 0);

  const catMap = filtered.reduce<Record<string, number>>((acc, e) => {
    const name = categories.find(c => c.id === e.category_id)?.name || e.category || 'Uncategorized';
    acc[name] = (acc[name] || 0) + e.amount;
    return acc;
  }, {});

  const maxCat = Math.max(...Object.values(catMap), 1);

  /* ─── Handlers ─── */
  const handleAdd = async (ev: React.FormEvent) => {
    ev.preventDefault();
    const pid = pharmacyIdRef.current;
    if (!pid) return;
    const amt = parseFloat(form.amount);
    if (!form.description.trim() || isNaN(amt) || amt <= 0) {
      setAddError('Description and a valid amount are required');
      return;
    }
    setAddError(null);
    setSaving(true);
    try {
      const selectedCat = categories.find(c => c.id === Number(form.category_id));
      // Build payload with only guaranteed columns first
      const payload: Record<string, any> = {
        pharmacy_id: pid,
        category: selectedCat?.name || form.description.trim().split(' ')[0] || 'Uncategorized',
        description: form.description.trim(),
        amount: amt,
        expense_date: form.expense_date,
        payment_mode: form.payment_method,
      };
      // Add new columns if migration has been applied (safe — PostgREST ignores unknown cols on insert)
      if (form.category_id) payload.category_id = form.category_id;
      if (form.payment_method) payload.payment_method = form.payment_method;
      if (form.notes.trim()) payload.notes = form.notes.trim();

      const { error } = await supabase.from('expenses').insert(payload);
      if (error) throw error;
      toast.success('Expense recorded successfully!');
      setShowAdd(false);
      setAddError(null);
      setForm({ description: '', amount: '', category_id: '', expense_date: todayStr(), payment_method: 'cash', notes: '' });
      load();
    } catch (err: any) {
      setAddError(err?.message || 'Failed to record expense');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = pharmacyIdRef.current;
    if (!pid || !newCatName.trim()) return;
    setCatSaving(true);
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert({ pharmacy_id: pid, name: newCatName.trim(), is_system: false })
        .select().single();
      if (error) throw error;
      setCategories(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCatName('');
      toast.success('Category added');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const { error } = await supabase.from('expense_categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(c => c.id !== id));
      if (form.category_id === String(id)) setF('category_id', '');
      toast.success('Category deleted');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      toast.success('Expense deleted');
      setExpenses(prev => prev.filter(e => e.id !== id));
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete');
    }
  };

  /* ─── Render ─── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 48, width: '100%' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Wallet style={{ width: 20, height: 20, color: C.indigo }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.text, letterSpacing: '-0.03em' }}>Finance Hub</h1>
            <p style={{ margin: '3px 0 0', fontSize: 12, color: C.muted }}>Expense tracking, credit ledgers and financial overview</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 22px', borderRadius: 13, border: 'none', backgroundColor: C.indigo, color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 14px rgba(99,102,241,0.3)', transition: 'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.indigo; e.currentTarget.style.transform = 'translateY(0)'; }}>
          <Plus style={{ width: 16, height: 16 }} />
          Log Expense
        </button>
      </div>

      {/* ── Quick links ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Customer Ledgers', desc: 'Manage receivables', icon: TrendingDown, color: C.indigo, path: '/panel/crm' },
          { label: 'Supplier Ledgers', desc: 'Manage payables', icon: BarChart3, color: C.orange, path: '/panel/inventory/suppliers' },
        ].map(l => (
          <button key={l.label} onClick={() => window.location.href = l.path}
            style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C.cardBorder; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: `${l.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <l.icon style={{ width: 18, height: 18, color: l.color }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: C.text }}>{l.label}</p>
              <p style={{ margin: '2px 0 0', fontSize: 9, fontWeight: 800, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Date range bar (matches desktop layout) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 16, padding: '12px 18px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <Calendar style={{ width: 15, height: 15, color: C.muted, flexShrink: 0 }} />

        {/* From / To pickers */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
            style={{ background: 'none', border: `1px solid ${C.inputBorder}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: C.text, outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' as any }} />
          <span style={{ color: C.muted, fontSize: 11, fontWeight: 700 }}>to</span>
          <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
            style={{ background: 'none', border: `1px solid ${C.inputBorder}`, borderRadius: 8, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: C.text, outline: 'none', fontFamily: 'inherit', colorScheme: 'dark' as any }} />
        </div>

        {/* Quick month buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[{ label: 'This Month', r: getMonthRange(0) }, { label: 'Last Month', r: getMonthRange(-1) }].map(p => (
            <button key={p.label}
              onClick={() => { setFromDate(p.r.from); setToDate(p.r.to); }}
              style={{ padding: '6px 12px', borderRadius: 9, border: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.04)', color: C.subtle, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s ease' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = C.indigoLight; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.subtle; e.currentTarget.style.borderColor = C.cardBorder; }}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 180, display: 'flex', alignItems: 'center', gap: 8, padding: '0 10px', height: 36, backgroundColor: C.input, border: `1.5px solid ${searchFocus ? C.indigo : C.inputBorder}`, borderRadius: 10, transition: 'all 0.15s ease', boxShadow: searchFocus ? '0 0 0 3px rgba(99,102,241,0.1)' : 'none' }}>
          <Search style={{ width: 12, height: 12, color: searchFocus ? C.indigo : C.muted, flexShrink: 0 }} />
          <input value={search} onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
            placeholder="Search expenses…"
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, fontWeight: 500, color: C.text, fontFamily: 'inherit' }} />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', padding: 0 }}>
              <X style={{ width: 11, height: 11 }} />
            </button>
          )}
        </div>

        {/* Total */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9.5, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Total:</span>
          <span style={{ fontSize: 15, fontWeight: 900, color: C.rose }}>{loading ? '—' : formatCurrency(totalExpenses)}</span>
        </div>
      </div>

      {/* ── Content grid (1/3 category + 2/3 list — matches desktop) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 18 }}>

        {/* Category Breakdown */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, padding: '20px', height: 'fit-content' }}>
          <h3 style={{ margin: '0 0 18px', fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>By Category</h3>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 0' }}>
              <Loader2 style={{ width: 18, height: 18, color: C.muted, animation: 'spin 1s linear infinite' }} />
            </div>
          ) : Object.keys(catMap).length === 0 ? (
            <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: C.muted, padding: '28px 0' }}>No expenses logged</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {Object.entries(catMap).sort((a, b) => b[1] - a[1]).map(([name, total]) => {
                const color = CATEGORY_COLORS[name] || C.muted;
                const perc = (total / maxCat) * 100;
                const count = filtered.filter(e => {
                  const n = categories.find(c => c.id === e.category_id)?.name || e.category || 'Uncategorized';
                  return n === name;
                }).length;
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{name}</span>
                      <span style={{ fontSize: 12, fontWeight: 900, color: C.text }}>{formatCurrency(total)}</span>
                    </div>
                    <div style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${perc}%`, backgroundColor: color, borderRadius: 99, transition: 'width 0.7s ease-out' }} />
                    </div>
                    <p style={{ margin: '4px 0 0', fontSize: 10, color: C.muted }}>{count} {count === 1 ? 'entry' : 'entries'}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Expense Log */}
        <div style={{ backgroundColor: C.card, border: `1px solid ${C.cardBorder}`, borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: `1px solid ${C.cardBorder}`, backgroundColor: 'rgba(255,255,255,0.015)' }}>
            <h3 style={{ margin: 0, fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Expense Log</h3>
            <span style={{ fontSize: 11, fontWeight: 800, color: C.muted }}>{filtered.length} {filtered.length === 1 ? 'entry' : 'entries'}</span>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Loader2 style={{ width: 20, height: 20, color: C.indigo, animation: 'spin 1s linear infinite' }} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: C.muted, fontWeight: 500 }}>Loading records…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '56px 32px', gap: 14 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Wallet style={{ width: 24, height: 24, color: 'rgba(99,102,241,0.3)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: C.subtle }}>No expenses in this period</p>
                <p style={{ margin: '5px 0 0', fontSize: 12, color: C.muted }}>
                  {search ? `No results for "${search}"` : 'Adjust the date range or log a new expense'}
                </p>
              </div>
              {!search && (
                <button onClick={() => setShowAdd(true)}
                  style={{ background: 'none', border: 'none', color: C.indigo, fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
                  onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                  onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                  + Log first expense
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 380px)' }}>
              {filtered.map((exp, idx) => {
                const catName = categories.find(c => c.id === exp.category_id)?.name || exp.category || 'Uncategorized';
                const catColor = CATEGORY_COLORS[catName] || C.muted;
                return (
                  <div key={exp.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px', borderBottom: idx < filtered.length - 1 ? `1px solid rgba(255,255,255,0.025)` : 'none', transition: 'background 0.12s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.02)'; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; }}>

                    {/* Category color accent bar */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: `${catColor}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: `1px solid ${catColor}25` }}>
                      <Tag style={{ width: 14, height: 14, color: catColor }} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {exp.description}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                        <Calendar style={{ width: 10, height: 10, color: C.muted }} />
                        <span style={{ fontSize: 11, color: C.muted }}>{formatDate(exp.expense_date)}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, color: catColor, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{catName}</span>
                        {exp.payment_method && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, padding: '1px 6px', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 4, textTransform: 'uppercase' }}>
                            {exp.payment_method.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      {exp.notes && <p style={{ margin: '3px 0 0', fontSize: 10, color: C.muted, fontStyle: 'italic' }}>{exp.notes}</p>}
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 900, color: C.rose, letterSpacing: '-0.01em' }}>
                        − {formatCurrency(exp.amount)}
                      </p>
                      {deleteId === exp.id ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <button onClick={() => handleDelete(exp.id)} style={{ padding: '3px 8px', backgroundColor: C.rose, color: '#fff', border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 800, cursor: 'pointer' }}>Delete</button>
                          <button onClick={() => setDeleteId(null)} style={{ padding: '3px 6px', background: 'none', border: 'none', color: C.muted, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteId(exp.id)} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: '4px 0 0', display: 'block', marginLeft: 'auto' }}
                          onMouseEnter={e => e.currentTarget.style.color = C.rose}
                          onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                          <Trash2 style={{ width: 13, height: 13 }} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Add Expense Modal ── */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setShowAdd(false); setAddError(null); } }}>
          <div style={{ backgroundColor: '#0d1127', border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 22, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', width: '100%', maxWidth: 480, overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Plus style={{ width: 18, height: 18, color: C.indigo }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 900, color: C.text }}>Log Expense</h3>
                  <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Record a new outflow</p>
                </div>
              </div>
              <button onClick={() => { setShowAdd(false); setAddError(null); }}
                style={{ width: 32, height: 32, borderRadius: 10, border: 'none', backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s ease' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}>
                <X style={{ width: 15, height: 15 }} />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAdd} style={{ padding: '20px 24px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {addError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 12, padding: '10px 14px' }}>
                  <AlertCircle style={{ width: 14, height: 14, color: C.rose, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.rose }}>{addError}</span>
                </div>
              )}

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>Description *</label>
                <input type="text" value={form.description} onChange={e => setF('description', e.target.value)}
                  placeholder="e.g. Electricity bill, Staff salary…" autoFocus
                  style={inp}
                  onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                  onBlur={e => e.currentTarget.style.borderColor = C.inputBorder} />
              </div>

              {/* Amount & Date */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>Amount (₹) *</label>
                  <div style={{ position: 'relative' }}>
                    <IndianRupee style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.muted }} />
                    <input type="number" min="1" step="0.01" value={form.amount} onChange={e => setF('amount', e.target.value)}
                      placeholder="0.00" style={inpL}
                      onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                      onBlur={e => e.currentTarget.style.borderColor = C.inputBorder} />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>Date *</label>
                  <div style={{ position: 'relative' }}>
                    <Calendar style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.muted }} />
                    <input type="date" value={form.expense_date} onChange={e => setF('expense_date', e.target.value)}
                      style={{ ...inpL, colorScheme: 'dark' as any }}
                      onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                      onBlur={e => e.currentTarget.style.borderColor = C.inputBorder} />
                  </div>
                </div>
              </div>

              {/* Category & Payment */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Category</label>
                    <button type="button" onClick={() => setShowManageCategories(true)}
                      style={{ background: 'none', border: 'none', fontSize: 10, fontWeight: 800, color: C.indigo, cursor: 'pointer', padding: 0 }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Manage</button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <Tag style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.muted }} />
                    <select value={form.category_id} onChange={e => setF('category_id', e.target.value)}
                      style={{ ...inpL, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' as any }}
                      onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                      onBlur={e => e.currentTarget.style.borderColor = C.inputBorder}>
                      <option value="">Uncategorized</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>Payment Method</label>
                  <div style={{ position: 'relative' }}>
                    <CreditCard style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.muted }} />
                    <select value={form.payment_method} onChange={e => setF('payment_method', e.target.value)}
                      style={{ ...inpL, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' as any }}
                      onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                      onBlur={e => e.currentTarget.style.borderColor = C.inputBorder}>
                      {PAYMENT_METHODS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label style={{ display: 'block', fontSize: 10, fontWeight: 900, color: C.muted, textTransform: 'uppercase', marginBottom: 6, letterSpacing: '0.1em' }}>Notes</label>
                <div style={{ position: 'relative' }}>
                  <FileText style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: C.muted }} />
                  <input type="text" value={form.notes} onChange={e => setF('notes', e.target.value)}
                    placeholder="Optional reference…" style={inpL}
                    onFocus={e => e.currentTarget.style.borderColor = C.indigo}
                    onBlur={e => e.currentTarget.style.borderColor = C.inputBorder} />
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, marginTop: 4, paddingTop: 16, borderTop: `1px solid rgba(255,255,255,0.06)` }}>
                <button type="button" onClick={() => { setShowAdd(false); setAddError(null); }}
                  style={{ flex: 1, padding: '11px 0', background: 'none', border: `1.5px solid rgba(255,255,255,0.09)`, borderRadius: 12, color: C.muted, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.text; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.muted; }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '11px 0', borderRadius: 12, border: 'none', backgroundColor: C.indigo, color: '#fff', fontSize: 13, fontWeight: 800, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.65 : 1, boxShadow: '0 4px 14px rgba(99,102,241,0.25)', fontFamily: 'inherit', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { if (!saving) { e.currentTarget.style.backgroundColor = '#4f46e5'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = C.indigo; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {saving ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 15, height: 15 }} />}
                  {saving ? 'Saving…' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Manage Categories Modal ── */}
      {showManageCategories && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setShowManageCategories(false); }}>
          <div style={{ backgroundColor: '#0d1127', border: `1px solid rgba(255,255,255,0.09)`, borderRadius: 22, boxShadow: '0 24px 60px rgba(0,0,0,0.6)', width: '100%', maxWidth: 380, overflow: 'hidden' }}>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px 14px', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: C.text }}>Expense Categories</h3>
              <button onClick={() => setShowManageCategories(false)}
                style={{ width: 30, height: 30, borderRadius: 9, border: 'none', backgroundColor: 'rgba(255,255,255,0.04)', color: C.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = C.text; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = C.muted; }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            <div style={{ padding: '16px 22px', maxHeight: 300, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {categories.map(cat => (
                <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${C.cardBorder}`, borderRadius: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{cat.name}</span>
                  {!cat.is_system && (
                    <button onClick={() => handleDeleteCategory(cat.id)}
                      style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 4, display: 'flex' }}
                      onMouseEnter={e => e.currentTarget.style.color = C.rose}
                      onMouseLeave={e => e.currentTarget.style.color = C.muted}>
                      <Trash2 style={{ width: 14, height: 14 }} />
                    </button>
                  )}
                </div>
              ))}
              {categories.length === 0 && (
                <p style={{ margin: 0, textAlign: 'center', fontSize: 12, color: C.muted, padding: '20px 0' }}>No categories defined</p>
              )}
            </div>

            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: 8, padding: '14px 22px 20px', borderTop: `1px solid ${C.cardBorder}` }}>
              <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)}
                placeholder="New category name…"
                style={{ flex: 1, backgroundColor: C.input, border: `1px solid ${C.inputBorder}`, borderRadius: 10, padding: '9px 12px', fontSize: 12, color: C.text, outline: 'none', fontFamily: 'inherit' }}
                onKeyDown={e => e.key === 'Enter' && handleAddCategory(e as any)} />
              <button type="submit" disabled={catSaving || !newCatName.trim()}
                style={{ padding: '9px 16px', borderRadius: 10, border: 'none', backgroundColor: C.indigo, color: '#fff', fontSize: 12, fontWeight: 800, cursor: (catSaving || !newCatName.trim()) ? 'not-allowed' : 'pointer', opacity: (catSaving || !newCatName.trim()) ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                {catSaving ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : 'Add'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
