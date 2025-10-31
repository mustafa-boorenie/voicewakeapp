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
    const params: AlarmRouteParams = {
      alarmId: event.alarmId,
      requireAffirmations: event.requireAffirmations,
      requireGoals: event.requireGoals,
      randomChallenge: event.randomChallenge,
      label: event.label,
    };

    if (navigationRef.isReady()) {
      navigate('AlarmTrigger', params);
    } else {
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
    const subscription = alarmScheduler.addAlarmFiredListener(handleAlarmEvent);

    alarmScheduler.consumePendingAlarm().then((event) => {
      if (event) {
        handleAlarmEvent(event);
      }
    });

    return () => {
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
