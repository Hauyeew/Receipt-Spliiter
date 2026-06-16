import type { Participant } from './Participant';
import type { Receipt } from './Receipt';

export type SplitSession = {
  id: string;
  receipt: Receipt;
  participants: Participant[];
  tipMode: 'from_receipt' | 'percent' | 'fixed';
  tipValue: number;
  taxAllocation: 'proportional' | 'even';
  tipAllocation: 'proportional' | 'even';
  createdAt: string;
};
