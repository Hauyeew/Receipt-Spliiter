import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import {
  ReceiptDivider,
  ReceiptInput,
  ReceiptPaper,
  ReceiptText,
} from '@/components/ui/receipt-paper';
import { ScreenContainer } from '@/components/ui/screen-container';
import { Spacing } from '@/constants/theme';
import { useRequiredSession, useSplitContext } from '@/context/split-context';

export default function PeopleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useRequiredSession();
  const { addParticipant, removeParticipant, updateParticipantName } = useSplitContext();
  const [newName, setNewName] = useState('');

  if (!session) {
    return <Redirect href="/" />;
  }

  const activeSession = session;

  function handleAddParticipant() {
    addParticipant(newName);
    setNewName('');
  }

  function continueToSelection() {
    const firstParticipant = activeSession.participants[0];
    router.push(`/split/${id}/select/${firstParticipant.id}`);
  }

  return (
    <ScreenContainer
      variant="receipt"
      title="Who's splitting?"
      subtitle="Add everyone who needs to pick their items."
      footer={<PrimaryButton label="Continue" onPress={continueToSelection} />}>
      <ReceiptPaper>
        <ReceiptText center bold size="lg">
          GUEST LIST
        </ReceiptText>
        <ReceiptText center muted size="sm">
          {activeSession.participants.length} PERSON
          {activeSession.participants.length === 1 ? '' : 'S'}
        </ReceiptText>
        <ReceiptDivider />

        {activeSession.participants.map((participant, index) => (
          <View key={participant.id} style={styles.personBlock}>
            <View style={styles.personHeader}>
              <ReceiptText muted size="sm">
                #{index + 1}
              </ReceiptText>
              {activeSession.participants.length > 1 ? (
                <Pressable onPress={() => removeParticipant(participant.id)}>
                  <ReceiptText muted size="sm">
                    remove
                  </ReceiptText>
                </Pressable>
              ) : null}
            </View>
            <ReceiptInput
              label="Name"
              value={participant.name}
              onChangeText={(value) => updateParticipantName(participant.id, value)}
            />
            {index < activeSession.participants.length - 1 ? <ReceiptDivider /> : null}
          </View>
        ))}

        <ReceiptDivider />
        <ReceiptText bold size="sm">
          ADD PERSON
        </ReceiptText>
        <ReceiptInput
          label="Name"
          value={newName}
          onChangeText={setNewName}
          placeholder="Friend's name"
        />
        <PrimaryButton label="Add person" variant="secondary" onPress={handleAddParticipant} />
      </ReceiptPaper>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  personBlock: {
    gap: Spacing.two,
  },
  personHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
