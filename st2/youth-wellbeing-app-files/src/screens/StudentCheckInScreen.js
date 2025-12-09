import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Button, Card, Divider } from 'react-native-paper';
import MoodSlider from '../components/MoodSlider';
import QuestionItem from '../components/QuestionItem';
import { submitWeeklyCheckIn } from '../data/mockApi';

export default function StudentCheckInScreen({ navigation }) {
  const [mood, setMood] = useState(3);
  const [sleep, setSleep] = useState(0);
  const [concentration, setConcentration] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [worries, setWorries] = useState(0);
  const [hopelessness, setHopelessness] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    setSubmitting(true);
    const answers = { mood, sleep, concentration, energy, worries, hopelessness };
    submitWeeklyCheckIn(answers);
    setTimeout(() => {
      setSubmitting(false);
      navigation.replace('StudentThanks');
    }, 400);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.subtitle}>About your week</Text>
          <MoodSlider value={mood} onChange={setMood} />
          <Divider style={styles.divider} />

          <QuestionItem
            question="I had trouble falling or staying asleep."
            value={sleep}
            onChange={setSleep}
          />
          <QuestionItem
            question="It was hard to focus on schoolwork."
            value={concentration}
            onChange={setConcentration}
          />
          <QuestionItem
            question="I felt low on energy or tired most of the day."
            value={energy}
            onChange={setEnergy}
          />
          <QuestionItem
            question="I felt worried or on edge."
            value={worries}
            onChange={setWorries}
          />
          <QuestionItem
            question="I felt like things won't get better / I mattered less to people around me."
            value={hopelessness}
            onChange={setHopelessness}
          />

          <View style={styles.miniTaskBox}>
            <Text style={styles.miniTaskTitle}>Optional mini-game (coming soon)</Text>
            <Text style={styles.miniTaskText}>
              In future versions, this will be a 30–60 second attention or reaction game.
            </Text>
          </View>

          <Button
            mode="contained"
            style={styles.button}
            onPress={handleSubmit}
            loading={submitting}
          >
            Submit check-in
          </Button>
          <Text style={styles.footerText}>
            Your answers are private to the school wellness team and used to notice patterns
            over time. They are not shared with advertisers.
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  card: { backgroundColor: '#020617', borderRadius: 20 },
  subtitle: {
    color: '#F9FAFB',
    fontSize: 18,
    marginBottom: 8,
    fontWeight: '600',
  },
  divider: { marginVertical: 16, backgroundColor: '#1E293B' },
  miniTaskBox: {
    marginVertical: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  miniTaskTitle: { color: '#E5E7EB', fontWeight: '600', marginBottom: 4 },
  miniTaskText: { color: '#9CA3AF', fontSize: 12 },
  button: { marginTop: 8, marginBottom: 8 },
  footerText: { color: '#6B7280', fontSize: 11, textAlign: 'center' },
});
