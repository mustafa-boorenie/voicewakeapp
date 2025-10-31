import { Alarm } from '../../types';
import * as Notifications from 'expo-notifications';

export class AlarmScheduler {
  constructor() {
    this.configureNotifications();
  }

  private configureNotifications() {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }

  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async scheduleAlarm(alarm: Alarm): Promise<string> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error('Notification permissions not granted');
    }

    const [hours, minutes] = alarm.timeLocal.split(':').map(Number);
    
    let trigger: any;
    
    if (alarm.daysOfWeek.length === 0) {
      const alarmDate = new Date();
      alarmDate.setHours(hours, minutes, 0, 0);
      
      if (alarmDate <= new Date()) {
        alarmDate.setDate(alarmDate.getDate() + 1);
      }
      
      trigger = alarmDate;
    } else {
      trigger = {
        hour: hours,
        minute: minutes,
        repeats: true,
      };
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: alarm.label || 'Affirmation Alarm',
        body: 'Time to speak your affirmations and goals!',
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        vibrate: alarm.vibrate ? [0, 250, 250, 250] : undefined,
        data: {
          alarmId: alarm.id,
          requireAffirmations: alarm.requireAffirmations,
          requireGoals: alarm.requireGoals,
          randomChallenge: alarm.randomChallenge,
        },
      },
      trigger,
    });

    console.log(`Alarm scheduled: ${notificationId}`);
    return notificationId;
  }

  async cancelAlarm(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`Alarm cancelled: ${notificationId}`);
  }

  async cancelAllAlarms(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All alarms cancelled');
  }

  async getScheduledAlarms(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  addNotificationListener(
    callback: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseListener(
    callback: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export const alarmScheduler = new AlarmScheduler();
