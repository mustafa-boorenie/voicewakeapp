import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientCard } from './GradientCard';

interface OnboardingResultsCardProps {
  goals: string[];
  affirmations: string[];
}

export function OnboardingResultsCard({ goals, affirmations }: OnboardingResultsCardProps) {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Personalized Journey</Text>
        <Text style={styles.headerSubtitle}>
          Based on your responses, we've created goals and affirmations to guide you
        </Text>
      </View>

      {/* Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="flag" size={24} color="#6B4CE6" />
          <Text style={styles.sectionTitle}>Your Goals</Text>
        </View>
        
        {goals.map((goal, index) => (
          <GradientCard
            key={`goal-${index}`}
            colors={['#E8D5FF', '#D5C6FF', '#C6B7FF']}
            style={styles.itemCard}
          >
            <View style={styles.itemContent}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.itemText}>{goal}</Text>
            </View>
          </GradientCard>
        ))}
      </View>

      {/* Affirmations Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="sparkles" size={24} color="#6B4CE6" />
          <Text style={styles.sectionTitle}>Your Affirmations</Text>
        </View>
        
        {affirmations.map((affirmation, index) => (
          <GradientCard
            key={`affirmation-${index}`}
            colors={['#FFE5D9', '#FFD7C4', '#FFC9AF']}
            style={styles.itemCard}
          >
            <View style={styles.itemContent}>
              <View style={styles.itemNumber}>
                <Text style={styles.itemNumberText}>{index + 1}</Text>
              </View>
              <Text style={styles.itemText}>{affirmation}</Text>
            </View>
          </GradientCard>
        ))}
      </View>

      {/* Info Text */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={20} color="#6B4CE6" />
        <Text style={styles.infoText}>
          You can edit these anytime from the Goals & Affirmations tab
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  // Header Styles
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    marginBottom: 12,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#5D5D5D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  // Section Styles
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  // Item Card Styles
  itemCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(107, 76, 230, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemNumberText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B4CE6',
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
    fontWeight: '500',
  },
  // Info Card Styles
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F0FF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8DBFF',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#5D5D5D',
    lineHeight: 20,
  },
});

