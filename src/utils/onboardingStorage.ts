import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@onboarding_completed';

/**
 * Get the onboarding status from AsyncStorage
 * @returns Promise<boolean> - true if onboarding is completed, false otherwise
 */
export async function getOnboardingStatus(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error reading onboarding status from AsyncStorage:', error);
    return false;
  }
}

/**
 * Mark onboarding as complete in AsyncStorage
 */
export async function setOnboardingComplete(): Promise<void> {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  } catch (error) {
    console.error('Error setting onboarding status in AsyncStorage:', error);
    throw error;
  }
}

/**
 * Clear onboarding status (useful for testing or reset)
 */
export async function clearOnboardingStatus(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error clearing onboarding status from AsyncStorage:', error);
    throw error;
  }
}

