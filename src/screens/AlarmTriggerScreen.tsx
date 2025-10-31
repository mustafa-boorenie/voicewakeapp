import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { WaveformDisplay } from '../components/WaveformDisplay';
import { transcriber } from '../modules/stt/Transcriber';
import { verifier } from '../modules/verify/Verifier';
import { audioRecorder } from '../modules/audio/Recorder';
import { antiCheatHeuristics } from '../modules/anticheat/Heuristics';
import { getDailyChallengeWord } from '../utils/challengeWords';
import { COPY } from '../constants/copy';
import { initDatabase } from '../db/schema';
import { CheatFlags } from '../types';

const USER_ID = 'user_default';

export function AlarmTriggerScreen({ route, navigation }: any) {
  const { alarmId, requireAffirmations, requireGoals, randomChallenge } = route.params;
  
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [currentPhase, setCurrentPhase] = useState<'affirmations' | 'goals'>('affirmations');
  const [challengeWord, setChallengeWord] = useState('');
  const [canDismiss, setCanDismiss] = useState(false);
  const [snoozesUsed, setSnoozesUsed] = useState(0);
  const [affirmations, setAffirmations] = useState<string[]>([]);
  const [goals, setGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [alarmRunId, setAlarmRunId] = useState('');
  const [firedAt, setFiredAt] = useState('');
  const [maxSnoozes, setMaxSnoozes] = useState(3);
  const [recordedAudio, setRecordedAudio] = useState<Float32Array | null>(null);
  const [cheatFlags, setCheatFlags] = useState<CheatFlags>({ playback: false, lowEnergy: false, micLoop: false });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const db = await initDatabase();
      
      const affirmationsResults = await db.getAllAsync(
        'SELECT text FROM affirmations WHERE user_id = ? AND active = 1 ORDER BY last_edited_at DESC',
        [USER_ID]
      ) as any[];
      
      const goalsResults = await db.getAllAsync(
        'SELECT text FROM goals WHERE user_id = ? ORDER BY last_edited_at DESC',
        [USER_ID]
      ) as any[];

      const alarmResult = await db.getFirstAsync(
        'SELECT max_snoozes FROM alarms WHERE id = ?',
        [alarmId]
      ) as any;
      
      setAffirmations(affirmationsResults.map(r => r.text));
      setGoals(goalsResults.map(r => r.text));
      if (alarmResult) {
        setMaxSnoozes(alarmResult.max_snoozes);
      }
      
      if (randomChallenge) {
        setChallengeWord(getDailyChallengeWord());
      }
      
      const runId = `alarm_run_${Date.now()}`;
      const now = new Date().toISOString();
      setAlarmRunId(runId);
      setFiredAt(now);
      
      await db.runAsync(
        `INSERT INTO alarm_runs (
          id, alarm_id, fired_at, snoozes_used, success,
          transcript_json, similarity_scores, cheat_flags
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [runId, alarmId, now, 0, 0, '{}', '{}', '{}']
      );
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load alarm data');
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setTranscript('');
    setRecordedAudio(null);

    try {
      await audioRecorder.start();
      
      await transcriber.transcribeStream(
        (result) => {
          setTranscript(result.transcript);
        },
        (error) => {
          console.error('Transcription error:', error);
          setIsRecording(false);
          Alert.alert('Error', COPY.ERRORS.STT_FAILED);
        }
      );
    } catch (error) {
      console.error('Failed to start recording:', error);
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    setIsRecording(false);
    
    try {
      const audio = await audioRecorder.stop();
      await transcriber.stop();
      
      setRecordedAudio(audio);
      
      if (!audio || audio.length === 0) {
        Alert.alert('Error', 'No audio was recorded. Please try again.');
        return;
      }
      
      const audioFeatures = audioRecorder.getAudioFeatures(audio);
      const detectedCheatFlags = antiCheatHeuristics.analyzeAudioFeatures(audioFeatures);
      setCheatFlags(detectedCheatFlags);
      
      if (detectedCheatFlags.playback || detectedCheatFlags.micLoop) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Audio Issue Detected',
          'It appears you may be playing back audio. Please speak naturally into the microphone.'
        );
        return;
      }
      
      await handleVerification(transcript, detectedCheatFlags);
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to process recording. Please try again.');
    }
  };

  const handleVerification = async (finalTranscript: string, detectedCheatFlags: CheatFlags) => {
    const textsToVerify = currentPhase === 'affirmations' ? affirmations : goals;
    
    const result = verifier.verify({
      transcript: finalTranscript,
      affirmations: currentPhase === 'affirmations' ? textsToVerify : [],
      goals: currentPhase === 'goals' ? textsToVerify : [],
      challengeWord: currentPhase === 'goals' && randomChallenge ? challengeWord : undefined,
      thresholds: {
        minSimilarity: 0.72,
      },
    });

    if (result.passed) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      if (currentPhase === 'affirmations' && requireGoals) {
        setCurrentPhase('goals');
        setTranscript('');
        setRecordedAudio(null);
        Alert.alert('Great!', COPY.WAKE_PROMPTS.ENCOURAGER);
      } else {
        setCanDismiss(true);
        await saveVerificationResult(finalTranscript, result, detectedCheatFlags, true);
        Alert.alert('Success', COPY.WAKE_PROMPTS.SUCCESS, [
          { text: 'Dismiss Alarm', onPress: handleDismiss },
        ]);
      }
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      await saveVerificationResult(finalTranscript, result, detectedCheatFlags, false);
      Alert.alert('Try Again', result.details);
    }
  };

  const saveVerificationResult = async (
    finalTranscript: string,
    result: any,
    flags: CheatFlags,
    success: boolean
  ) => {
    try {
      const db = await initDatabase();
      const now = new Date().toISOString();
      
      await db.runAsync(
        `UPDATE alarm_runs SET
          dismissed_at = ?,
          snoozes_used = ?,
          success = ?,
          transcript_json = ?,
          similarity_scores = ?,
          cheat_flags = ?
        WHERE id = ?`,
        [
          now,
          snoozesUsed,
          success ? 1 : 0,
          JSON.stringify({ transcript: finalTranscript }),
          JSON.stringify(result.scores),
          JSON.stringify(flags),
          alarmRunId,
        ]
      );
      
      if (success) {
        await updateStreaks();
      }
    } catch (error) {
      console.error('Error saving verification result:', error);
    }
  };

  const updateStreaks = async () => {
    try {
      const db = await initDatabase();
      
      const today = new Date();
      const todayDateStr = today.toISOString().split('T')[0];
      
      let streakResult = await db.getFirstAsync(
        'SELECT * FROM streaks WHERE user_id = ? LIMIT 1',
        [USER_ID]
      ) as any;
      
      if (streakResult) {
        let newCurrent = streakResult.current;
        
        if (streakResult.last_completion_date) {
          const lastCompletionDateStr = streakResult.last_completion_date.split('T')[0];
          
          if (lastCompletionDateStr === todayDateStr) {
            console.log('Streak already updated today, skipping increment');
            return;
          }
          
          const lastDate = new Date(lastCompletionDateStr);
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayDateStr = yesterday.toISOString().split('T')[0];
          
          if (lastCompletionDateStr === yesterdayDateStr) {
            newCurrent = streakResult.current + 1;
          } else {
            console.log('Streak broken, resetting to 1');
            newCurrent = 1;
          }
        } else {
          newCurrent = streakResult.current + 1;
        }
        
        const newBest = Math.max(newCurrent, streakResult.best);
        
        await db.runAsync(
          'UPDATE streaks SET current = ?, best = ?, last_completion_date = ?, updated_at = ? WHERE id = ?',
          [newCurrent, newBest, todayDateStr, new Date().toISOString(), streakResult.id]
        );
      } else {
        const id = `streak_${Date.now()}`;
        await db.runAsync(
          'INSERT INTO streaks (id, user_id, current, best, last_completion_date, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [id, USER_ID, 1, 1, todayDateStr, new Date().toISOString()]
        );
      }
    } catch (error) {
      console.error('Error updating streaks:', error);
    }
  };

  const handleDismiss = () => {
    navigation.replace('Home');
  };

  const handleSnooze = async () => {
    if (snoozesUsed < maxSnoozes) {
      const newSnoozeCount = snoozesUsed + 1;
      setSnoozesUsed(newSnoozeCount);
      
      try {
        const db = await initDatabase();
        await db.runAsync(
          'UPDATE alarm_runs SET snoozes_used = ? WHERE id = ?',
          [newSnoozeCount, alarmRunId]
        );
      } catch (error) {
        console.error('Error updating snooze count:', error);
      }
      
      Alert.alert('Snoozed', 'Alarm will ring again in 9 minutes.');
      navigation.replace('Home');
    } else {
      Alert.alert('No Snoozes Left', 'Please complete your affirmations to dismiss the alarm.');
    }
  };

  const getPromptText = () => {
    if (currentPhase === 'affirmations') {
      return COPY.WAKE_PROMPTS.GREETING;
    } else if (randomChallenge && challengeWord) {
      return COPY.WAKE_PROMPTS.WITH_CHALLENGE(challengeWord);
    } else {
      return COPY.WAKE_PROMPTS.GOALS;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <Text style={styles.prompt}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <Text style={styles.prompt} accessibilityRole="header">
          {getPromptText()}
        </Text>

        <View style={styles.linesContainer}>
          {(currentPhase === 'affirmations' ? affirmations : goals).map((line, index) => (
            <Text key={index} style={styles.lineText}>
              "{line}"
            </Text>
          ))}
        </View>

        <WaveformDisplay isActive={isRecording} color="#4CAF50" />

        {transcript.length > 0 && (
          <View style={styles.transcriptContainer}>
            <Text style={styles.transcriptLabel}>You said:</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </View>
        )}

        <View style={styles.controls}>
          {!isRecording ? (
            <TouchableOpacity
              style={styles.recordButton}
              onPress={startRecording}
              accessibilityRole="button"
              accessibilityLabel="Start recording your affirmations"
            >
              <Text style={styles.recordButtonText}>🎤 Start Speaking</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.recordButton, styles.recordingButton]}
              onPress={stopRecording}
              accessibilityRole="button"
              accessibilityLabel="Stop recording"
            >
              <Text style={styles.recordButtonText}>⏹ Stop</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.snoozeButton, canDismiss && styles.dismissButton]}
            onPress={canDismiss ? handleDismiss : handleSnooze}
            disabled={!canDismiss && snoozesUsed >= maxSnoozes}
            accessibilityRole="button"
            accessibilityLabel={canDismiss ? "Dismiss alarm" : `Snooze alarm, ${maxSnoozes - snoozesUsed} snoozes remaining`}
          >
            <Text style={styles.snoozeButtonText}>
              {canDismiss ? 'Dismiss Alarm' : `Snooze (${maxSnoozes - snoozesUsed} left)`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-around',
  },
  prompt: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  linesContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginVertical: 20,
  },
  lineText: {
    fontSize: 20,
    color: '#fff',
    marginBottom: 12,
    lineHeight: 28,
  },
  transcriptContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  transcriptLabel: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 8,
  },
  transcriptText: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 22,
  },
  controls: {
    gap: 12,
  },
  recordButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#f44336',
  },
  recordButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  snoozeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
  },
  dismissButton: {
    backgroundColor: '#4CAF50',
  },
  snoozeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
