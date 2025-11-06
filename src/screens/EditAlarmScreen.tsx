import React, { useState, useEffect } from 'react';
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
import { Alarm } from '../types';
import { alarmScheduler } from '../modules/alarm/AlarmScheduler';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export function EditAlarmScreen({ route, navigation }: any) {
  const { alarmId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const [hour, setHour] = useState('07');
  const [minute, setMinute] = useState('00');
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [volume, setVolume] = useState(0.8);
  const [vibrate, setVibrate] = useState(true);
  const [maxSnoozes, setMaxSnoozes] = useState(3);
  const [snoozeLengthMin, setSnoozeLengthMin] = useState(9);
  const [requireAffirmations, setRequireAffirmations] = useState(true);
  const [requireGoals, setRequireGoals] = useState(true);
  const [randomChallenge, setRandomChallenge] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadAlarm();
  }, []);

  const loadAlarm = async () => {
    try {
      const db = await initDatabase();
      const result = await db.getFirstAsync(
        'SELECT * FROM alarms WHERE id = ?',
        [alarmId]
      ) as any;

      if (result) {
        setLabel(result.label);
        const [h, m] = result.time_local.split(':');
        setHour(h);
        setMinute(m);
        setSelectedDays(JSON.parse(result.days_of_week));
        setVolume(result.volume);
        setVibrate(result.vibrate === 1);
        setMaxSnoozes(result.max_snoozes);
        setSnoozeLengthMin(result.snooze_length_min);
        setRequireAffirmations(result.require_affirmations === 1);
        setRequireGoals(result.require_goals === 1);
        setRandomChallenge(result.random_challenge === 1);
        setEnabled(result.enabled === 1);
      } else {
        Alert.alert('Error', 'Alarm not found', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading alarm:', error);
      Alert.alert('Error', 'Failed to load alarm');
      setLoading(false);
    }
  };

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

    // Check permissions if alarm is enabled
    if (enabled) {
      console.log('🔑 Checking permissions before updating alarm...');
      
      const permissionStatus = await alarmScheduler.getPermissionStatus();
      console.log('📋 Permission status:', permissionStatus);
      
      if (permissionStatus === 'notDetermined') {
        // First time - request permissions (this will show iOS dialog)
        console.log('🔔 First time - requesting permissions...');
        const granted = await alarmScheduler.requestPermissions();
        
        if (!granted) {
          console.log('❌ User denied permissions');
          Alert.alert(
            'Permissions Required',
            'Notification permissions are required to schedule alarms. You can enable them later in Settings.',
            [{ text: 'OK', style: 'cancel' }]
          );
          return;
        }
        console.log('✅ User granted permissions');
      } else if (permissionStatus === 'denied') {
        // Previously denied - must go to Settings
        console.log('❌ Permissions previously denied - showing Settings prompt');
        Alert.alert(
          'Permissions Required',
          'This app needs notification permissions to schedule alarms. Please enable notifications in Settings.',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Open Settings',
              onPress: () => alarmScheduler.openAlarmSettings()
            }
          ]
        );
        return;
      } else if (permissionStatus === 'authorized' || permissionStatus === 'provisional') {
        console.log('✅ Permissions already granted');
      } else {
        console.log('⚠️ Unknown permission status:', permissionStatus);
        Alert.alert('Error', 'Could not determine notification permission status.');
        return;
      }
    }

    try {
      const db = await initDatabase();
      const timeLocal = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`;

      await db.runAsync(
        `UPDATE alarms SET
          label = ?, time_local = ?, days_of_week = ?, volume = ?,
          vibrate = ?, max_snoozes = ?, snooze_length_min = ?,
          require_affirmations = ?, require_goals = ?, random_challenge = ?,
          enabled = ?
        WHERE id = ?`,
        [
          label,
          timeLocal,
          JSON.stringify(selectedDays),
          volume,
          vibrate ? 1 : 0,
          maxSnoozes,
          snoozeLengthMin,
          requireAffirmations ? 1 : 0,
          requireGoals ? 1 : 0,
          randomChallenge ? 1 : 0,
          enabled ? 1 : 0,
          alarmId,
        ]
      );

      console.log('✅ Alarm updated in database');

      // Cancel old alarm and schedule new one if enabled
      try {
        await alarmScheduler.cancelAlarm(alarmId);
        console.log('✅ Cancelled old alarm schedule');

        if (enabled) {
          const alarm: Alarm = {
            id: alarmId,
            label,
            timeLocal,
            daysOfWeek: selectedDays,
            volume,
            toneUri: 'default',
            vibrate,
            maxSnoozes,
            snoozeLengthMin,
            requireAffirmations,
            requireGoals,
            randomChallenge,
            enabled: true,
            createdAt: new Date().toISOString(),
          };

          await alarmScheduler.scheduleAlarm(alarm);
          console.log('✅ Rescheduled alarm with updated settings');
        }

        Alert.alert(
          'Success',
          'Alarm updated successfully!',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } catch (scheduleError: any) {
        console.error('Error rescheduling alarm:', scheduleError);
        
        if (scheduleError.message && scheduleError.message.includes('PERMISSIONS_REQUIRED')) {
          Alert.alert(
            'Alarm Updated but Not Scheduled',
            'The alarm was updated but could not be scheduled because notification permissions are required.',
            [
              {
                text: 'Cancel',
                style: 'cancel',
                onPress: () => navigation.goBack()
              },
              {
                text: 'Open Settings',
                onPress: async () => {
                  await alarmScheduler.openAlarmSettings();
                  navigation.goBack();
                }
              }
            ]
          );
        } else {
          Alert.alert(
            'Partial Success',
            'Alarm was updated in database but failed to reschedule. Error: ' + scheduleError.message,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      }
    } catch (error) {
      console.error('Error updating alarm:', error);
      Alert.alert('Error', 'Failed to update alarm');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await initDatabase();
              
              // Cancel the alarm from native scheduler first
              try {
                await alarmScheduler.cancelAlarm(alarmId);
                console.log('✅ Cancelled alarm from native scheduler');
              } catch (cancelError) {
                console.error('Error cancelling alarm schedule:', cancelError);
                // Continue with database deletion even if cancel fails
              }
              
              // Delete from database
              await db.runAsync('DELETE FROM alarms WHERE id = ?', [alarmId]);
              console.log('✅ Deleted alarm from database');
              
              Alert.alert('Deleted', 'Alarm deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              console.error('Error deleting alarm:', error);
              Alert.alert('Error', 'Failed to delete alarm');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

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
          Edit Alarm
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Alarm Enabled</Text>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              accessibilityLabel="Alarm enabled toggle"
            />
          </View>
        </View>

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
          accessibilityLabel="Save alarm changes"
        >
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete alarm"
          accessibilityHint="This will permanently delete the alarm"
        >
          <Text style={styles.deleteButtonText}>Delete Alarm</Text>
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
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
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
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 32,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
