import { Platform } from 'react-native';
import { Alarm } from '../../types';
import {
  addAlarmFiredListener,
  getNativeAlarmModule,
  isNativeAlarmModuleAvailable,
  type AlarmSchedulerEvent,
  type NativeScheduledAlarm,
} from '../../native/alarm';

export type AlarmFiredListener = (event: AlarmSchedulerEvent) => void;
export type AlarmRouteParams = {
  alarmId: string;
  requireAffirmations: boolean;
  requireGoals: boolean;
  randomChallenge: boolean;
  label?: string;
  antiCheatToken: string;
};

export class AlarmScheduler {
  private native: ReturnType<typeof getNativeAlarmModule> | null = null;

  constructor() {
    if (!isNativeAlarmModuleAvailable()) {
      console.warn('AlarmScheduler: native module unavailable on this platform');
      return;
    }
    
    try {
      this.native = getNativeAlarmModule();
      console.log('✅ AlarmScheduler native module loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load AlarmScheduler native module:', error);
      this.native = null;
    }
  }

  private ensureNative() {
    if (!this.native) {
      throw new Error('AlarmScheduler native module is not available');
    }
    return this.native;
  }

  addAlarmFiredListener(listener: AlarmFiredListener) {
    return addAlarmFiredListener(listener);
  }

  async consumePendingAlarm(): Promise<AlarmSchedulerEvent | null> {
    return this.ensureNative().getLastTriggeredAlarm();
  }

  async ensurePermissions(): Promise<boolean> {
    console.log('📍 ensurePermissions() called');
    
    try {
      const native = this.ensureNative();
      console.log('📍 Native module retrieved');
      
      // Get current permission status for better logging
      try {
        console.log('📍 About to call getNotificationPermissionStatus()...');
        const status = await native.getNotificationPermissionStatus();
        console.log(`📋 Current notification permission status: ${status}`);
        
        if (status === 'notDetermined') {
          console.log('🔔 First time requesting permissions - iOS dialog will appear');
        } else if (status === 'denied') {
          console.log('❌ Permissions were previously denied - user must enable in Settings');
        } else if (status === 'authorized' || status === 'provisional') {
          console.log('✅ Permissions already granted');
        }
      } catch (statusError) {
        console.error('❌ Error checking permission status:', statusError);
        console.error('   Error details:', JSON.stringify(statusError, null, 2));
        // Continue anyway - try to request permissions
      }
      
      // Request permissions (will show dialog if notDetermined, return current status otherwise)
      console.log('📍 About to call ensureNotificationPermission()...');
      const notificationsGranted = await native.ensureNotificationPermission();
      console.log('📍 ensureNotificationPermission() returned:', notificationsGranted);
      
      if (!notificationsGranted) {
        console.log('❌ Notification permissions not granted');
        return false;
      }

      if (Platform.OS === 'android') {
        const canScheduleExact = await native.canScheduleExactAlarms();
        if (!canScheduleExact) {
          console.log('❌ Cannot schedule exact alarms on Android');
          return false;
        }
      }

      console.log('✅ All alarm permissions granted');
      return true;
      
    } catch (error) {
      console.error('❌ FATAL ERROR in ensurePermissions():', error);
      console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('   Error message:', error instanceof Error ? error.message : String(error));
      console.error('   Error stack:', error instanceof Error ? error.stack : 'No stack');
      return false;
    }
  }

  /**
   * Get current notification permission status
   * Returns: 'notDetermined' | 'denied' | 'authorized' | 'provisional' | 'ephemeral' | 'unknown'
   */
  async getPermissionStatus(): Promise<string> {
    try {
      const native = this.ensureNative();
      const status = await native.getNotificationPermissionStatus();
      console.log('📋 Permission status:', status);
      return status;
    } catch (error) {
      console.error('❌ Error getting permission status:', error);
      return 'unknown';
    }
  }

  /**
   * Request permissions (shows iOS dialog if notDetermined)
   * Returns true if permissions granted, false otherwise
   */
  async requestPermissions(): Promise<boolean> {
    try {
      const native = this.ensureNative();
      console.log('🔔 Requesting notification permissions...');
      const granted = await native.ensureNotificationPermission();
      console.log(granted ? '✅ Permissions granted' : '❌ Permissions denied');
      return granted;
    } catch (error) {
      console.error('❌ Error requesting permissions:', error);
      return false;
    }
  }

