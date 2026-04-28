/**
 * Tiny Web Audio beep helpers for POS scanner / quick-add feedback.
 * Silent no-op if AudioContext not available (SSR-safe).
 */

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!ctx) {
      const Ctor = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, durationMs: number, volume = 0.05) {
  const ac = getCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain).connect(ac.destination);
    osc.start();
    osc.stop(ac.currentTime + durationMs / 1000);
  } catch {
    /* ignore */
  }
}

export function playSuccessBeep() {
  tone(880, 80);
  setTimeout(() => tone(1320, 80), 90);
}

export function playErrorBeep() {
  tone(220, 160);
}
