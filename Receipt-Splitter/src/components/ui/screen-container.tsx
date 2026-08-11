import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ReceiptPalette } from '@/components/ui/receipt-paper';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

type ScreenContainerProps = ViewProps & {
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  showBack?: boolean;
  variant?: 'default' | 'receipt';
};

export function ScreenContainer({
  title,
  subtitle,
  footer,
  showBack = true,
  variant = 'default',
  children,
  style,
  ...props
}: ScreenContainerProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isReceipt = variant === 'receipt';

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  }

  return (
    <ThemedView
      style={[styles.root, isReceipt && { backgroundColor: ReceiptPalette.counter }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + Spacing.three,
            paddingBottom: footer ? Spacing.three : insets.bottom + BottomTabInset + Spacing.three,
          },
        ]}>
        <View style={[styles.inner, style]} {...props}>
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={handleBack}
              hitSlop={8}
              style={styles.backButton}>
              <ThemedText
                type="linkPrimary"
                style={isReceipt ? { color: ReceiptPalette.counterText } : undefined}>
                ← Back
              </ThemedText>
            </Pressable>
          ) : null}
          <ThemedText
            type="subtitle"
            style={[styles.title, isReceipt && { color: ReceiptPalette.counterText }]}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText
              themeColor="textSecondary"
              style={[styles.subtitle, isReceipt && { color: ReceiptPalette.counterMuted }]}>
              {subtitle}
            </ThemedText>
          ) : null}
          {children}
        </View>
      </ScrollView>
      {footer ? (
        <View
          style={[
            styles.footer,
            { paddingBottom: insets.bottom + Spacing.three },
            isReceipt && styles.receiptFooter,
          ]}>
          <View style={styles.footerInner}>{footer}</View>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
  },
  inner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.three,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: -Spacing.one,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  subtitle: {
    marginTop: -Spacing.one,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#80808040',
    paddingTop: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  receiptFooter: {
    borderTopColor: '#FFFFFF22',
    backgroundColor: ReceiptPalette.counter,
  },
  footerInner: {
    width: '100%',
    maxWidth: MaxContentWidth,
    gap: Spacing.two,
  },
});
