import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PrimaryButtonProps = PressableProps & {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

export function PrimaryButton({ label, variant = 'primary', style, disabled, ...props }: PrimaryButtonProps) {
  const theme = useTheme();
  const backgroundColor =
    variant === 'primary' ? '#3c87f7' : variant === 'danger' ? '#e5484d' : theme.backgroundElement;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => {
        const flattenedStyle = typeof style === 'function' ? style(state) : style;
        return [
          styles.button,
          { backgroundColor, opacity: disabled ? 0.5 : state.pressed ? 0.85 : 1 },
          flattenedStyle,
        ];
      }}
      {...props}>
      <ThemedText
        type="smallBold"
        style={{ color: variant === 'secondary' ? theme.text : '#ffffff', textAlign: 'center' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: Spacing.three,
    alignItems: 'center',
  },
});
