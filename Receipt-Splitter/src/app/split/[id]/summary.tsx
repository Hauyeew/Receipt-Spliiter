import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';

import { SplitCheckReceipt } from '@/components/split-check-receipt';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { useSplitContext } from '@/context/split-context';
import { useSplitTotals } from '@/hooks/use-split-totals';
import { validateSplit } from '@/lib/split-calculator';

export default function SummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session, clearSession } = useSplitContext();
  const totals = useSplitTotals(session);
  const validation = session ? validateSplit(session) : null;

  if (!session || !validation) {
    return <Redirect href="/" />;
  }

  const activeSession = session;

  function handleDone() {
    clearSession();
    if (router.canDismiss()) {
      router.dismissAll();
    }
    router.replace('/');
  }

  function handleEditSelections() {
    const firstParticipant = activeSession.participants[0];
    router.push(`/split/${id}/select/${firstParticipant.id}`);
  }

  return (
    <ScreenContainer
      variant="receipt"
      title="Split summary"
      subtitle={activeSession.receipt.merchantName ?? 'Here is what everyone owes.'}
      footer={
        <>
          <PrimaryButton
            label="Send photo"
            onPress={() => router.push(`/split/${id}/export`)}
          />
          <PrimaryButton label="Edit selections" variant="secondary" onPress={handleEditSelections} />
          <PrimaryButton label="Done" variant="secondary" onPress={handleDone} />
        </>
      }>
      <SplitCheckReceipt session={activeSession} totals={totals} validation={validation} />
    </ScreenContainer>
  );
}