  /**
   * Request permissions and show user-friendly prompts if denied
   * Returns true if permissions granted, false otherwise
   */
  async requestPermissionsWithPrompt(): Promise<boolean> {
    console.log('🔑 Requesting alarm permissions...');
    
    const granted = await this.ensurePermissions();
    
    if (!granted) {
      console.log('❌ Permissions denied - user needs to enable in Settings');
    }
    
    return granted;
  }

  async openAlarmSettings(): Promise<void> {
    await this.ensureNative().openExactAlarmSettings();
  }

  async scheduleAlarm(alarm: Alarm): Promise<string> {
    if (!isNativeAlarmModuleAvailable()) {
      throw new Error('Alarm scheduling is not supported on this platform');
    }

    // ALWAYS check permissions before scheduling
    console.log('🔑 Checking permissions before scheduling alarm...');
    const permissionsGranted = await this.ensurePermissions();
    if (!permissionsGranted) {
      const error = new Error('PERMISSIONS_REQUIRED: Notification permissions are required to schedule alarms');
      console.error('❌ Cannot schedule alarm - permissions not granted');
      throw error;
    }

    const fireDate = this.computeNextFireDate(alarm);
    const now = new Date();
    
    // Log alarm scheduling details
    console.log('📅 Scheduling alarm:');
    console.log('   ID:', alarm.id);
    console.log('   Label:', alarm.label || 'No label');
    console.log('   Time:', alarm.timeLocal);
    console.log('   Days:', alarm.daysOfWeek);
    console.log('   Will fire at:', fireDate.toLocaleString());
    console.log('   Time until fire:', Math.round((fireDate.getTime() - now.getTime()) / 1000 / 60), 'minutes');
    
    if (fireDate <= now) {
      console.error('⚠️ WARNING: Fire date is in the past! Alarm will not fire.');
      console.error('   Fire date:', fireDate.toLocaleString());
      console.error('   Current time:', now.toLocaleString());
    }

    const alarmId = await this.ensureNative().scheduleAlarm({
      id: alarm.id,
      fireDateMs: fireDate.getTime(),
      label: alarm.label,
      toneUri: alarm.toneUri,
      volume: alarm.volume,
      vibrate: alarm.vibrate,
      maxSnoozes: alarm.maxSnoozes,
      snoozeLengthMin: alarm.snoozeLengthMin,
      daysOfWeek: alarm.daysOfWeek,
      requireAffirmations: alarm.requireAffirmations,
      requireGoals: alarm.requireGoals,
      randomChallenge: alarm.randomChallenge,
    });

    console.log('✅ Alarm scheduled successfully with ID:', alarmId);
    return alarmId;
  }

  async cancelAlarm(alarmId: string): Promise<void> {
    if (!isNativeAlarmModuleAvailable()) {
      return;
    }
    await this.ensureNative().cancelAlarm(alarmId);
  }

  async cancelAllAlarms(): Promise<void> {
    if (!isNativeAlarmModuleAvailable()) {
      return;
    }
    await this.ensureNative().cancelAllAlarms();
  }

  async getScheduledAlarms(): Promise<NativeScheduledAlarm[]> {
    if (!isNativeAlarmModuleAvailable()) {
      return [];
    }
    return this.ensureNative().getScheduledAlarms();
  }

  private computeNextFireDate(alarm: Alarm): Date {
    const now = new Date();
    const [hour, minute] = alarm.timeLocal.split(':').map(Number);
    const candidate = new Date(now);
    candidate.setSeconds(0, 0);
    candidate.setHours(hour, minute, 0, 0);

    if (alarm.daysOfWeek.length === 0) {
      if (candidate <= now) {
        candidate.setDate(candidate.getDate() + 1);
      }
      return candidate;
    }

    const sortedDays = [...alarm.daysOfWeek].sort((a, b) => a - b);
    const today = now.getDay();

    let minDiff = Number.MAX_SAFE_INTEGER;
    for (const day of sortedDays) {
      let diff = (day - today + 7) % 7;
      const occursToday = diff === 0;
      if (occursToday && candidate <= now) {
        diff = 7;
      }
      if (diff < minDiff) {
        minDiff = diff;
      }
    }

    candidate.setDate(candidate.getDate() + minDiff);
    return candidate;
  }
}

export const alarmScheduler = new AlarmScheduler();
