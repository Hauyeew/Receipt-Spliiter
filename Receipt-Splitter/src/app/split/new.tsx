import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  ReceiptDivider,
  ReceiptPaper,
  ReceiptPalette,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useSplitContext } from '@/context/split-context';
import { pickReceiptImage } from '@/lib/pick-receipt-image';
import { scanReceiptImage } from '@/lib/receipt-scanner';
import { createEmptySession, createSessionFromParsedReceipt } from '@/lib/session-helpers';

export default function NewSplitScreen() {
  const router = useRouter();
  const { setSession } = useSplitContext();
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  function startBlankSession() {
    const session = createEmptySession();
    setSession(session);
    router.push(`/split/${session.id}/review`);
  }

  async function handleScanReceipt() {
    setScanError(null);

    try {
      const image = await pickReceiptImage();
      if (!image) {
        return;
      }

      setIsScanning(true);
      const parsed = await scanReceiptImage(image.base64, image.mimeType);
      const session = createSessionFromParsedReceipt(parsed, image.uri);
      setSession(session);
      router.push(`/split/${session.id}/review`);
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Failed to scan receipt.');
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <ScreenContainer
      variant="receipt"
      title="Start a split"
      subtitle="Scan a receipt photo, or start from scratch.">
      <ReceiptPaper>
        <ReceiptText center bold size="lg">
          NEW ORDER
        </ReceiptText>
        <ReceiptText center muted size="sm">
          CHOOSE A STARTING POINT
        </ReceiptText>
        <ReceiptDivider />

        <ReceiptText bold size="sm">
          SCAN RECEIPT
        </ReceiptText>
        <ReceiptText muted size="sm">
          Upload or photograph a receipt and we&apos;ll read the items for you.
        </ReceiptText>
        {isScanning ? (
          <View style={styles.scanningRow}>
            <ActivityIndicator color={ReceiptPalette.ink} />
            <ReceiptText muted size="sm">
              Reading receipt...
            </ReceiptText>
          </View>
        ) : (
          <PrimaryButton label="Upload receipt photo" onPress={handleScanReceipt} />
        )}
        {scanError ? <ReceiptText style={styles.errorText}>{scanError}</ReceiptText> : null}

        <ReceiptDivider />

        <ReceiptText bold size="sm">
          BLANK RECEIPT
        </ReceiptText>
        <ReceiptText muted size="sm">
          Add your own line items, tax, and tip manually.
        </ReceiptText>
        <PrimaryButton
          label="Start blank"
          variant="secondary"
          disabled={isScanning}
          onPress={startBlankSession}
        />
      </ReceiptPaper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scanningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
  },
  errorText: {
    color: '#b42318',
  },
});
