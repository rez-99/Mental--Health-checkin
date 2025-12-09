import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Button, Divider, List, Chip } from 'react-native-paper';
import { getStudentById } from '../data/mockApi';
import RiskBadge from '../components/RiskBadge';

export default function StudentDetailScreen({ route }) {
  const { studentId } = route.params;
  const student = getStudentById(studentId);

  if (!student) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#F9FAFB' }}>Student not found.</Text>
      </View>
    );
  }

  const latest = student.history[student.history.length - 1];

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.name}>{student.name}</Text>
              <Text style={styles.meta}>
                {student.history.length} check-ins total
              </Text>
            </View>
            <RiskBadge level={latest?.level || 'green'} />
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Patterns over time" />
        <Card.Content>
          {student.history.length === 0 ? (
            <Text style={styles.meta}>No check-ins yet.</Text>
          ) : (
            <>
              {student.history
                .slice()
                .reverse()
                .map(rec => (
                  <View key={rec.timestamp}>
                    <List.Item
                      title={`Week ${rec.week}`}
                      description={`Score: ${rec.score.toFixed(
                        1
                      )} – Level: ${rec.level.toUpperCase()}`}
                      right={() => (
                        <Text style={styles.dateText}>
                          {new Date(rec.timestamp).toLocaleDateString()}
                        </Text>
                      )}
                    />
                    <Divider style={styles.divider} />
                  </View>
                ))}
              <Text style={styles.hint}>
                Flags could include: three weeks of very low mood, sudden drop in sleep
                and energy, or spikes in hopelessness. These rules can be tuned with
                school psychologists.
              </Text>
            </>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Actions (human-decided)" />
        <Card.Content>
          <Text style={styles.meta}>
            Choose what to do; the app never messages a student directly about "high risk".
          </Text>
          <View style={styles.actionsRow}>
            <Chip style={styles.actionChip} icon="calendar">
              Schedule check-in
            </Chip>
            <Chip style={styles.actionChip} icon="email">
              Send supportive class message
            </Chip>
          </View>
          <Button
            mode="outlined"
            style={styles.button}
            onPress={() => {}}
          >
            Mark as being followed by counsellor
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#020617', borderRadius: 20, marginBottom: 16 },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: { color: '#F9FAFB', fontSize: 20, fontWeight: 'bold' },
  meta: { color: '#9CA3AF', fontSize: 13 },
  divider: { backgroundColor: '#111827' },
  dateText: { color: '#9CA3AF', fontSize: 11, marginRight: 8 },
  hint: { color: '#6B7280', fontSize: 12, marginTop: 8 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  actionChip: { marginRight: 8, marginBottom: 8 },
  button: { marginTop: 8 },
});
