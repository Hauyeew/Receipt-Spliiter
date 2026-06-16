import { useRouter } from 'expo-router';

import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useSplitContext } from '@/context/split-context';
import { createDemoSession, createEmptySession } from '@/lib/session-helpers';

export default function NewSplitScreen() {
  const router = useRouter();
  const { setSession } = useSplitContext();

  function startSession(createSession: () => ReturnType<typeof createEmptySession>) {
    const session = createSession();
    setSession(session);
    router.push(`/split/${session.id}/review`);
  }

  return (
    <ScreenContainer
      title="Start a split"
      subtitle="Use a demo receipt to try the flow, or start from scratch.">
      <ThemedView type="backgroundElement" style={{ gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three }}>
        <ThemedText type="smallBold">Demo receipt</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Pre-filled items at Joe&apos;s Diner with 3 people, tax, and 18% tip.
        </ThemedText>
        <PrimaryButton label="Try demo" onPress={() => startSession(createDemoSession)} />
      </ThemedView>

      <ThemedView type="backgroundElement" style={{ gap: Spacing.two, padding: Spacing.three, borderRadius: Spacing.three }}>
        <ThemedText type="smallBold">Blank receipt</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Add your own line items, tax, and tip manually.
        </ThemedText>
        <PrimaryButton
          label="Start blank"
          variant="secondary"
          onPress={() => startSession(createEmptySession)}
        />
      </ThemedView>
    </ScreenContainer>
  );
}
