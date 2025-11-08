import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MIOnboardingData, GeneratedContent } from '../types';
import { GradientCard } from '../components/GradientCard';
import { OnboardingResultsCard } from '../components/OnboardingResultsCard';
import { PermissionRequestCard } from '../components/PermissionRequestCard';
import { generateGoalsAndAffirmations } from '../services/openai';
import { setOnboardingComplete } from '../utils/onboardingStorage';
import { initDatabase } from '../db/schema';

export function MIOnboardingScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<MIOnboardingData>>({
    meaningfulChange: '',
    importanceScore: 5,
    confidenceScore: 5,
    perfectFuture: '',
    barriers: [],
    supports: [],
    goalLines: [],
    affirmationLines: [],
  });

  const [tempText, setTempText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const userId = 'user_default';

  const handleNext = () => {
    // Capture temp text for certain steps
    if (step === 2) {
      // Why is this important
      setData({ ...data, meaningfulChange: tempText || data.meaningfulChange });
    } else if (step === 5) {
      // Barriers
      setData({ ...data, barriers: [tempText] });
    } else if (step === 6) {
      // Supports
      setData({ ...data, supports: [tempText] });
    }

    if (step === 6) {
      // Generate content after collecting all data
      handleGenerateContent();
    } else if (step === 8) {
      // Move to permissions after showing results
      setStep(step + 1);
    } else {
      setStep(step + 1);
      setTempText('');
    }
  };

  const handleGenerateContent = async () => {
    setIsGenerating(true);
    setStep(7); // Move to loading step

    try {
      const content = await generateGoalsAndAffirmations(data);
      setGeneratedContent(content);
      setData({
        ...data,
        goalLines: content.goals,
        affirmationLines: content.affirmations,
      });
      setStep(8); // Move to results step
    } catch (error) {
      console.error('Error generating content:', error);
      Alert.alert(
        'Generation Error',
        'We had trouble generating your personalized content. Would you like to try again?',
        [
          { text: 'Skip', onPress: () => setStep(9) },
          { text: 'Try Again', onPress: handleGenerateContent },
        ]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePermissionsGranted = async () => {
    await saveGoalsAndAffirmations();
    setStep(10); // Move to completion step
  };

  const handleSkipPermissions = () => {
    Alert.alert(
      'Skip Permissions?',
      'Without permissions, alarms may not work reliably. You can grant them later in Settings.',
      [
        { text: 'Go Back', style: 'cancel' },
        {
          text: 'Skip Anyway',
          style: 'destructive',
          onPress: async () => {
            await saveGoalsAndAffirmations();
            setStep(10);
          },
        },
      ]
    );
  };

  const saveGoalsAndAffirmations = async () => {
    try {
      const db = await initDatabase();
      const now = new Date().toISOString();

      // Check if user exists
      const userResult = await db.getFirstAsync(
        'SELECT * FROM user_profiles WHERE id = ?',
        [userId]
      ) as any;

      if (!userResult) {
        await db.runAsync(
          'INSERT INTO user_profiles (id, name, timezone, onboarding_completed, created_at) VALUES (?, ?, ?, ?, ?)',
          [userId, 'User', 'America/New_York', 1, now]
        );
      } else {
        await db.runAsync(
          'UPDATE user_profiles SET onboarding_completed = 1 WHERE id = ?',
          [userId]
        );
      }

      // Save goals
      if (data.goalLines && data.goalLines.length > 0) {
        for (const goal of data.goalLines) {
          const id = `goal_${Date.now()}_${Math.random()}`;
          await db.runAsync(
            'INSERT INTO goals (id, user_id, text, why, barriers, supports, last_edited_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              id,
              userId,
              goal,
              data.meaningfulChange || '',
              JSON.stringify(data.barriers || []),
              JSON.stringify(data.supports || []),
              now,
            ]
          );
        }
      }

      // Save affirmations
      if (data.affirmationLines && data.affirmationLines.length > 0) {
        for (const affirmation of data.affirmationLines) {
          const id = `affirmation_${Date.now()}_${Math.random()}`;
          await db.runAsync(
            'INSERT INTO affirmations (id, user_id, text, active, last_edited_at) VALUES (?, ?, ?, ?, ?)',
            [id, userId, affirmation, 1, now]
          );
        }
      }

      // Mark onboarding as complete in AsyncStorage
      await setOnboardingComplete();
    } catch (error) {
      console.error('Error saving goals and affirmations:', error);
      Alert.alert('Error', 'Failed to save your goals and affirmations');
    }
  };

  const handleSetupAlarm = () => {
    navigation.navigate('MainTabs', { screen: 'Alarm' });
  };

  const handleExploreApp = () => {
    navigation.navigate('MainTabs', { screen: 'Home' });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#FEE685', '#FFEDD4', '#DBEAFE']}
              style={styles.contentCard}
            >
              <View style={styles.welcomeIcon}>
                <Ionicons name="sunny" size={64} color="#6B4CE6" />
              </View>
              <Text style={styles.stepTitle}>Welcome!</Text>
              <Text style={styles.stepQuestion}>What are your goals?</Text>
              <Text style={styles.stepHint}>
                Tell us what you'd like to achieve. We'll help you wake up with purpose.
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={data.meaningfulChange}
                onChangeText={(text) => setData({ ...data, meaningfulChange: text })}
                placeholder="Example: Exercise regularly, finish my project, sleep better..."
                placeholderTextColor="#999"
                accessibilityLabel="What are your goals?"
              />
            </GradientCard>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#E8D5FF', '#D5C6FF', '#C6B7FF']}
              style={styles.contentCard}
            >
              <Text style={styles.stepQuestion}>How important is this to you?</Text>
              <Text style={styles.stepHint}>On a scale from 0 to 10</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{data.importanceScore}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={data.importanceScore}
                  onValueChange={(value: number) => setData({ ...data, importanceScore: value })}
                  minimumTrackTintColor="#6B4CE6"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#6B4CE6"
                  accessibilityLabel="Importance scale from 0 to 10"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>Not important</Text>
                  <Text style={styles.sliderLabel}>Very important</Text>
                </View>
              </View>
            </GradientCard>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#FFE5D9', '#FFD7C4', '#FFC9AF']}
              style={styles.contentCard}
            >
              <Text style={styles.stepQuestion}>Why is this important to you?</Text>
              <Text style={styles.stepHint}>
                Share what makes this meaningful - your why is your power
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={tempText}
                onChangeText={setTempText}
                placeholder="Share what makes this meaningful to you..."
                placeholderTextColor="#999"
                accessibilityLabel="Why is this important to you?"
              />
            </GradientCard>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#FCCEE8', '#FCE7F3', '#CEFAFE']}
              style={styles.contentCard}
            >
              <Text style={styles.stepQuestion}>How confident are you?</Text>
              <Text style={styles.stepHint}>That you can make progress on this goal</Text>
              <View style={styles.sliderContainer}>
                <Text style={styles.sliderValue}>{data.confidenceScore}</Text>
                <Slider
                  style={styles.slider}
                  minimumValue={0}
                  maximumValue={10}
                  step={1}
                  value={data.confidenceScore}
                  onValueChange={(value: number) => setData({ ...data, confidenceScore: value })}
                  minimumTrackTintColor="#6B4CE6"
                  maximumTrackTintColor="#E0E0E0"
                  thumbTintColor="#6B4CE6"
                  accessibilityLabel="Confidence scale from 0 to 10"
                />
                <View style={styles.sliderLabels}>
                  <Text style={styles.sliderLabel}>Not confident</Text>
                  <Text style={styles.sliderLabel}>Very confident</Text>
                </View>
              </View>
            </GradientCard>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#FEE685', '#FFEDD4', '#DBEAFE']}
              style={styles.contentCard}
            >
              <Text style={styles.stepQuestion}>If things went perfectly...</Text>
              <Text style={styles.stepHint}>
                Imagine 90 days from now - what's different in your life?
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={6}
                value={data.perfectFuture}
                onChangeText={(text) => setData({ ...data, perfectFuture: text })}
                placeholder="Imagine your ideal outcome..."
                placeholderTextColor="#999"
                accessibilityLabel="If things went perfectly in 90 days, what's different?"
              />
            </GradientCard>
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#E8D5FF', '#D5C6FF', '#C6B7FF']}
              style={styles.contentCard}
            >
              <Text style={styles.stepQuestion}>What gets in the way?</Text>
              <Text style={styles.stepHint}>
                Understanding barriers helps us support you better
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={tempText}
                onChangeText={setTempText}
                placeholder="Time, motivation, resources, habits..."
                placeholderTextColor="#999"
                accessibilityLabel="What gets in the way?"
              />
            </GradientCard>
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#FFE5D9', '#FFD7C4', '#FFC9AF']}
              style={styles.contentCard}
            >
              <Text style={styles.stepQuestion}>What helps you succeed?</Text>
              <Text style={styles.stepHint}>
                People, tools, environments that support your success
              </Text>
              <TextInput
                style={styles.textInput}
                multiline
                numberOfLines={4}
                value={tempText}
                onChangeText={setTempText}
                placeholder="People, tools, environments that help..."
                placeholderTextColor="#999"
                accessibilityLabel="Who or what helps you?"
              />
            </GradientCard>
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#FCCEE8', '#FCE7F3', '#CEFAFE']}
              style={[styles.contentCard, styles.loadingCard]}
            >
              <ActivityIndicator size="large" color="#6B4CE6" />
              <Text style={styles.loadingTitle}>Creating your personalized journey...</Text>
              <Text style={styles.loadingText}>
                We're crafting goals and affirmations tailored just for you
              </Text>
            </GradientCard>
          </View>
        );

      case 8:
        return generatedContent ? (
          <OnboardingResultsCard
            goals={generatedContent.goals}
            affirmations={generatedContent.affirmations}
          />
        ) : null;

      case 9:
        return <PermissionRequestCard onPermissionsGranted={handlePermissionsGranted} onSkip={handleSkipPermissions} />;

      case 10:
        return (
          <View style={styles.stepContainer}>
            <GradientCard
              colors={['#FEE685', '#FFEDD4', '#DBEAFE']}
              style={[styles.contentCard, styles.completionCard]}
            >
              <View style={styles.completionIcon}>
                <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
              </View>
              <Text style={styles.completionTitle}>You're All Set!</Text>
              <Text style={styles.completionText}>
                Your personalized goals and affirmations are ready. Let's set up your first alarm to start waking up with purpose.
              </Text>
              
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleSetupAlarm}
                accessibilityRole="button"
                accessibilityLabel="Set up your first alarm"
              >
                <Ionicons name="alarm" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Set Up Your First Alarm</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleExploreApp}
                accessibilityRole="button"
                accessibilityLabel="Explore the app"
              >
                <Text style={styles.secondaryButtonText}>Explore App</Text>
              </TouchableOpacity>
            </GradientCard>
          </View>
        );

      default:
        return null;
    }
  };

  const totalSteps = 11;
  const progressPercent = ((step + 1) / totalSteps) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {step < 10 && (
        <View style={styles.header}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Step {step + 1} of {totalSteps}
          </Text>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {step < 10 && step !== 7 && step !== 8 && step !== 9 && (
        <View style={styles.footer}>
          {step > 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setStep(step - 1)}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color="#666" />
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.nextButton, step === 0 && styles.nextButtonFull]}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel="Continue to next step"
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {step === 8 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={handleNext}
            accessibilityRole="button"
            accessibilityLabel="Continue to permissions"
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#6B4CE6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    color: '#7D7D7D',
    fontWeight: '600',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  contentCard: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  welcomeIcon: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 12,
    textAlign: 'center',
  },
  stepQuestion: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 12,
  },
  stepHint: {
    fontSize: 16,
    color: '#5D5D5D',
    marginBottom: 24,
    lineHeight: 24,
  },
  textInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(107, 76, 230, 0.2)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#2D2D2D',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  sliderValue: {
    fontSize: 56,
    fontWeight: '700',
    color: '#6B4CE6',
    textAlign: 'center',
    marginBottom: 24,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#5D5D5D',
    fontWeight: '500',
  },
  loadingCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D2D2D',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#5D5D5D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  completionCard: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completionIcon: {
    marginBottom: 24,
  },
  completionTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 16,
    textAlign: 'center',
  },
  completionText: {
    fontSize: 16,
    color: '#5D5D5D',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#6B4CE6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    marginBottom: 12,
    shadowColor: '#6B4CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7D7D7D',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FAFAFA',
  },
  backButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 18,
    borderRadius: 16,
    backgroundColor: '#6B4CE6',
    shadowColor: '#6B4CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
