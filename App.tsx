import React, { useEffect, useState, useCallback } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/schema';
import { alarmScheduler, type AlarmFiredListener, type AlarmRouteParams } from './src/modules/alarm/AlarmScheduler';
import { navigationRef, navigate } from './src/navigation/navigationRef';

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [pendingAlarm, setPendingAlarm] = useState<AlarmRouteParams | null>(null);

  const handleAlarmEvent = useCallback<AlarmFiredListener>((event) => {
    console.log('🔥🔥🔥 ALARM FIRED! 🔥🔥🔥');
    console.log('Event details:', JSON.stringify(event, null, 2));
    
    const params: AlarmRouteParams = {
      alarmId: event.alarmId,
      requireAffirmations: event.requireAffirmations,
      requireGoals: event.requireGoals,
      randomChallenge: event.randomChallenge,
      label: event.label,
      antiCheatToken: event.antiCheatToken,
    };

    if (navigationRef.isReady()) {
      console.log('📱 Navigation ready - navigating to AlarmTrigger');
      navigate('AlarmTrigger', params);
    } else {
      console.log('⏳ Navigation not ready - saving as pending alarm');
      setPendingAlarm(params);
    }
  }, []);

  useEffect(() => {
    initializeApp();
    if (navigationRef.isReady()) {
      setPendingAlarm(null);
    }
  }, []);

  useEffect(() => {
    console.log('🔔 Setting up alarm event listener');
    const subscription = alarmScheduler.addAlarmFiredListener(handleAlarmEvent);
    console.log('✅ Alarm listener registered');

    alarmScheduler.consumePendingAlarm().then((event) => {
      if (event) {
        console.log('📬 Found pending alarm from previous session');
        handleAlarmEvent(event);
      } else {
        console.log('📭 No pending alarms');
      }
    });

    return () => {
      console.log('🔕 Removing alarm event listener');
      subscription.remove();
    };
  }, [handleAlarmEvent]);

  useEffect(() => {
    if (pendingAlarm && navigationRef.isReady()) {
      navigate('AlarmTrigger', pendingAlarm);
      setPendingAlarm(null);
    }
  }, [pendingAlarm]);

  async function initializeApp() {
    try {
      await initDatabase();
      console.log('Database initialized successfully');
      setIsReady(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      setIsReady(true);
    }
  }

  if (!isReady) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar barStyle="dark-content" />
      <AppNavigator onReady={() => {
        if (pendingAlarm) {
          navigate('AlarmTrigger', pendingAlarm);
          setPendingAlarm(null);
        }
      }} />
    </GestureHandlerRootView>
  );
}
