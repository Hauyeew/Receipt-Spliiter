import { createId } from '@/lib/create-id';
import type { ParsedReceipt } from '@/lib/receipt-scanner';
import { computeTipTotal } from '@/lib/split-calculator';
import type { LineItem } from '@/models/LineItem';
import type { Participant } from '@/models/Participant';
import type { Receipt } from '@/models/Receipt';
import type { SplitSession } from '@/models/SplitSession';

function roundMoney(amount: number): number {
  return Math.round(amount * 100) / 100;
}

export function recalculateReceipt(receipt: Receipt, session?: Pick<SplitSession, 'tipMode' | 'tipValue'>): Receipt {
  const subtotal = roundMoney(
    receipt.lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
  );

  const tip =
    session?.tipMode === 'percent' || session?.tipMode === 'fixed'
      ? 0
      : receipt.tip;

  const total = roundMoney(subtotal + receipt.tax + tip + receipt.fees);

  return { ...receipt, subtotal, tip, total };
}

export function recalculateSessionTotal(session: SplitSession): SplitSession {
  const receipt = recalculateReceipt(session.receipt, session);
  const tipTotal = computeTipTotal({ ...session, receipt });
  const total = roundMoney(receipt.subtotal + receipt.tax + tipTotal + receipt.fees);

  return {
    ...session,
    receipt: { ...receipt, total },
  };
}

export function createLineItem(partial?: Partial<LineItem>): LineItem {
  const quantity = partial?.quantity ?? 1;
  const unitPrice = partial?.unitPrice ?? 0;

  return {
    id: partial?.id ?? createId(),
    name: partial?.name ?? '',
    quantity,
    unitPrice,
    lineTotal: roundMoney(quantity * unitPrice),
    claimedBy: partial?.claimedBy ?? {},
    sharedAmong: partial?.sharedAmong ?? {},
  };
}

function normalizeItemName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[.,;:!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mergeDuplicateLineItems(items: LineItem[]): LineItem[] {
  const merged: LineItem[] = [];
  const indexByKey = new Map<string, number>();

  for (const item of items) {
    const nameKey = normalizeItemName(item.name);
    if (!nameKey) {
      merged.push({
        ...item,
        claimedBy: { ...item.claimedBy },
        sharedAmong: { ...item.sharedAmong },
      });
      continue;
    }

    const key = `${nameKey}|${item.unitPrice.toFixed(2)}`;
    const existingIndex = indexByKey.get(key);

    if (existingIndex === undefined) {
      indexByKey.set(key, merged.length);
      merged.push({
        ...item,
        claimedBy: { ...item.claimedBy },
        sharedAmong: { ...item.sharedAmong },
      });
      continue;
    }

    const existing = merged[existingIndex];
    const quantity = existing.quantity + item.quantity;
    const claimedBy = { ...existing.claimedBy };

    for (const [personId, claimedQuantity] of Object.entries(item.claimedBy)) {
      claimedBy[personId] = (claimedBy[personId] ?? 0) + claimedQuantity;
    }

    merged[existingIndex] = {
      ...existing,
      quantity,
      lineTotal: roundMoney(quantity * existing.unitPrice),
      claimedBy,
      sharedAmong: { ...existing.sharedAmong, ...item.sharedAmong },
    };
  }

  return merged;
}

export function createParticipant(name: string): Participant {
  return { id: createId(), name };
}

function tipPercentFromParsed(parsed: ParsedReceipt, lineItems: LineItem[]): number {
  const tip = parsed.tip;
  if (typeof tip !== 'number' || tip <= 0) {
    return 0;
  }

  const subtotal = roundMoney(lineItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const base = subtotal + (parsed.tax ?? 0);
  if (base <= 0) {
    return 0;
  }

  return roundMoney((tip / base) * 100);
}

export function createSessionFromParsedReceipt(parsed: ParsedReceipt, imageUri: string): SplitSession {
  const mappedItems =
    parsed.lineItems.length > 0
      ? parsed.lineItems.map((item) =>
          createLineItem({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }),
        )
      : [createLineItem({ name: 'Item 1' })];
  const lineItems = mergeDuplicateLineItems(mappedItems);

  const receipt: Receipt = {
    id: createId(),
    imageUri,
    merchantName: parsed.merchantName,
    currency: 'USD',
    lineItems,
    subtotal: 0,
    tax: parsed.tax ?? 0,
    tip: 0,
    fees: parsed.fees ?? 0,
    total: 0,
  };

  return recalculateSessionTotal({
    id: createId(),
    receipt,
    participants: [createParticipant('')],
    tipMode: 'percent',
    tipValue: tipPercentFromParsed(parsed, lineItems),
    taxAllocation: 'proportional',
    tipAllocation: 'proportional',
    createdAt: new Date().toISOString(),
  });
}

export function createEmptySession(): SplitSession {
  const receiptId = createId();

  return recalculateSessionTotal({
    id: createId(),
    receipt: {
      id: receiptId,
      currency: 'USD',
      lineItems: [createLineItem({ name: 'Item 1' })],
      subtotal: 0,
      tax: 0,
      tip: 0,
      fees: 0,
      total: 0,
    },
    participants: [createParticipant('')],
    tipMode: 'percent',
    tipValue: 0,
    taxAllocation: 'proportional',
    tipAllocation: 'proportional',
    createdAt: new Date().toISOString(),
  });
}
