import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Card, Divider, List, Chip } from 'react-native-paper';
import { getDashboardOverview } from '../data/mockApi';
import RiskBadge from '../components/RiskBadge';

export default function CounsellorDashboardScreen({ navigation }) {
  const [overview, setOverview] = useState(getDashboardOverview());

  useEffect(() => {
    const interval = setInterval(() => setOverview(getDashboardOverview()), 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Counsellor Dashboard</Text>
      <Text style={styles.subtitle}>
        Overview of weekly well-being patterns. Tap a student to see trends and decide actions.
      </Text>

      <Card style={styles.card}>
        <Card.Title title="Big movers" subtitle="Students whose risk has recently risen" />
        <Card.Content>
          {overview.bigMovers.length === 0 ? (
            <Text style={styles.empty}>No big movers yet.</Text>
          ) : (
            overview.bigMovers.map(item => (
              <List.Item
                key={item.id}
                title={item.name}
                description={
                  item.lastRecord
                    ? `Most recent level: ${item.lastRecord.level.toUpperCase()}`
                    : 'No check-ins yet'
                }
                left={() => <RiskBadge level={item.lastRecord?.level || 'green'} />}
                right={() => (
                  <Chip
                    style={styles.chip}
                    onPress={() =>
                      navigation.navigate('StudentDetail', { studentId: item.id })
                    }
                  >
                    View
                  </Chip>
                )}
              />
            ))
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="All students" />
        <Card.Content>
          {overview.students.map(item => (
            <View key={item.id}>
              <List.Item
                title={item.name}
                description={
                  item.lastRecord
                    ? `Last check-in: ${new Date(
                        item.lastRecord.timestamp
                      ).toLocaleDateString()}`
                    : 'No check-ins yet'
                }
                left={() => (
                  <View style={styles.left}>
                    <RiskBadge level={item.lastRecord?.level || 'green'} />
                  </View>
                )}
                right={() => (
                  <View style={styles.right}>
                    <Text style={styles.trendText}>
                      {item.trend === 'up'
                        ? '↑ worsening'
                        : item.trend === 'down'
                        ? '↓ improving'
                        : '→ stable'}
                    </Text>
                  </View>
                )}
                onPress={() =>
                  navigation.navigate('StudentDetail', {
                    studentId: item.id,
                  })
                }
              />
              <Divider style={styles.divider} />
            </View>
          ))}
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    color: '#F9FAFB',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: { color: '#9CA3AF', marginBottom: 12 },
  card: {
    backgroundColor: '#020617',
    borderRadius: 20,
    marginBottom: 16,
  },
  empty: { color: '#6B7280', fontStyle: 'italic' },
  left: { justifyContent: 'center', alignItems: 'center', width: 70 },
  right: { justifyContent: 'center', alignItems: 'flex-end', width: 80 },
  trendText: { color: '#E5E7EB', fontSize: 12 },
  divider: { backgroundColor: '#111827' },
  chip: { alignSelf: 'center' },
});
