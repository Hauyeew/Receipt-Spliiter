import { Redirect } from 'expo-router';
import { useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { SplitCheckReceipt } from '@/components/split-check-receipt';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ReceiptPalette, ReceiptText } from '@/components/ui/receipt-paper';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useSplitContext } from '@/context/split-context';
import { useSplitTotals } from '@/hooks/use-split-totals';
import { shareSplitCheckPhoto } from '@/lib/share-split-check';
import { validateSplit } from '@/lib/split-calculator';

function splitCheckFilename(merchantName?: string): string {
  const slug = (merchantName ?? 'split-check')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

  return `${slug || 'split-check'}.png`;
}

export default function ExportScreen() {
  const { session } = useSplitContext();
  const totals = useSplitTotals(session);
  const validation = session ? validateSplit(session) : null;
  const receiptRef = useRef<View>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session || !validation) {
    return <Redirect href="/" />;
  }

  const activeSession = session;

  async function handleSendPhoto() {
    setError(null);
    setIsSharing(true);

    try {
      await shareSplitCheckPhoto(receiptRef, {
        filename: splitCheckFilename(activeSession.receipt.merchantName),
        dialogTitle: 'Send split check',
      });
    } catch (shareError) {
      const message =
        shareError instanceof Error ? shareError.message : 'Could not share the photo.';
      if (!/cancel|dismiss/i.test(message)) {
        setError(message);
      }
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <ScreenContainer
      variant="receipt"
      title="Send the split"
      subtitle="Share a photo of this check with everyone."
      footer={
        <>
          {error ? (
            <ReceiptText style={styles.errorText} size="sm">
              {error}
            </ReceiptText>
          ) : (
            <ReceiptText muted size="sm" center>
              {Platform.OS === 'web'
                ? 'Saves or shares a photo of the check.'
                : 'Opens your share sheet so you can send it in Messages, WhatsApp, or Mail.'}
            </ReceiptText>
          )}
          <PrimaryButton
            label={isSharing ? 'Preparing photo...' : 'Send photo'}
            disabled={isSharing}
            onPress={handleSendPhoto}
          />
        </>
      }>
      <View ref={receiptRef} collapsable={false} style={styles.capture}>
        <SplitCheckReceipt session={activeSession} totals={totals} validation={validation} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  capture: {
    backgroundColor: ReceiptPalette.counter,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: '#FECACA',
    textAlign: 'center',
  },
});
