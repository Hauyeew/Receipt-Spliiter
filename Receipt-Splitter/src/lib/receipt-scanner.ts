export type ParsedReceiptLineItem = {
  name: string;
  quantity: number;
  unitPrice: number;
};

export type ParsedReceipt = {
  merchantName?: string;
  lineItems: ParsedReceiptLineItem[];
  tax?: number;
  fees?: number;
  total?: number;
};

const RECEIPT_SCHEMA = {
  type: 'object',
  properties: {
    merchantName: { type: 'string', nullable: true },
    lineItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          quantity: { type: 'number' },
          unitPrice: { type: 'number' },
        },
        required: ['name', 'quantity', 'unitPrice'],
      },
    },
    tax: { type: 'number', nullable: true },
    fees: { type: 'number', nullable: true },
    total: { type: 'number', nullable: true },
  },
  required: ['lineItems'],
} as const;

const SCAN_PROMPT = `You are a receipt parser. Extract purchasable line items from this receipt image.

Return JSON only with:
- merchantName: store or restaurant name, or null
- lineItems: array of { name, quantity, unitPrice } for each food/product item
- tax: sales tax amount, or null
- fees: service or delivery fees, or null
- total: receipt grand total, or null

Rules:
- unitPrice is the price for a single unit of the item
- If the receipt shows line total and quantity, compute unitPrice = lineTotal / quantity
- Exclude subtotal, tax, tip, total, payment, and change lines from lineItems
- Use plain item names without SKU codes when possible
- All amounts are in USD`;

const SCAN_MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash'] as const;
const MAX_ATTEMPTS_PER_MODEL = 3;
const RETRY_DELAYS_MS = [1500, 3000, 5000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getApiKey(): string {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Receipt scanning is not configured. Add EXPO_PUBLIC_GEMINI_API_KEY to your .env file.',
    );
  }
  return apiKey;
}

function parseErrorMessage(errorText: string): string {
  try {
    const payload = JSON.parse(errorText) as { error?: { message?: string } };
    return payload.error?.message ?? '';
  } catch {
    return '';
  }
}

function isRetryableError(status: number, message: string): boolean {
  if (status === 503 || status === 500) {
    return true;
  }

  if (/api key expired|prepayment credits are depleted|invalid api key/i.test(message)) {
    return false;
  }

  if (/high demand|temporarily unavailable|overloaded|try again later/i.test(message)) {
    return true;
  }

  return status === 429;
}

function formatApiError(status: number, errorText: string): string {
  if (status === 401 || status === 403) {
    return 'Invalid Gemini API key. Check EXPO_PUBLIC_GEMINI_API_KEY in your .env file.';
  }

  const message = parseErrorMessage(errorText);

  if (/api key expired/i.test(message)) {
    return 'Your Gemini API key has expired. Create a new key at aistudio.google.com/apikey and update your .env file.';
  }

  if (/prepayment credits are depleted/i.test(message)) {
    return 'Your Google AI project has no credits left. Add billing in AI Studio, or create a new free project and API key at aistudio.google.com/apikey.';
  }

  if (/high demand|temporarily unavailable|overloaded|try again later/i.test(message)) {
    return 'Gemini is busy right now. Wait a moment and try again.';
  }

  if (status === 429) {
    return 'Gemini API quota exceeded. Wait a minute, or create a new API key at aistudio.google.com/apikey.';
  }

  if (message) {
    return `Receipt scan failed: ${message}`;
  }

  return `Receipt scan failed (${status}). Try again or use Start blank.`;
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
    fees: typeof data.fees === 'number' ? data.fees : undefined,
    total: typeof data.total === 'number' ? data.total : undefined,
  };
}

async function requestReceiptScan(
  apiKey: string,
  model: (typeof SCAN_MODELS)[number],
  base64: string,
  mimeType: string,
) {
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SCAN_PROMPT },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: RECEIPT_SCHEMA,
          temperature: 0.1,
          ...(model === 'gemini-2.5-flash'
            ? { thinkingConfig: { thinkingBudget: 0 } }
            : {}),
        },
      }),
    },
  );
}

export async function scanReceiptImage(base64: string, mimeType: string): Promise<ParsedReceipt> {
  const apiKey = getApiKey();
  let lastError = 'Receipt scan failed. Try again or use Start blank.';

  for (const model of SCAN_MODELS) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS_PER_MODEL; attempt += 1) {
      if (attempt > 0) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 5000);
      }

      const response = await requestReceiptScan(apiKey, model, base64, mimeType);

      if (!response.ok) {
        const errorText = await response.text();
        const message = parseErrorMessage(errorText);
        lastError = formatApiError(response.status, errorText);

        if (isRetryableError(response.status, message)) {
          continue;
        }

        throw new Error(lastError);
      }

      const payload = await response.json();
      const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (typeof text !== 'string') {
        throw new Error('No receipt data was found in the image. Try a clearer photo.');
      }

      const parsed = parseReceiptPayload(JSON.parse(text));

      if (parsed.lineItems.length === 0) {
        throw new Error('No line items were found. Try a clearer photo or add items manually.');
      }

      return parsed;
    }
  }

  throw new Error(lastError);
}
