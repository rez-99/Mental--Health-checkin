import React from 'react';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { getCurrentStudent } from '../data/mockApi';

export default function StudentHomeScreen({ navigation }) {
  const student = getCurrentStudent();

  return (
    <ImageBackground
      source={{ uri: 'https://images.pexels.com/photos/414612/pexels-photo-414612.jpeg' }}
      style={styles.bg}
      imageStyle={{ opacity: 0.3 }}
    >
      <View style={styles.container}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.hello}>Hi {student.name},</Text>
            <Text style={styles.title}>Weekly Well-being Check-in</Text>
            <Text style={styles.body}>
              This is a short check-in (about 2–5 minutes) to help your school notice
              when students might need more support.
            </Text>
            <Text style={styles.note}>
              There are no right or wrong answers. This is not a test, and it does not
              give a diagnosis.
            </Text>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => navigation.navigate('StudentCheckIn')}
            >
              Start this week&apos;s check-in
            </Button>
          </Card.Content>
        </Card>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#020617CC',
    borderRadius: 20,
  },
  hello: { color: '#E5E7EB', fontSize: 18, marginBottom: 4 },
  title: { color: '#F9FAFB', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  body: { color: '#CBD5F5', marginBottom: 8 },
  note: { color: '#94A3B8', fontSize: 12, marginBottom: 16 },
  button: { marginTop: 8 },
});
