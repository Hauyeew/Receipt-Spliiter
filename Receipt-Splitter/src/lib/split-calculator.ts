import {
  getClaimerIds,
  getTotalClaimedQuantity,
  itemShareForPerson,
} from '@/models/LineItem';
import type { Receipt } from '@/models/Receipt';
import type { SplitSession } from '@/models/SplitSession';

export type PersonBreakdown = {
  personId: string;
  food: number;
  tax: number;
  tip: number;
  fees: number;
  total: number;
};

export type SplitValidation = {
  isValid: boolean;
  unclaimedItems: { id: string; name: string; lineTotal: number }[];
  unclaimedTotal: number;
  computedTotal: number;
  receiptTotal: number;
  difference: number;
};

const CENTS = 100;

function roundMoney(amount: number): number {
  return Math.round(amount * CENTS) / CENTS;
}

function allocateEvenly(amount: number, participantIds: string[]): Map<string, number> {
  const result = new Map<string, number>();
  if (participantIds.length === 0 || amount === 0) {
    return result;
  }

  const perPerson = roundMoney(amount / participantIds.length);
  let assigned = 0;

  participantIds.forEach((id, index) => {
    if (index === participantIds.length - 1) {
      result.set(id, roundMoney(amount - assigned));
    } else {
      result.set(id, perPerson);
      assigned += perPerson;
    }
  });

  return result;
}

function allocateProportionally(
  amount: number,
  weights: Map<string, number>,
): Map<string, number> {
  const result = new Map<string, number>();
  const entries = [...weights.entries()].filter(([, weight]) => weight > 0);
  const totalWeight = entries.reduce((sum, [, weight]) => sum + weight, 0);

  if (totalWeight === 0 || amount === 0) {
    return result;
  }

  let assigned = 0;

  entries.forEach(([personId, weight], index) => {
    if (index === entries.length - 1) {
      result.set(personId, roundMoney(amount - assigned));
    } else {
      const share = roundMoney((weight / totalWeight) * amount);
      result.set(personId, share);
      assigned += share;
    }
  });

  return result;
}

export function getReceiptSubtotal(receipt: Receipt): number {
  if (receipt.subtotal > 0) {
    return receipt.subtotal;
  }
  return receipt.lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
}

export function computePersonFood(session: SplitSession, personId: string): number {
  return roundMoney(
    session.receipt.lineItems.reduce(
      (sum, item) => sum + itemShareForPerson(item, personId),
      0,
    ),
  );
}

export function getActiveParticipantIds(session: SplitSession): string[] {
  const claimedIds = new Set<string>();

  for (const item of session.receipt.lineItems) {
    for (const personId of getClaimerIds(item)) {
      claimedIds.add(personId);
    }
  }

  return session.participants
    .map((participant) => participant.id)
    .filter((id) => claimedIds.has(id));
}

export function computeTipTotal(session: SplitSession): number {
  const { receipt, tipMode, tipValue } = session;

  switch (tipMode) {
    case 'from_receipt':
      return receipt.tip;
    case 'percent':
      return roundMoney((getReceiptSubtotal(receipt) + receipt.tax) * (tipValue / 100));
    case 'fixed':
      return tipValue;
    default:
      return 0;
  }
}

function buildFoodByPerson(session: SplitSession): Map<string, number> {
  const foodByPerson = new Map<string, number>();

  for (const participant of session.participants) {
    foodByPerson.set(participant.id, computePersonFood(session, participant.id));
  }

  return foodByPerson;
}

function allocateTax(session: SplitSession, foodByPerson: Map<string, number>): Map<string, number> {
  const { receipt } = session;
  const subtotal = getReceiptSubtotal(receipt);
  const result = new Map<string, number>();

  if (receipt.tax === 0 || subtotal === 0) {
    return result;
  }

  const taxRate = receipt.tax / subtotal;

  for (const [personId, food] of foodByPerson.entries()) {
    if (food <= 0) {
      continue;
    }
    result.set(personId, roundMoney(food * taxRate));
  }

  return result;
}

function allocateTip(session: SplitSession, foodByPerson: Map<string, number>): Map<string, number> {
  const { tipAllocation } = session;
  const tipTotal = computeTipTotal(session);
  const activeParticipantIds = getActiveParticipantIds(session);

  if (tipTotal === 0 || activeParticipantIds.length === 0) {
    return new Map();
  }

  if (tipAllocation === 'even') {
    return allocateEvenly(tipTotal, activeParticipantIds);
  }

  return allocateProportionally(tipTotal, foodByPerson);
}

function allocateFees(session: SplitSession, foodByPerson: Map<string, number>): Map<string, number> {
  const activeParticipantIds = getActiveParticipantIds(session);

  if (session.receipt.fees === 0 || activeParticipantIds.length === 0) {
    return new Map();
  }

  return allocateProportionally(session.receipt.fees, foodByPerson);
}

export function computePersonBreakdown(
  session: SplitSession,
  personId: string,
): PersonBreakdown {
  const foodByPerson = buildFoodByPerson(session);
  const taxByPerson = allocateTax(session, foodByPerson);
  const tipByPerson = allocateTip(session, foodByPerson);
  const feesByPerson = allocateFees(session, foodByPerson);

  const food = foodByPerson.get(personId) ?? 0;
  const tax = taxByPerson.get(personId) ?? 0;
  const tip = tipByPerson.get(personId) ?? 0;
  const fees = feesByPerson.get(personId) ?? 0;

  return {
    personId,
    food,
    tax,
    tip,
    fees,
    total: roundMoney(food + tax + tip + fees),
  };
}

export function computeAllTotals(session: SplitSession): PersonBreakdown[] {
  return session.participants.map((participant) =>
    computePersonBreakdown(session, participant.id),
  );
}

export function validateSplit(session: SplitSession): SplitValidation {
  const unclaimedItems = session.receipt.lineItems
    .map((item) => {
      if (item.quantity <= 1) {
        if (getClaimerIds(item).length > 0) {
          return null;
        }

        return {
          id: item.id,
          name: item.name,
          lineTotal: item.lineTotal,
        };
      }

      const claimedQuantity = getTotalClaimedQuantity(item);
      const remainingQuantity = Math.max(0, item.quantity - claimedQuantity);
      if (remainingQuantity <= 0) {
        return null;
      }

      return {
        id: item.id,
        name: item.name,
        lineTotal: roundMoney((remainingQuantity / item.quantity) * item.lineTotal),
      };
    })
    .filter((item): item is { id: string; name: string; lineTotal: number } => item !== null);

  const unclaimedTotal = roundMoney(
    unclaimedItems.reduce((sum, item) => sum + item.lineTotal, 0),
  );

  const computedTotal = roundMoney(
    computeAllTotals(session).reduce((sum, breakdown) => sum + breakdown.total, 0),
  );

  const receiptTotal = session.receipt.total;
  const difference = roundMoney(computedTotal - receiptTotal);

  return {
    isValid: unclaimedItems.length === 0 && Math.abs(difference) <= 0.01,
    unclaimedItems,
    unclaimedTotal,
    computedTotal,
    receiptTotal,
    difference,
  };
}
