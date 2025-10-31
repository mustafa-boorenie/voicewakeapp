import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MIOnboardingData } from '../types';
import { lineGenerator } from '../modules/mi/LineGenerator';
import { COPY } from '../constants/copy';

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

  const handleNext = () => {
    if (step === 7) {
      saveAndComplete();
    } else {
      setStep(step + 1);
      setTempText('');
    }
  };

  const saveAndComplete = async () => {
    const goalLines = lineGenerator.generateGoalLines(data as MIOnboardingData);
    const affirmationLines = lineGenerator.generateAffirmationLines(data as MIOnboardingData);
    
    navigation.replace('EditGoalsAffirmations', {
      goalLines,
      affirmationLines,
      isFirstTime: true,
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{COPY.MI_ONBOARDING.WELCOME}</Text>
            <Text style={styles.stepQuestion}>{COPY.MI_ONBOARDING.MEANINGFUL_CHANGE}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={data.meaningfulChange}
              onChangeText={text => setData({ ...data, meaningfulChange: text })}
              placeholder="Example: Exercise regularly, finish my project, sleep better..."
              accessibilityLabel="What meaningful change do you want this month?"
            />
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepQuestion}>{COPY.MI_ONBOARDING.IMPORTANCE_SCALE}</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{data.importanceScore}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={data.importanceScore}
                onValueChange={(value: number) => setData({ ...data, importanceScore: value })}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#ddd"
                accessibilityLabel="Importance scale from 0 to 10"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Not important</Text>
                <Text style={styles.sliderLabel}>Very important</Text>
              </View>
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepQuestion}>
              {COPY.MI_ONBOARDING.IMPORTANCE_FOLLOWUP(data.importanceScore || 0)}
            </Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={tempText}
              onChangeText={setTempText}
              placeholder="Share what makes this meaningful to you..."
              accessibilityLabel="Why is this important to you?"
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepQuestion}>{COPY.MI_ONBOARDING.CONFIDENCE_SCALE}</Text>
            <View style={styles.sliderContainer}>
              <Text style={styles.sliderValue}>{data.confidenceScore}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10}
                step={1}
                value={data.confidenceScore}
                onValueChange={(value: number) => setData({ ...data, confidenceScore: value })}
                minimumTrackTintColor="#4CAF50"
                maximumTrackTintColor="#ddd"
                accessibilityLabel="Confidence scale from 0 to 10"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>Not confident</Text>
                <Text style={styles.sliderLabel}>Very confident</Text>
              </View>
            </View>
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepQuestion}>{COPY.MI_ONBOARDING.PERFECT_FUTURE}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={6}
              value={data.perfectFuture}
              onChangeText={text => setData({ ...data, perfectFuture: text })}
              placeholder="Imagine your ideal outcome..."
              accessibilityLabel="If things went perfectly in 90 days, what's different?"
            />
          </View>
        );

      case 5:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepQuestion}>{COPY.MI_ONBOARDING.BARRIERS}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={tempText}
              onChangeText={setTempText}
              placeholder="Time, motivation, resources, habits..."
              accessibilityLabel="What gets in the way?"
            />
          </View>
        );

      case 6:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepQuestion}>{COPY.MI_ONBOARDING.SUPPORTS}</Text>
            <TextInput
              style={styles.textInput}
              multiline
              numberOfLines={4}
              value={tempText}
              onChangeText={setTempText}
              placeholder="People, tools, environments that help..."
              accessibilityLabel="Who or what helps you?"
            />
          </View>
        );

      case 7:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>{COPY.MI_ONBOARDING.GENERATE_LINES}</Text>
            <Text style={styles.summaryText}>
              Based on our conversation, I'll create personalized goal and affirmation lines for you.
            </Text>
            <Text style={styles.summaryText}>
              You'll be able to edit them on the next screen.
            </Text>
            <Text style={styles.privacyText}>{COPY.MI_ONBOARDING.PRIVACY}</Text>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((step + 1) / 8) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step + 1} of 8</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {renderStep()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setStep(step - 1)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
          accessibilityRole="button"
          accessibilityLabel={step === 7 ? "Finish onboarding" : "Continue to next step"}
        >
          <Text style={styles.nextButtonText}>{step === 7 ? 'Finish' : 'Continue'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 16,
  },
  stepQuestion: {
    fontSize: 20,
    color: '#1a1a2e',
    marginBottom: 24,
    lineHeight: 28,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a2e',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  sliderValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryText: {
    fontSize: 16,
    color: '#1a1a2e',
    marginBottom: 16,
    lineHeight: 24,
  },
  privacyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 24,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  nextButton: {
    flex: 2,
    padding: 18,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
