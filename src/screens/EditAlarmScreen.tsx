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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { initDatabase } from '../db/schema';
import { Alarm } from '../types';
import { alarmScheduler } from '../modules/alarm/AlarmScheduler';
import { GradientCard } from '../components/GradientCard';
import { SoundPickerModal, ALARM_SOUNDS } from '../components/SoundPickerModal';
import { SnoozePickerModal } from '../components/SnoozePickerModal';

const DAYS_OF_WEEK = [
  { id: 1, label: 'MON', short: '3' },
  { id: 2, label: 'TUE', short: '4' },
  { id: 3, label: 'WED', short: '5' },
  { id: 4, label: 'THU', short: '6' },
  { id: 5, label: 'FRI', short: '7' },
  { id: 6, label: 'SAT', short: '8' },
  { id: 0, label: 'SUN', short: '9' },
];

export function EditAlarmScreen({ route, navigation }: any) {
  const { alarmId } = route.params;
  
  const [loading, setLoading] = useState(true);
  const [label, setLabel] = useState('');
  const initialTime = new Date();
  initialTime.setHours(6);
  initialTime.setMinutes(0);
  const [selectedTime, setSelectedTime] = useState(initialTime);
  const [use24Hour, setUse24Hour] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [volume, setVolume] = useState(0.8);
  const [vibrate, setVibrate] = useState(true);
  const [selectedSound, setSelectedSound] = useState('default');
  const [showSoundPicker, setShowSoundPicker] = useState(false);
  const [maxSnoozes, setMaxSnoozes] = useState(3);
  const [snoozeLengthMin, setSnoozeLengthMin] = useState(9);
  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [requireAffirmations, setRequireAffirmations] = useState(true);
  const [requireGoals, setRequireGoals] = useState(true);
  const [randomChallenge, setRandomChallenge] = useState(false);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    loadAlarm();
    loadSettings();
    
    // Reload settings when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadSettings();
    });
    
    return unsubscribe;
  }, [navigation]);

  const loadSettings = async () => {
    try {
      const db = await initDatabase();
      const settings = await db.getFirstAsync('SELECT * FROM settings LIMIT 1') as any;
      if (settings) {
        const is24Hour = settings.use_24_hour_time === 1;
        console.log('📅 EditAlarmScreen: Loading time format setting:', is24Hour ? '24-hour' : '12-hour (AM/PM)');
        setUse24Hour(is24Hour);
      } else {
        console.log('📅 EditAlarmScreen: No settings found, using default 12-hour format');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadAlarm = async () => {
    try {
      const db = await initDatabase();
      const result = await db.getFirstAsync(
        'SELECT * FROM alarms WHERE id = ?',
        [alarmId]
      ) as any;

      if (result) {
        setLabel(result.label);
        // Convert time_local to Date object
        const [h, m] = result.time_local.split(':');
        const time = new Date();
        time.setHours(parseInt(h, 10));
        time.setMinutes(parseInt(m, 10));
        setSelectedTime(time);
        setSelectedDays(JSON.parse(result.days_of_week));
        setVolume(result.volume);
        setVibrate(result.vibrate === 1);
        setSelectedSound(result.tone_uri || 'default');
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
      // Convert selectedTime to HH:MM format
      const hours = selectedTime.getHours().toString().padStart(2, '0');
      const minutes = selectedTime.getMinutes().toString().padStart(2, '0');
      const timeLocal = `${hours}:${minutes}`;

      await db.runAsync(
        `UPDATE alarms SET
          label = ?, time_local = ?, days_of_week = ?, volume = ?, tone_uri = ?,
          vibrate = ?, max_snoozes = ?, snooze_length_min = ?,
          require_affirmations = ?, require_goals = ?, random_challenge = ?,
          enabled = ?
        WHERE id = ?`,
        [
          label,
          timeLocal,
          JSON.stringify(selectedDays),
          volume,
          selectedSound,
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
            toneUri: selectedSound,
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
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Days of Week Selector */}
        <View style={styles.daysSection}>
          <View style={styles.daysContainer}>
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.id}
                style={styles.dayButtonWrapper}
                onPress={() => toggleDay(day.id)}
                accessibilityRole="button"
                accessibilityLabel={`${day.label}, ${selectedDays.includes(day.id) ? 'selected' : 'not selected'}`}
              >
                <Text style={styles.dayLabel}>{day.label}</Text>
                <View
                  style={[
                    styles.dayButton,
                    selectedDays.includes(day.id) && styles.dayButtonActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.dayButtonText,
                      selectedDays.includes(day.id) && styles.dayButtonTextActive,
                    ]}
                  >
                    {day.short}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Alarm Preview Card */}
        <GradientCard style={styles.alarmCard}>
          <View style={styles.alarmCardContent}>
            <View>
              <Text style={styles.alarmLabel}>{label}</Text>
              <Text style={styles.alarmTime}>
                {selectedTime.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: !use24Hour
                })}
              </Text>
            </View>
            <View style={styles.alarmCardRight}>
              <Text style={styles.bellIcon}>🔔</Text>
              <Switch
                value={enabled}
                onValueChange={setEnabled}
                trackColor={{ false: '#ddd', true: '#333' }}
                thumbColor="#fff"
              />
            </View>
          </View>
        </GradientCard>

        {/* Set Time Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.clockIcon}>🕐</Text>
            <Text style={styles.sectionTitle}>Set Time</Text>
          </View>
          <DateTimePicker
            value={selectedTime}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              if (date) {
                setSelectedTime(date);
              }
            }}
            is24Hour={use24Hour}
            style={styles.timePicker}
          />
        </View>

        {/* Vibration Section */}
        <View style={styles.section}>
          <View style={styles.optionRow}>
            <View style={styles.optionLeft}>
              <Text style={styles.vibrationIcon}>📳</Text>
              <Text style={styles.optionLabel}>Vibration</Text>
            </View>
            <Switch
              value={vibrate}
              onValueChange={setVibrate}
              trackColor={{ false: '#ddd', true: '#7C3AED' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Alarm Sound Section */}
        <View style={styles.section}>
          <View style={styles.optionHeader}>
            <Text style={styles.soundIcon}>🔊</Text>
            <Text style={styles.optionLabel}>Alarm Sound</Text>
          </View>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSoundPicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select alarm sound"
          >
            <Text style={styles.dropdownText}>
              {ALARM_SOUNDS.find(s => s.value === selectedSound)?.label || 'Gentle Chime'}
            </Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Snooze Options Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.snoozeIcon}>⏰</Text>
            <Text style={styles.sectionTitle}>Snooze Options</Text>
          </View>
          
          <Text style={styles.label}>Number of snoozes</Text>
          <View style={styles.numberButtonGroup}>
            {[0, 1, 2, 3].map(num => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.numberButton,
                  maxSnoozes === num && styles.numberButtonActive,
                ]}
                onPress={() => setMaxSnoozes(num)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.numberButtonText,
                    maxSnoozes === num && styles.numberButtonTextActive,
                  ]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Snooze length</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowSnoozePicker(true)}
            accessibilityRole="button"
            accessibilityLabel="Select snooze length"
          >
            <Text style={styles.dropdownText}>{snoozeLengthMin} minutes</Text>
            <Text style={styles.dropdownArrow}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Hidden Advanced Options */}
        <View style={{ display: 'none' }}>
          <Switch value={requireAffirmations} onValueChange={setRequireAffirmations} />
          <Switch value={requireGoals} onValueChange={setRequireGoals} />
          <Switch value={randomChallenge} onValueChange={setRandomChallenge} />
          <TextInput value={label} onChangeText={setLabel} />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save alarm changes"
        >
          <Text style={styles.bellIconButton}>🔔</Text>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete alarm"
        >
          <Text style={styles.deleteButtonText}>🗑️ Delete Alarm</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modals */}
      <SoundPickerModal
        visible={showSoundPicker}
        selectedValue={selectedSound}
        onSelect={setSelectedSound}
        onClose={() => setShowSoundPicker(false)}
      />
      <SnoozePickerModal
        visible={showSnoozePicker}
        selectedValue={snoozeLengthMin}
        onSelect={setSnoozeLengthMin}
        onClose={() => setShowSnoozePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F5',
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
    padding: 20,
    paddingBottom: 100,
  },
  
  // Days of Week Section
  daysSection: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButtonWrapper: {
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 10,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  dayButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#7C3AED',
  },
  dayButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  dayButtonTextActive: {
    color: '#fff',
  },

  // Alarm Preview Card
  alarmCard: {
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  alarmCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmLabel: {
    fontSize: 18,
    color: '#333',
    marginBottom: 4,
    fontWeight: '500',
  },
  alarmTime: {
    fontSize: 32,
    color: '#333',
    fontWeight: 'bold',
  },
  alarmCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellIcon: {
    fontSize: 24,
  },

  // Sections
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  clockIcon: {
    fontSize: 20,
  },
  snoozeIcon: {
    fontSize: 20,
  },

  // Time Picker
  timePicker: {
    marginTop: 8,
    height: 150,
    width: '100%',
  },

  // Option Rows
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  optionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  vibrationIcon: {
    fontSize: 20,
  },
  soundIcon: {
    fontSize: 20,
  },

  // Dropdown
  dropdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#999',
  },

  // Labels
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    marginTop: 16,
  },

  // Number Buttons
  numberButtonGroup: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  numberButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  numberButtonActive: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F0FF',
  },
  numberButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  numberButtonTextActive: {
    color: '#7C3AED',
  },

  // Save Button
  saveButton: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  bellIconButton: {
    fontSize: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },

  // Delete Button
  deleteButton: {
    backgroundColor: '#FF4757',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#FF4757',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  deleteButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});
