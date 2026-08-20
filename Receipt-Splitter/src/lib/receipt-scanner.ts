import Constants from 'expo-constants';

export type ParsedReceiptLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ParsedReceipt = {
  merchantName?: string;
  lineItems: ParsedReceiptLineItem[];
  tax?: number;
  tip?: number;
  fees?: number;
  total?: number;
};

const DEFAULT_SCAN_PORT = 8787;

function getScanApiUrl(): string {
  const configured = process.env.EXPO_PUBLIC_SCAN_API_URL?.trim().replace(/\/$/, '');
  if (configured) {
    return configured;
  }

  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) {
    return `http://${host}:${DEFAULT_SCAN_PORT}`;
  }

  return `http://localhost:${DEFAULT_SCAN_PORT}`;
}

function normalizeLineItem(item: ParsedReceiptLineItem): ParsedReceiptLineItem {
  const quantity = Number.isFinite(item.quantity) && item.quantity > 0 ? item.quantity : 1;
  const unitPrice = Number.isFinite(item.unitPrice) ? Math.max(0, item.unitPrice) : 0;

  return {
    name: item.name.trim(),
    quantity,
    unitPrice: Math.round(unitPrice * 100) / 100,
  };
}

function parseReceiptPayload(raw: unknown): ParsedReceipt {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Could not parse receipt data from the image.');
  }

  const data = raw as Record<string, unknown>;
  const lineItems = Array.isArray(data.lineItems)
    ? data.lineItems
        .filter((item): item is ParsedReceiptLineItem => {
          return (
            !!item &&
            typeof item === 'object' &&
            typeof (item as ParsedReceiptLineItem).name === 'string' &&
            (item as ParsedReceiptLineItem).name.trim().length > 0
          );
        })
        .map((item) => normalizeLineItem(item))
    : [];

  return {
    merchantName:
      typeof data.merchantName === 'string' && data.merchantName.trim()
        ? data.merchantName.trim()
        : undefined,
    lineItems,
    tax: typeof data.tax === 'number' ? data.tax : undefined,
    tip: typeof data.tip === 'number' ? data.tip : undefined,
    fees: typeof data.fees === 'number' ? data.fees : undefined,
    total: typeof data.total === 'number' ? data.total : undefined,
  };
}

export async function scanReceiptImage(base64: string, mimeType: string): Promise<ParsedReceipt> {
  const url = `${getScanApiUrl()}/scan`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mimeType }),
    });
  } catch {
    throw new Error(
      'Could not reach the scan server. In another terminal, run npm run server from the app folder.',
    );
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload &&
      typeof payload === 'object' &&
      'error' in payload &&
      typeof payload.error === 'string'
        ? payload.error
        : 'Receipt scan failed. Try again or use Start blank.';
    throw new Error(message);
  }

  const parsed = parseReceiptPayload(payload);

  if (parsed.lineItems.length === 0) {
    throw new Error('No line items were found. Try a clearer photo or add items manually.');
  }

  return parsed;
}
