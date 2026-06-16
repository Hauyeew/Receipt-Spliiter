export type LineItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  claimedBy: string[];
};

export function itemShareForPerson(item: LineItem, personId: string): number {
  if (!item.claimedBy.includes(personId)) return 0;
  return item.lineTotal / item.claimedBy.length;
}
