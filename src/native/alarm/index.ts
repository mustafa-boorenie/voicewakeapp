import { NativeEventEmitter, NativeModules, Platform } from 'react-native';

type AlarmSchedulerEvent = {
  alarmId: string;
  label?: string;
  requireAffirmations: boolean;
  requireGoals: boolean;
  randomChallenge: boolean;
  antiCheatToken: string;
};

type NativeScheduledAlarm = {
  id: string;
  fireDateMs: number;
  label?: string | null;
};

type NotificationPermissionStatus = 
  | 'notDetermined' 
  | 'denied' 
  | 'authorized' 
  | 'provisional' 
  | 'ephemeral' 
  | 'unknown';

type NativeAlarmSchedulerModule = {
  scheduleAlarm(details: Record<string, unknown>): Promise<string>;
  cancelAlarm(alarmId: string): Promise<void>;
  cancelAllAlarms(): Promise<void>;
  getScheduledAlarms(): Promise<NativeScheduledAlarm[]>;
  getNotificationPermissionStatus(): Promise<NotificationPermissionStatus>;
  ensureNotificationPermission(): Promise<boolean>;
  openExactAlarmSettings(): Promise<void>;
  canScheduleExactAlarms(): Promise<boolean>;
  getLastTriggeredAlarm(): Promise<AlarmSchedulerEvent | null>;
};

const nativeModule = NativeModules.AlarmScheduler as NativeAlarmSchedulerModule | undefined;

const emitter = nativeModule
  ? new NativeEventEmitter(NativeModules.AlarmScheduler)
  : undefined;

export function isNativeAlarmModuleAvailable(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

export function getNativeAlarmModule(): NativeAlarmSchedulerModule {
  if (!nativeModule) {
    throw new Error('AlarmScheduler native module is unavailable on this platform');
  }
  return nativeModule;
}

export function addAlarmFiredListener(listener: (event: AlarmSchedulerEvent) => void) {
  if (!emitter) {
    return { remove: () => undefined };
  }
  const subscription = emitter.addListener('alarmFired', listener);
  return {
    remove: () => subscription.remove(),
  };
}

export type { 
  AlarmSchedulerEvent, 
  NativeScheduledAlarm, 
  NativeAlarmSchedulerModule,
  NotificationPermissionStatus 
};

