import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/HomeScreen';
import { MIOnboardingScreen } from '../screens/MIOnboardingScreen';
import { AlarmTriggerScreen } from '../screens/AlarmTriggerScreen';
import { CreateAlarmScreen } from '../screens/CreateAlarmScreen';
import { EditAlarmScreen } from '../screens/EditAlarmScreen';
import { GoalsAffirmationsScreen } from '../screens/GoalsAffirmationsScreen';
import { navigationRef, RootStackParamList } from './navigationRef';

const Stack = createStackNavigator<RootStackParamList>();

type AppNavigatorProps = {
  onReady?: () => void;
};

export function AppNavigator({ onReady }: AppNavigatorProps) {
  return (
    <NavigationContainer ref={navigationRef} onReady={onReady}>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="MIOnboarding" component={MIOnboardingScreen} />
        <Stack.Screen 
          name="AlarmTrigger" 
          component={AlarmTriggerScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="CreateAlarm" component={CreateAlarmScreen} />
        <Stack.Screen name="EditAlarm" component={EditAlarmScreen} />
        <Stack.Screen name="GoalsAffirmations" component={GoalsAffirmationsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
