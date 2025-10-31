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
};

export class AlarmScheduler {
  private native = getNativeAlarmModule();

  constructor() {
    if (!isNativeAlarmModuleAvailable()) {
      console.warn('AlarmScheduler: native module unavailable on this platform');
    }
  }

  addAlarmFiredListener(listener: AlarmFiredListener) {
    return addAlarmFiredListener(listener);
  }

  async consumePendingAlarm(): Promise<AlarmSchedulerEvent | null> {
    return this.native.getLastTriggeredAlarm();
  }

  async ensurePermissions(): Promise<boolean> {
    const notificationsGranted = await this.native.ensureNotificationPermission();
    if (!notificationsGranted) {
      return false;
    }

    if (Platform.OS === 'android') {
      const canScheduleExact = await this.native.canScheduleExactAlarms();
      if (!canScheduleExact) {
        return false;
      }
    }

    return true;
  }

  async openAlarmSettings(): Promise<void> {
    await this.native.openExactAlarmSettings();
  }

  async scheduleAlarm(alarm: Alarm): Promise<string> {
    if (!isNativeAlarmModuleAvailable()) {
      throw new Error('Alarm scheduling is not supported on this platform');
    }

    const permissionsGranted = await this.ensurePermissions();
    if (!permissionsGranted) {
      throw new Error('Required alarm permissions not granted');
    }

    const fireDate = this.computeNextFireDate(alarm);

    const alarmId = await this.native.scheduleAlarm({
      id: alarm.id,
      fireDateMs: fireDate.getTime(),
      label: alarm.label,
      requireAffirmations: alarm.requireAffirmations,
      requireGoals: alarm.requireGoals,
      randomChallenge: alarm.randomChallenge,
    });

    return alarmId;
  }

  async cancelAlarm(alarmId: string): Promise<void> {
    if (!isNativeAlarmModuleAvailable()) {
      return;
    }
    await this.native.cancelAlarm(alarmId);
  }

  async cancelAllAlarms(): Promise<void> {
    if (!isNativeAlarmModuleAvailable()) {
      return;
    }
    await this.native.cancelAllAlarms();
  }

  async getScheduledAlarms(): Promise<NativeScheduledAlarm[]> {
    if (!isNativeAlarmModuleAvailable()) {
      return [];
    }
    return this.native.getScheduledAlarms();
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
