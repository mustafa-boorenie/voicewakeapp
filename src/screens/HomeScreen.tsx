import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Streaks, Alarm } from '../types';
import { initDatabase } from '../db/schema';

export function HomeScreen({ navigation }: any) {
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  async function loadData() {
    try {
      const db = await initDatabase();
      
      const streakResult = await db.getFirstAsync('SELECT * FROM streaks LIMIT 1') as any;
      if (streakResult) {
        setStreaks({
          id: streakResult.id,
          userId: streakResult.user_id,
          current: streakResult.current,
          best: streakResult.best,
          updatedAt: streakResult.updated_at,
        });
      }
      
      const alarmResults = await db.getAllAsync('SELECT * FROM alarms WHERE enabled = 1 ORDER BY time_local') as any[];
      setAlarms(alarmResults.map((row: any) => ({
        id: row.id,
        label: row.label,
        timeLocal: row.time_local,
        daysOfWeek: JSON.parse(row.days_of_week),
        volume: row.volume,
        toneUri: row.tone_uri,
        vibrate: row.vibrate === 1,
        maxSnoozes: row.max_snoozes,
        snoozeLengthMin: row.snooze_length_min,
        requireAffirmations: row.require_affirmations === 1,
        requireGoals: row.require_goals === 1,
        randomChallenge: row.random_challenge === 1,
        enabled: row.enabled === 1,
        createdAt: row.created_at,
      })));
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Affirmation Alarm
          </Text>
          <Text style={styles.subtitle}>
            Wake up with purpose
          </Text>
        </View>

        <View style={styles.streakCard}>
          <Text style={styles.streakLabel}>Current Streak</Text>
          <Text style={styles.streakNumber} accessibilityLabel={`Current streak: ${streaks?.current || 0} days`}>
            {streaks?.current || 0} 🔥
          </Text>
          <Text style={styles.bestStreak}>Best: {streaks?.best || 0} days</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Active Alarms</Text>
          {alarms.length === 0 ? (
            <Text style={styles.emptyText}>No alarms set</Text>
          ) : (
            alarms.map(alarm => (
              <TouchableOpacity
                key={alarm.id}
                style={styles.alarmCard}
                onPress={() => navigation.navigate('EditAlarm', { alarmId: alarm.id })}
                accessibilityRole="button"
                accessibilityLabel={`Alarm at ${alarm.timeLocal}, ${alarm.label}`}
              >
                <Text style={styles.alarmTime}>{alarm.timeLocal}</Text>
                <Text style={styles.alarmLabel}>{alarm.label}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateAlarm')}
          accessibilityRole="button"
          accessibilityLabel="Add new alarm"
        >
          <Text style={styles.addButtonText}>+ Add Alarm</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('GoalsAffirmations')}
          accessibilityRole="button"
          accessibilityLabel="Edit goals and affirmations"
        >
          <Text style={styles.secondaryButtonText}>Edit Goals & Affirmations</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  streakCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  streakLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 8,
  },
  bestStreak: {
    fontSize: 14,
    color: '#999',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 32,
  },
  alarmCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  alarmTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  alarmLabel: {
    fontSize: 16,
    color: '#666',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
});
