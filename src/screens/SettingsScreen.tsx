import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initDatabase } from '../db/schema';

export function SettingsScreen({ navigation }: any) {
  const [use24Hour, setUse24Hour] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const db = await initDatabase();
      const settings = await db.getFirstAsync('SELECT * FROM settings LIMIT 1') as any;
      if (settings) {
        setUse24Hour(settings.use_24_hour_time === 1);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleToggle24Hour = async (value: boolean) => {
    console.log('🔄 Toggling 24-hour format to:', value);
    try {
      const db = await initDatabase();
      console.log('✅ Database initialized');
      
      // Check if settings exist
      const settings = await db.getFirstAsync('SELECT * FROM settings LIMIT 1') as any;
      console.log('📊 Current settings:', settings);
      
      if (settings) {
        // Update existing settings
        console.log('🔄 Updating existing settings...');
        await db.runAsync(
          'UPDATE settings SET use_24_hour_time = ? WHERE id = ?',
          [value ? 1 : 0, settings.id]
        );
        console.log('✅ Time format preference UPDATED in database:', value ? '24-hour' : '12-hour (AM/PM)');
      } else {
        // Create new settings record
        console.log('➕ Creating new settings record...');
        const id = `settings_${Date.now()}`;
        await db.runAsync(
          'INSERT INTO settings (id, stt_mode, challenge_word_count, min_similarity, ambient_threshold_db, use_24_hour_time) VALUES (?, ?, ?, ?, ?, ?)',
          [id, 'onDevice', 1, 0.72, -40.0, value ? 1 : 0]
        );
        console.log('✅ Time format preference CREATED in database:', value ? '24-hour' : '12-hour (AM/PM)');
      }
      
      // Update state only after successful save
      setUse24Hour(value);
      
      // Verify the save
      const verifySettings = await db.getFirstAsync('SELECT * FROM settings LIMIT 1') as any;
      console.log('🔍 Verified settings in DB:', verifySettings);
    } catch (error: any) {
      console.error('❌ Error saving settings:', error);
      console.error('❌ Error details:', error.message, error.stack);
      Alert.alert('Error', `Failed to save time format preference: ${error.message || 'Unknown error'}`);
      // Don't update state on error
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Time Format</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Use 24-Hour Time</Text>
              <Text style={styles.settingDescription}>
                {use24Hour ? 'Display times as 18:00' : 'Display times as 6:00 PM'}
              </Text>
            </View>
            <Switch
              value={use24Hour}
              onValueChange={handleToggle24Hour}
              trackColor={{ false: '#ddd', true: '#7C3AED' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Version</Text>
            <Text style={styles.settingValue}>1.0.0</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Motivational Interviewing</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => navigation.navigate('MIOnboarding')}
          >
            <Text style={styles.buttonText}>Redo Onboarding</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F0F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  settingValue: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '500',
  },
  arrow: {
    fontSize: 24,
    color: '#999',
  },
  button: {
    backgroundColor: '#7C3AED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

