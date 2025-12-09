import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';

export default function StudentThanksScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Thank you 💜</Text>
          <Text style={styles.body}>
            Your check-in is saved for this week.
            Your answers help your school notice when students might be having a harder time,
            so they can offer help sooner.
          </Text>
          <Text style={styles.bodySmall}>
            This app does not give diagnoses or labels. If you&apos;re ever in crisis, please
            reach out directly to a trusted adult, crisis line, or emergency services.
          </Text>
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.popToTop()}
          >
            Back to home
          </Button>
        </Card.Content>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  card: { backgroundColor: '#020617', borderRadius: 20 },
  title: { color: '#F9FAFB', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  body: { color: '#E5E7EB', marginBottom: 8 },
  bodySmall: { color: '#9CA3AF', fontSize: 12, marginBottom: 16 },
  button: { marginTop: 8 },
});
