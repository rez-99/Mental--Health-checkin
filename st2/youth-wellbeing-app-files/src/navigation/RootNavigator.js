import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import StudentHomeScreen from '../screens/StudentHomeScreen';
import StudentCheckInScreen from '../screens/StudentCheckInScreen';
import StudentThanksScreen from '../screens/StudentThanksScreen';
import CounsellorDashboardScreen from '../screens/CounsellorDashboardScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';

const Tab = createBottomTabNavigator();
const StudentStackNav = createNativeStackNavigator();
const CounsellorStackNav = createNativeStackNavigator();

function StudentStack() {
  return (
    <StudentStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F9FAFB',
      }}
    >
      <StudentStackNav.Screen
        name="StudentHome"
        component={StudentHomeScreen}
        options={{ title: 'Well-being Check-in' }}
      />
      <StudentStackNav.Screen
        name="StudentCheckIn"
        component={StudentCheckInScreen}
        options={{ title: 'Weekly Check-in' }}
      />
      <StudentStackNav.Screen
        name="StudentThanks"
        component={StudentThanksScreen}
        options={{ title: 'Thank you' }}
      />
    </StudentStackNav.Navigator>
  );
}

function CounsellorStack() {
  return (
    <CounsellorStackNav.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#F9FAFB',
      }}
    >
      <CounsellorStackNav.Screen
        name="CounsellorDashboard"
        component={CounsellorDashboardScreen}
        options={{ title: 'Counsellor Dashboard' }}
      />
      <CounsellorStackNav.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={({ route }) => ({
          title: route.params?.student?.name || 'Student Detail',
        })}
      />
    </CounsellorStackNav.Navigator>
  );
}

export default function RootNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#020617', borderTopColor: '#1E293B' },
        tabBarActiveTintColor: '#22C55E',
        tabBarInactiveTintColor: '#64748B',
      }}
    >
      <Tab.Screen
        name="Student"
        component={StudentStack}
        options={{
          tabBarLabel: 'Student',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-circle" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Counsellor"
        component={CounsellorStack}
        options={{
          tabBarLabel: 'Counsellor',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="shield-account" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
