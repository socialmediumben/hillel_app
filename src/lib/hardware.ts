/**
 * Hardware interface for Web NFC (NDEFReader) and card normalization
 */

export function normalizeNfcTapCard(raw: string): string {
  if (!raw) return '';
  const clean = raw.trim();
  // Converts colon-separated hex (e.g. "04:a2:3b:4c" or "04:A2:3B:4C")
  if (/^([0-9a-fA-F]{2}:)+[0-9a-fA-F]{2}$/.test(clean)) {
    return clean.replace(/:/g, '').toUpperCase();
  }
  return clean;
}

export function isWebNfcSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'NDEFReader' in window;
}

/**
 * Provides a short haptic buzz on mobile phones
 */
export function triggerHapticFeedback(): void {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([100, 50, 100]);
    } catch (_) {}
  }
}

/**
 * Synthesizes a pleasant check-in chime using Web Audio API (zero audio file dependencies)
 */
export function playSuccessChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.1); // A5

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (_) {}
}

export interface NfcScanHandler {
  onScan: (serialNumber: string) => void;
  onError?: (err: Error) => void;
}

/**
 * Initializes Web NFC scanning. Must be invoked via a user gesture on mobile Chrome (e.g. tapping a button).
 */
export async function startNfcScanner(handler: NfcScanHandler): Promise<() => void> {
  if (!isWebNfcSupported()) {
    throw new Error('Web NFC is not supported on this browser (supported on Android Chrome).');
  }

  try {
    // @ts-ignore - NDEFReader is standard in Chromium
    const ndef = new window.NDEFReader();
    await ndef.scan();

    const readingListener = (event: any) => {
      const serial = event.serialNumber ? normalizeNfcTapCard(event.serialNumber) : '';
      if (serial) {
        triggerHapticFeedback();
        playSuccessChime();
        handler.onScan(serial);
      }
    };

    const errorListener = (error: any) => {
      if (handler.onError) {
        handler.onError(error);
      }
    };

    ndef.addEventListener('reading', readingListener);
    ndef.addEventListener('readingerror', errorListener);

    return () => {
      try {
        ndef.removeEventListener('reading', readingListener);
        ndef.removeEventListener('readingerror', errorListener);
      } catch (_) {}
    };
  } catch (err: any) {
    if (handler.onError) handler.onError(err);
    throw err;
  }
}
