'use client';

import { useState } from 'react';
import { monthRange, todayStr } from '@/lib/utils/format';

interface DateRangePickerProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  presets?: boolean;
}

export function DateRangePicker({ from, to, onChange, presets = true }: DateRangePickerProps) {
  const quickRanges = [
    { label: 'Today', range: () => ({ from: todayStr(), to: todayStr() }) },
    { label: 'This Month', range: () => monthRange(0) },
    { label: 'Last Month', range: () => monthRange(-1) },
  ];

  return (
    <div className="flex items-center gap-3 flex-wrap bg-slate-900/60 border border-white/5 rounded-xl p-3">
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={from}
          onChange={(e) => onChange(e.target.value, to)}
          className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all"
        />
        <span className="text-slate-500 text-xs font-bold">to</span>
        <input
          type="date"
          value={to}
          onChange={(e) => onChange(from, e.target.value)}
          className="bg-slate-800/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-indigo-500/50 transition-all"
        />
      </div>
      {presets && (
        <div className="flex items-center gap-1.5">
          {quickRanges.map((q) => (
            <button
              key={q.label}
              onClick={() => {
                const r = q.range();
                onChange(r.from, r.to);
              }}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition-all"
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
