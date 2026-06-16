import type { LineItem } from './LineItem';

export type Receipt = {
  id: string;
  imageUri?: string;
  merchantName?: string;
  currency: 'USD';
  lineItems: LineItem[];
  subtotal: number;
  tax: number;
  tip: number;
  fees: number;
  total: number;
};
