import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import Slider from '@react-native-community/slider';

export default function MoodSlider({ value, onChange }) {
  const labels = ['Very sad', 'Sad', 'Okay', 'Happy', 'Very happy'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>How did you feel most of this week?</Text>
      <Text style={styles.labels}>Very sad ⟶ Very happy</Text>
      <Slider
        value={value}
        minimumValue={1}
        maximumValue={5}
        step={1}
        onValueChange={onChange}
        style={styles.slider}
      />
      <Text style={styles.valueText}>{labels[value - 1]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 16 },
  title: { color: '#F9FAFB', marginBottom: 4, fontSize: 16, fontWeight: '600' },
  labels: { color: '#94A3B8', marginBottom: 8 },
  slider: { width: '100%' },
  valueText: { color: '#E5E7EB', textAlign: 'center', marginTop: 8 },
});
