import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { LabeledInput } from '@/components/ui/form-fields';
import { PrimaryButton } from '@/components/ui/primary-button';
import { ScreenContainer } from '@/components/ui/screen-container';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useRequiredSession, useSplitContext } from '@/context/split-context';

export default function PeopleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const session = useRequiredSession();
  const { addParticipant, removeParticipant, updateParticipantName } = useSplitContext();
  const [newName, setNewName] = useState('');

  function handleAddParticipant() {
    addParticipant(newName);
    setNewName('');
  }

  function continueToSelection() {
    const firstParticipant = session.participants[0];
    router.push(`/split/${id}/select/${firstParticipant.id}`);
  }

  return (
    <ScreenContainer
      title="Who's splitting?"
      subtitle="Add everyone who needs to pick their items."
      footer={<PrimaryButton label="Continue" onPress={continueToSelection} />}>
      {session.participants.map((participant) => (
        <ThemedView key={participant.id} type="backgroundElement" style={styles.participantCard}>
          <View style={styles.participantRow}>
            <View style={styles.nameField}>
              <LabeledInput
                label="Name"
                value={participant.name}
                onChangeText={(value) => updateParticipantName(participant.id, value)}
              />
            </View>
            {session.participants.length > 1 ? (
              <Pressable onPress={() => removeParticipant(participant.id)} style={styles.removeButton}>
                <ThemedText type="linkPrimary">Remove</ThemedText>
              </Pressable>
            ) : null}
          </View>
        </ThemedView>
      ))}

      <ThemedView type="backgroundElement" style={styles.addCard}>
        <LabeledInput
          label="Add person"
          value={newName}
          onChangeText={setNewName}
          placeholder="Name"
        />
        <PrimaryButton label="Add person" variant="secondary" onPress={handleAddParticipant} />
      </ThemedView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  participantCard: {
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
  },
  nameField: {
    flex: 1,
  },
  removeButton: {
    paddingBottom: Spacing.two,
  },
  addCard: {
    gap: Spacing.two,
    padding: Spacing.three,
    borderRadius: Spacing.three,
  },
});
