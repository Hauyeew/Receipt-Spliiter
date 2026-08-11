import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  ReceiptDivider,
  ReceiptPaper,
  ReceiptPalette,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ThemedView style={[styles.container, { backgroundColor: ReceiptPalette.counter }]}>
      <ThemedView
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing.four,
            paddingBottom: insets.bottom + Spacing.four,
          },
        ]}>
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
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
});
