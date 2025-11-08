import React, { useEffect, useState } from 'react';
import { Text, View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../screens/HomeScreen';
import { MIOnboardingScreen } from '../screens/MIOnboardingScreen';
import { AlarmTriggerScreen } from '../screens/AlarmTriggerScreen';
import { CreateAlarmScreen } from '../screens/CreateAlarmScreen';
import { EditAlarmScreen } from '../screens/EditAlarmScreen';
import { GoalsAffirmationsScreen } from '../screens/GoalsAffirmationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { navigationRef, RootStackParamList } from './navigationRef';
import { getOnboardingStatus } from '../utils/onboardingStorage';
import { initDatabase } from '../db/schema';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

type AppNavigatorProps = {
  onReady?: () => void;
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingTop: 8,
          paddingBottom: 8,
          height: 70,
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#999',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 28, opacity: focused ? 1 : 0.5 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Alarm" 
        component={CreateAlarmScreen}
        options={{
          tabBarLabel: 'Alarm',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 28, opacity: focused ? 1 : 0.5 }}>⏰</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Goals" 
        component={GoalsAffirmationsScreen}
        options={{
          tabBarLabel: 'Goals',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 28, opacity: focused ? 1 : 0.5 }}>🎯</Text>
          ),
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 28, opacity: focused ? 1 : 0.5 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator({ onReady }: AppNavigatorProps) {
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      // Check AsyncStorage first (fastest)
      const asyncStorageStatus = await getOnboardingStatus();
      
      if (asyncStorageStatus) {
        setHasCompletedOnboarding(true);
        setIsCheckingOnboarding(false);
        return;
      }

      // Check database as fallback
      const db = await initDatabase();
      const userResult = await db.getFirstAsync(
        'SELECT onboarding_completed FROM user_profiles WHERE id = ?',
        ['user_default']
      ) as any;

      if (userResult && userResult.onboarding_completed === 1) {
        setHasCompletedOnboarding(true);
      } else {
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to showing onboarding on error
      setHasCompletedOnboarding(false);
    } finally {
      setIsCheckingOnboarding(false);
    }
  };

  if (isCheckingOnboarding) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B4CE6" />
      </View>
    );
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={onReady}>
      <Stack.Navigator
        initialRouteName={hasCompletedOnboarding ? 'MainTabs' : 'MIOnboarding'}
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="MIOnboarding" component={MIOnboardingScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen 
          name="AlarmTrigger" 
          component={AlarmTriggerScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="EditAlarm" component={EditAlarmScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
