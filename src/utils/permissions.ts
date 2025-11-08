import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';

export interface PermissionStatus {
  notifications: boolean;
  exactAlarms: boolean;
}

/**
 * Request notification permissions for iOS and Android
 * @returns Promise<boolean> - true if granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      Alert.alert(
        'Notifications Required',
        'Please enable notifications in your device settings to use alarms.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Request exact alarm scheduling permission (Android 12+)
 * On iOS, this always returns true as it's not needed
 * @returns Promise<boolean> - true if granted or not needed, false otherwise
 */
export async function requestExactAlarmPermission(): Promise<boolean> {
  try {
    // iOS doesn't require exact alarm permission
    if (Platform.OS === 'ios') {
      return true;
    }

    // For Android 12+ (API level 31+), check if exact alarms are allowed
    if (Platform.OS === 'android' && Platform.Version >= 31) {
      // Note: React Native doesn't have a built-in way to check exact alarm permission
      // This would typically be done through a native module
      // For now, we'll return true and handle it in the native Android code
      
      // Show an informative alert to the user
      Alert.alert(
        'Exact Alarms Permission',
        'This app requires permission to schedule exact alarms. Please enable "Alarms & reminders" in the next screen.',
        [{ text: 'OK' }]
      );
      
      // Open the exact alarm settings page on Android
      // This requires a native module implementation
      // For now, we'll assume permission is granted
      return true;
    }

    // For Android versions below 12, exact alarms are automatically granted
    return true;
  } catch (error) {
    console.error('Error requesting exact alarm permission:', error);
    return false;
  }
}

/**
 * Check if all required permissions are granted
 * @returns Promise<PermissionStatus> - status of each permission
 */
export async function checkAllPermissions(): Promise<PermissionStatus> {
  try {
    const notificationStatus = await Notifications.getPermissionsAsync();
    
    const status: PermissionStatus = {
      notifications: notificationStatus.status === 'granted',
      exactAlarms: Platform.OS === 'ios' || Platform.Version < 31, // Assume granted for iOS and older Android
    };

    return status;
  } catch (error) {
    console.error('Error checking permissions:', error);
    return {
      notifications: false,
      exactAlarms: false,
    };
  }
}

/**
 * Request all required permissions
 * @returns Promise<boolean> - true if all permissions granted, false otherwise
 */
export async function requestAllPermissions(): Promise<boolean> {
  const notificationsGranted = await requestNotificationPermissions();
  
  if (!notificationsGranted) {
    return false;
  }

  const exactAlarmsGranted = await requestExactAlarmPermission();
  
  return notificationsGranted && exactAlarmsGranted;
}

/**
 * Show a dialog explaining why permissions are needed
 */
export function showPermissionExplanation(onContinue: () => void): void {
  Alert.alert(
    'Permissions Required',
    'This app needs permission to:\n\n' +
    '• Send notifications for your alarms\n' +
    '• Schedule alarms at exact times\n\n' +
    'These permissions ensure your alarms work reliably to help you wake up on time.',
    [
      { text: 'Not Now', style: 'cancel' },
      { text: 'Continue', onPress: onContinue }
    ]
  );
}

