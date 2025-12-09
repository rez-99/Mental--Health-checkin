import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, RadioButton } from 'react-native-paper';

const options = [
  { label: 'Never', value: 0 },
  { label: 'Rarely', value: 1 },
  { label: 'Sometimes', value: 2 },
  { label: 'Often', value: 3 },
  { label: 'Always', value: 4 },
];

export default function QuestionItem({ question, value, onChange }) {
  return (
    <View style={styles.container}>
      <Text style={styles.question}>{question}</Text>
      <RadioButton.Group
        onValueChange={v => onChange(Number(v))}
        value={String(value)}
      >
        <View style={styles.row}>
          {options.map(o => (
            <View key={o.label} style={styles.option}>
              <RadioButton value={String(o.value)} />
              <Text style={styles.optionLabel}>{o.label}</Text>
            </View>
          ))}
        </View>
      </RadioButton.Group>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  question: { color: '#E5E7EB', marginBottom: 8, fontSize: 16 },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  optionLabel: { color: '#CBD5F5' },
});
