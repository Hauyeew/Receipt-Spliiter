import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  ReceiptDivider,
  ReceiptPaper,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { ScreenContainer } from '@/components/ui/screen-container';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScreenContainer variant="receipt" showBack={false}>
      <ReceiptPaper>
        <ReceiptText center bold size="xl">
          RECEIPT SPLITTER
        </ReceiptText>
        <ReceiptText center muted size="sm">
          OPEN FOR BUSINESS
        </ReceiptText>
        <ReceiptDivider />
        <ReceiptText center>
          Upload a receipt, pick what everyone ordered, and split tax and tip fairly.
        </ReceiptText>
        <ReceiptDivider />
        <ReceiptText bold size="sm">
          HOW IT WORKS
        </ReceiptText>
        <ReceiptText size="sm">1. Scan or enter receipt items</ReceiptText>
        <ReceiptText size="sm">2. Add participants</ReceiptText>
        <ReceiptText size="sm">3. Each person selects items</ReceiptText>
        <ReceiptText size="sm">4. See totals with tax + tip</ReceiptText>
        <ReceiptDivider />
        <PrimaryButton label="New split" onPress={() => router.push('/split/new')} />
      </ReceiptPaper>
    </ScreenContainer>
  );
}
