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
import { GradientCard } from '../components/GradientCard';
import { Ionicons } from '@expo/vector-icons';

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Meditation Card */}
        <GradientCard 
          colors={['#FEE685', '#FFEDD4', '#DBEAFE']}
          style={styles.mainCard}
        >
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          <Text style={styles.mainCardTitle}>Morning Rise</Text>
          <Text style={styles.mainCardSubtitle}>Meditation</Text>
          <Text style={styles.mainCardDuration}>15 min</Text>
          
          <TouchableOpacity 
            style={styles.playButton}
            accessibilityRole="button"
            accessibilityLabel="Play Morning Rise meditation"
          >
            <Ionicons name="play" size={24} color="#6B4CE6" />
          </TouchableOpacity>
        </GradientCard>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Day Streak Card */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Text style={styles.statEmoji}>🔥</Text>
            </View>
            <Text style={styles.statLabel}>Day Streak</Text>
            <Text style={styles.statValue}>{streaks?.current || 0}</Text>
            <Text style={styles.statSubtext}>days in a row</Text>
          </View>

          {/* Avg Wake Card */}
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons name="time-outline" size={20} color="#6B4CE6" />
            </View>
            <Text style={styles.statLabel}>Avg Wake</Text>
            <Text style={styles.statValue}>8m</Text>
            <Text style={styles.statSubtext}>alarm to wake</Text>
          </View>
        </View>

        {/* Morning Stories Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Morning Stories</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>See all →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.storiesScroll}
          contentContainerStyle={styles.storiesContent}
        >
          {/* Morning Rise Story */}
          <GradientCard 
            colors={['#FEE685', '#FFEDD4', '#DBEAFE']}
            style={styles.storyCard}
          >
            <View style={styles.storyDuration}>
              <Ionicons name="time-outline" size={12} color="#6B4CE6" />
              <Text style={styles.storyDurationText}>15 min</Text>
            </View>
            <Text style={styles.storyTitle}>Morning Rise</Text>
            <Text style={styles.storyDescription}>
              Start your day with some meditation to set your intentions.
            </Text>
            <TouchableOpacity 
              style={styles.storyPlayButton}
              accessibilityRole="button"
            >
              <Ionicons name="play" size={20} color="#6B4CE6" />
            </TouchableOpacity>
          </GradientCard>

          {/* Quiet Flight Story */}
          <GradientCard 
            colors={['#FCCEE8', '#FCE7F3', '#CEFAFE']}
            style={styles.storyCard}
          >
            <View style={styles.storyDuration}>
              <Ionicons name="time-outline" size={12} color="#6B4CE6" />
              <Text style={styles.storyDurationText}>10 min</Text>
            </View>
            <Text style={styles.storyTitle}>Quiet Flight</Text>
            <Text style={styles.storyDescription}>
              Take a journey through quiet sanctuary and be relaxation.
            </Text>
            <TouchableOpacity 
              style={styles.storyPlayButton}
              accessibilityRole="button"
            >
              <Ionicons name="play" size={20} color="#6B4CE6" />
            </TouchableOpacity>
          </GradientCard>
        </ScrollView>

        {/* This Week Stats */}
        <View style={styles.weekCard}>
          <Text style={styles.weekTitle}>This Week</Text>
          
          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Alarms completed</Text>
            <Text style={styles.weekValue}>5/7</Text>
          </View>
          
          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Stories listened</Text>
            <Text style={styles.weekValue}>8</Text>
          </View>
          
          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Total wake time</Text>
            <Text style={styles.weekValue}>56 minutes</Text>
          </View>
          
          <View style={styles.weekRow}>
            <Text style={styles.weekLabel}>Best wake time</Text>
            <Text style={[styles.weekValue, styles.bestTime]}>3m 24s</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    paddingTop: 20,
    paddingBottom: 40,
  },
  // Main Card Styles
  mainCard: {
    height: 220,
    marginBottom: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  greetingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B7355',
    letterSpacing: 1,
    marginBottom: 8,
  },
  mainCardTitle: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  mainCardSubtitle: {
    fontSize: 16,
    color: '#5D5D5D',
    marginBottom: 4,
  },
  mainCardDuration: {
    fontSize: 14,
    color: '#6D6D6D',
  },
  playButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  // Stats Row Styles
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    marginBottom: 8,
  },
  statEmoji: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 13,
    color: '#7D7D7D',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 2,
  },
  statSubtext: {
    fontSize: 12,
    color: '#9D9D9D',
  },
  // Section Header Styles
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B4CE6',
  },
  // Stories Section Styles
  storiesScroll: {
    marginBottom: 24,
    paddingLeft: 20,
  },
  storiesContent: {
    paddingRight: 20,
  },
  storyCard: {
    width: 200,
    height: 180,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    padding: 16,
  },
  storyDuration: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  storyDurationText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B4CE6',
    marginLeft: 4,
  },
  storyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  storyDescription: {
    fontSize: 12,
    color: '#5D5D5D',
    lineHeight: 16,
    paddingRight: 20,
    marginBottom: 50,
  },
  storyPlayButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  // Week Stats Styles
  weekCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  weekLabel: {
    fontSize: 14,
    color: '#5D5D5D',
  },
  weekValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  bestTime: {
    color: '#4CAF50',
  },
});
