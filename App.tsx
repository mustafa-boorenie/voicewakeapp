import React, { useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppNavigator } from './src/navigation/AppNavigator';
import { initDatabase } from './src/db/schema';

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

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
      <AppNavigator />
    </GestureHandlerRootView>
  );
}
