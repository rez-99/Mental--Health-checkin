import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function RiskBadge({ level }) {
  let backgroundColor = '#16A34A';
  let text = 'Low';

  if (level === 'yellow') {
    backgroundColor = '#FACC15';
    text = 'Medium';
  } else if (level === 'red') {
    backgroundColor = '#EF4444';
    text = 'High';
  }

  return (
    <View style={[styles.badge, { backgroundColor }]}>
      <Text style={styles.text}>{text} risk</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  text: {
    color: '#0F172A',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
