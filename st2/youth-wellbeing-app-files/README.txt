Youth Well-being App (Student + Counsellor)

These are the source files for a simple Expo + React Native app implementing:
- Student weekly well-being check-in (2–5 minutes)
- Counsellor dashboard with risk colours and "big movers"
- Simple risk scoring engine and in-memory mock backend

How to use these files

1. Create a new Expo project (recommended)
   npx create-expo-app youth-wellbeing-app
   cd youth-wellbeing-app

2. Install dependencies
   npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
   npm install react-native-paper react-native-safe-area-context react-native-screens
   npm install @expo/vector-icons
   npm install @react-native-community/slider

3. Replace the generated App.js with the App.js from this folder.

4. Create the src folder and copy the src/ subfolders and files from this ZIP into your project.

5. Start the app
   npx expo start

6. Open it on Android/iOS using the Expo Go app.

Tabs:
- "Student" tab: student intro, weekly check-in form, thank-you screen.
- "Counsellor" tab: dashboard, big movers list, per-student detail with history and suggested actions.

All data is currently stored in memory (mockApi.js). For a real deployment, replace that with API calls to your backend.
