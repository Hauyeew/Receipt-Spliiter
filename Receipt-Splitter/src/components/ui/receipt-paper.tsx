import { type ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps, type ViewProps } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';

export const ReceiptPalette = {
  paper: '#FFFEF7',
  ink: '#1C1917',
  muted: '#57534E',
  rule: '#A8A29E',
  counter: '#2A2724',
  counterText: '#F5F0E8',
  counterMuted: '#A8A29E',
} as const;

function SerratedEdge({ edge }: { edge: 'top' | 'bottom' }) {
  return (
    <View style={styles.serratedRow}>
      {Array.from({ length: 22 }).map((_, index) => (
        <View
          key={index}
          style={edge === 'top' ? styles.serrationTop : styles.serrationBottom}
        />
      ))}
    </View>
  );
}

type ReceiptPaperProps = ViewProps & {
  children: ReactNode;
};

export function ReceiptPaper({ children, style, ...props }: ReceiptPaperProps) {
  return (
    <View style={styles.paperShell} {...props}>
      <SerratedEdge edge="top" />
      <View style={[styles.paperBody, style]}>{children}</View>
      <SerratedEdge edge="bottom" />
    </View>
  );
}

export function ReceiptDivider() {
  return (
    <ReceiptText muted size="sm" center>
      - - - - - - - - - - - - - -
    </ReceiptText>
  );
}

type ReceiptTextProps = {
  children: ReactNode;
  muted?: boolean;
  bold?: boolean;
  center?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: object;
};

export function ReceiptText({
  children,
  muted = false,
  bold = false,
  center = false,
  size = 'md',
  style,
}: ReceiptTextProps) {
  return (
    <Text
      style={[
        styles.receiptText,
        size === 'sm' && styles.textSm,
        size === 'md' && styles.textMd,
        size === 'lg' && styles.textLg,
        size === 'xl' && styles.textXl,
        muted && styles.textMuted,
        bold && styles.textBold,
        center && styles.textCenter,
        style,
      ]}>
      {children}
    </Text>
  );
}

type ReceiptRowProps = {
  label: string;
  value: string;
  bold?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

export function ReceiptRow({ label, value, bold = false, size = 'md' }: ReceiptRowProps) {
  return (
    <View style={styles.row}>
      <ReceiptText bold={bold} size={size} style={styles.rowLabel}>
        {label}
      </ReceiptText>
      <ReceiptText bold={bold} size={size}>
        {value}
      </ReceiptText>
    </View>
  );
}

type ReceiptInputProps = TextInputProps & {
  label?: string;
  size?: 'md' | 'lg';
};

export function ReceiptInput({ label, size = 'md', style, ...props }: ReceiptInputProps) {
  return (
    <View style={styles.inputBlock}>
      {label ? (
        <ReceiptText muted size="sm">
          {label}
        </ReceiptText>
      ) : null}
      <TextInput
        placeholderTextColor={ReceiptPalette.muted}
        {...props}
        style={[styles.input, size === 'lg' && styles.inputLg, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  paperShell: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  serratedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: 8,
    backgroundColor: ReceiptPalette.counter,
    overflow: 'hidden',
  },
  serrationTop: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: ReceiptPalette.paper,
  },
  serrationBottom: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: ReceiptPalette.paper,
  },
  paperBody: {
    backgroundColor: ReceiptPalette.paper,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.two,
  },
  receiptText: {
    fontFamily: Fonts.mono,
    color: ReceiptPalette.ink,
  },
  textSm: {
    fontSize: 12,
    lineHeight: 16,
  },
  textMd: {
    fontSize: 14,
    lineHeight: 20,
  },
  textLg: {
    fontSize: 18,
    lineHeight: 24,
  },
  textXl: {
    fontSize: 22,
    lineHeight: 28,
  },
  textMuted: {
    color: ReceiptPalette.muted,
  },
  textBold: {
    fontWeight: '700',
  },
  textCenter: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  rowLabel: {
    flex: 1,
    paddingRight: Spacing.two,
  },
  inputBlock: {
    gap: Spacing.half,
  },
  input: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    lineHeight: 20,
    color: ReceiptPalette.ink,
    borderBottomWidth: 1,
    borderBottomColor: ReceiptPalette.rule,
    paddingVertical: Spacing.one,
    paddingHorizontal: 0,
  },
  inputLg: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
});
