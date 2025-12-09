import * as React from 'react';
import { MD3DarkTheme, Provider as PaperProvider } from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const theme = {
    ...MD3DarkTheme,
    roundness: 16,
    colors: {
      ...MD3DarkTheme.colors,
      primary: '#4F46E5',
      secondary: '#22C55E',
      background: '#0F172A',
      surface: '#1E293B',
      onSurface: '#F9FAFB',
    },
  };

  return (
    <PaperProvider theme={theme}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </PaperProvider>
  );
}
