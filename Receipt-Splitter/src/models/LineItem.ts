export const MIN_SHARED_AMONG = 2;
export const MAX_SHARED_AMONG = 20;

export type LineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** personId -> how many units that person claimed */
  claimedBy: Record<string, number>;
  /** personId -> how many people that person's claimed units were shared among */
  sharedAmong: Record<string, number>;
};

export function getClaimedQuantity(item: LineItem, personId: string): number {
  return item.claimedBy[personId] ?? 0;
}

export function getTotalClaimedQuantity(item: LineItem): number {
  return Object.values(item.claimedBy).reduce((sum, quantity) => sum + quantity, 0);
}

export function getClaimerIds(item: LineItem): string[] {
  return Object.entries(item.claimedBy)
    .filter(([, quantity]) => quantity > 0)
    .map(([personId]) => personId);
}

/** Max units this person can set for themselves. Qty-1 items allow everyone to claim 1 (shared). */
export function getMaxClaimQuantity(item: LineItem, personId: string): number {
  if (item.quantity <= 1) {
    return 1;
  }

  const claimedByOthers = Object.entries(item.claimedBy)
    .filter(([id]) => id !== personId)
    .reduce((sum, [, quantity]) => sum + quantity, 0);

  return Math.max(0, item.quantity - claimedByOthers);
}

export function getSharedAmong(item: LineItem, personId: string): number {
  const sharedAmong = item.sharedAmong?.[personId] ?? 1;
  return sharedAmong >= MIN_SHARED_AMONG ? sharedAmong : 1;
}

export function itemShareForPerson(item: LineItem, personId: string): number {
  const myQuantity = getClaimedQuantity(item, personId);
  if (myQuantity <= 0 || item.quantity <= 0) {
    return 0;
  }

  const sharedAmong = getSharedAmong(item, personId);
  if (sharedAmong > 1) {
    const unitPrice = item.unitPrice || item.lineTotal / item.quantity;
    return (myQuantity * unitPrice) / sharedAmong;
  }

  const totalClaimed = getTotalClaimedQuantity(item);
  const divisor = Math.max(item.quantity, totalClaimed);

  return (myQuantity / divisor) * item.lineTotal;
}
