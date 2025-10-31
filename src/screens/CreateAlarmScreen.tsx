import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initDatabase } from '../db/schema';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export function CreateAlarmScreen({ navigation }: any) {
  const [label, setLabel] = useState('Wake Up');
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [volume, setVolume] = useState(0.8);
  const [vibrate, setVibrate] = useState(true);
  const [maxSnoozes, setMaxSnoozes] = useState(3);
  const [snoozeLengthMin, setSnoozeLengthMin] = useState(9);
  const [requireAffirmations, setRequireAffirmations] = useState(true);
  const [requireGoals, setRequireGoals] = useState(true);
  const [randomChallenge, setRandomChallenge] = useState(false);

  const toggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  const handleSave = async () => {
    if (!label.trim()) {
      Alert.alert('Error', 'Please enter an alarm label');
      return;
    }

    const hourNum = parseInt(hour, 10);
    const minuteNum = parseInt(minute, 10);

    if (isNaN(hourNum) || hourNum < 0 || hourNum > 23) {
      Alert.alert('Error', 'Hour must be between 0 and 23');
      return;
    }

    if (isNaN(minuteNum) || minuteNum < 0 || minuteNum > 59) {
      Alert.alert('Error', 'Minute must be between 0 and 59');
      return;
    }

    if (selectedDays.length === 0) {
      Alert.alert('Error', 'Please select at least one day');
      return;
    }

    try {
      const db = await initDatabase();
      const id = `alarm_${Date.now()}`;
      const timeLocal = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;
      const createdAt = new Date().toISOString();

      await db.runAsync(
        `INSERT INTO alarms (
          id, label, time_local, days_of_week, volume, tone_uri, vibrate,
          max_snoozes, snooze_length_min, require_affirmations, require_goals,
          random_challenge, enabled, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          label,
          timeLocal,
          JSON.stringify(selectedDays),
          volume,
          'default',
          vibrate ? 1 : 0,
          maxSnoozes,
          snoozeLengthMin,
          requireAffirmations ? 1 : 0,
          requireGoals ? 1 : 0,
          randomChallenge ? 1 : 0,
          1,
          createdAt,
        ]
      );

      Alert.alert('Success', 'Alarm created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating alarm:', error);
      Alert.alert('Error', 'Failed to create alarm');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">
          Create Alarm
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alarm Label</Text>
          <TextInput
            style={styles.textInput}
            value={label}
            onChangeText={setLabel}
            placeholder="Enter alarm name"
            accessibilityLabel="Alarm label input"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time</Text>
          <View style={styles.timeInputContainer}>
            <TextInput
              style={styles.timeInput}
              value={hour}
              onChangeText={setHour}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="HH"
              accessibilityLabel="Hour input"
            />
            <Text style={styles.timeSeparator}>:</Text>
            <TextInput
              style={styles.timeInput}
              value={minute}
              onChangeText={setMinute}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="MM"
              accessibilityLabel="Minute input"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Repeat on Days</Text>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.id}
                style={[
                  styles.dayButton,
                  selectedDays.includes(day.id) && styles.dayButtonActive,
                ]}
                onPress={() => toggleDay(day.id)}
                accessibilityRole="button"
                accessibilityLabel={`${day.label}, ${selectedDays.includes(day.id) ? 'selected' : 'not selected'}`}
                accessibilityHint="Tap to toggle this day"
              >
                <Text
                  style={[
                    styles.dayButtonText,
                    selectedDays.includes(day.id) && styles.dayButtonTextActive,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Vibrate</Text>
            <Switch
              value={vibrate}
              onValueChange={setVibrate}
              accessibilityLabel="Vibrate toggle"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume: {Math.round(volume * 100)}%</Text>
          <View style={styles.sliderContainer}>
            {[0, 0.25, 0.5, 0.75, 1.0].map(val => (
              <TouchableOpacity
                key={val}
                style={[
                  styles.volumeButton,
                  volume === val && styles.volumeButtonActive,
                ]}
                onPress={() => setVolume(val)}
                accessibilityRole="button"
                accessibilityLabel={`Set volume to ${Math.round(val * 100)} percent`}
              >
                <Text style={styles.volumeButtonText}>{Math.round(val * 100)}%</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snooze Settings</Text>
          <View style={styles.snoozeRow}>
            <Text style={styles.label}>Max Snoozes:</Text>
            <View style={styles.numberButtonGroup}>
              {[0, 1, 2, 3, 5].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.numberButton,
                    maxSnoozes === num && styles.numberButtonActive,
                  ]}
                  onPress={() => setMaxSnoozes(num)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set maximum snoozes to ${num}`}
                >
                  <Text style={styles.numberButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.snoozeRow}>
            <Text style={styles.label}>Snooze Length (min):</Text>
            <View style={styles.numberButtonGroup}>
              {[5, 9, 10, 15].map(num => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.numberButton,
                    snoozeLengthMin === num && styles.numberButtonActive,
                  ]}
                  onPress={() => setSnoozeLengthMin(num)}
                  accessibilityRole="button"
                  accessibilityLabel={`Set snooze length to ${num} minutes`}
                >
                  <Text style={styles.numberButtonText}>{num}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wake-up Requirements</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Require Affirmations</Text>
            <Switch
              value={requireAffirmations}
              onValueChange={setRequireAffirmations}
              accessibilityLabel="Require affirmations toggle"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Require Goals</Text>
            <Switch
              value={requireGoals}
              onValueChange={setRequireGoals}
              accessibilityLabel="Require goals toggle"
            />
          </View>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Random Challenge Word</Text>
            <Switch
              value={randomChallenge}
              onValueChange={setRandomChallenge}
              accessibilityLabel="Random challenge word toggle"
            />
          </View>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save alarm"
        >
          <Text style={styles.saveButtonText}>Create Alarm</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a2e',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 32,
    fontWeight: 'bold',
    width: 80,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 32,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666',
  },
  dayButtonTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabel: {
    fontSize: 16,
    color: '#1a1a2e',
  },
  sliderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  volumeButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  volumeButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  volumeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  snoozeRow: {
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#1a1a2e',
    marginBottom: 8,
  },
  numberButtonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  numberButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  numberButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  numberButtonText: {
    fontSize: 14,
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
