/**
 * Format a number as Indian currency (₹)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a date string to a readable format
 */
export function formatDate(
  dateStr: string | null | undefined,
  options?: { short?: boolean }
): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';

  if (options?.short) {
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  }

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date as a relative time string (e.g. "2 hours ago")
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr, { short: true });
}

/**
 * Get today's date as YYYY-MM-DD string
 */
export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get month date range for a given offset (0 = current month, -1 = last month)
 */
export function monthRange(offset = 0): { from: string; to: string } {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  const y = d.getFullYear();
  const m = d.getMonth();
  const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m + 1, 0).getDate();
  const to = `${y}-${String(m + 1).padStart(2, '0')}-${lastDay}`;
  return { from, to };
}

/**
 * Abbreviate large numbers (1200 → "1.2K")
 */
export function abbreviateNumber(n: number): string {
  if (n >= 10000000) return (n / 10000000).toFixed(1) + 'Cr';
  if (n >= 100000) return (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
}
