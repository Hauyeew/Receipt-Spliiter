import { createId } from '@/lib/create-id';
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
    claimedBy: partial?.claimedBy ?? [],
  };
}

export function createParticipant(name: string): Participant {
  return { id: createId(), name };
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
    participants: [createParticipant('Me')],
    tipMode: 'percent',
    tipValue: 18,
    taxAllocation: 'proportional',
    tipAllocation: 'proportional',
    createdAt: new Date().toISOString(),
  });
}

export function createDemoSession(): SplitSession {
  const me = createParticipant('Me');
  const alex = createParticipant('Alex');
  const sam = createParticipant('Sam');

  const lineItems: LineItem[] = [
    createLineItem({ name: 'Burger', quantity: 1, unitPrice: 15, lineTotal: 15 }),
    createLineItem({ name: 'Pasta', quantity: 1, unitPrice: 20, lineTotal: 20 }),
    createLineItem({ name: 'Nachos (shared)', quantity: 1, unitPrice: 12, lineTotal: 12 }),
    createLineItem({ name: 'Soda', quantity: 3, unitPrice: 3, lineTotal: 9 }),
  ];

  const receipt: Receipt = {
    id: createId(),
    merchantName: "Joe's Diner",
    currency: 'USD',
    lineItems,
    subtotal: 56,
    tax: 4.48,
    tip: 0,
    fees: 0,
    total: 60.48,
  };

  return recalculateSessionTotal({
    id: createId(),
    receipt,
    participants: [me, alex, sam],
    tipMode: 'percent',
    tipValue: 18,
    taxAllocation: 'proportional',
    tipAllocation: 'proportional',
    createdAt: new Date().toISOString(),
  });
}
