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

export interface NfcScanHandler {
  onScan: (serialNumber: string) => void;
  onError?: (err: Error) => void;
}

/**
 * Initializes continuous Web NFC scanning in Chromium browsers
 */
export async function startNfcScanner(handler: NfcScanHandler): Promise<() => void> {
  if (!isWebNfcSupported()) {
    throw new Error('Web NFC is not supported in this browser environment.');
  }

  try {
    // @ts-ignore - NDEFReader is standard in Chromium
    const ndef = new window.NDEFReader();
    await ndef.scan();

    const readingListener = (event: any) => {
      const serial = event.serialNumber ? normalizeNfcTapCard(event.serialNumber) : '';
      if (serial) {
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
