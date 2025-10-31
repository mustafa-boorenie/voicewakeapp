import { createNavigationContainerRef } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  MIOnboarding: undefined;
  AlarmTrigger: {
    alarmId: string;
    requireAffirmations: boolean;
    requireGoals: boolean;
    randomChallenge: boolean;
    label?: string;
  };
  CreateAlarm: undefined;
  EditAlarm: { alarmId: string } | undefined;
  GoalsAffirmations: undefined;
};

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate<Name extends keyof RootStackParamList>(
  name: Name,
  params?: RootStackParamList[Name]
) {
  if (navigationRef.isReady()) {
    // React Navigation's typing is narrower than our helper usage, so we intentionally bypass here.
    (navigationRef as unknown as { navigate: (routeName: string, args?: unknown) => void }).navigate(
      name as string,
      params
    );
  }
}

