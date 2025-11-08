import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GradientCard } from './GradientCard';
import { requestAllPermissions } from '../utils/permissions';

interface PermissionRequestCardProps {
  onPermissionsGranted: () => void;
  onSkip?: () => void;
}

export function PermissionRequestCard({ onPermissionsGranted, onSkip }: PermissionRequestCardProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestPermissions = async () => {
    setIsRequesting(true);
    
    try {
      const granted = await requestAllPermissions();
      
      if (granted) {
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="notifications" size={48} color="#6B4CE6" />
        </View>
        <Text style={styles.title}>Enable Alarms</Text>
        <Text style={styles.subtitle}>
          To wake you up reliably, we need a few permissions
        </Text>
      </View>

      {/* Permission Cards */}
      <View style={styles.permissionsContainer}>
        <GradientCard
          colors={['#E8D5FF', '#D5C6FF', '#F5F0FF']}
          style={styles.permissionCard}
        >
          <View style={styles.permissionIcon}>
            <Ionicons name="notifications-outline" size={28} color="#6B4CE6" />
          </View>
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Notifications</Text>
            <Text style={styles.permissionDescription}>
              Alert you when it's time to wake up
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#6B4CE6" />
        </GradientCard>

        <GradientCard
          colors={['#FFE5D9', '#FFD7C4', '#FFF5F0']}
          style={styles.permissionCard}
        >
          <View style={styles.permissionIcon}>
            <Ionicons name="time-outline" size={28} color="#6B4CE6" />
          </View>
          <View style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Exact Alarms</Text>
            <Text style={styles.permissionDescription}>
              Ensure alarms trigger at the right time
            </Text>
          </View>
          <Ionicons name="checkmark-circle" size={24} color="#6B4CE6" />
        </GradientCard>
      </View>

      {/* Info Text */}
      <View style={styles.infoCard}>
        <Ionicons name="shield-checkmark-outline" size={20} color="#4CAF50" />
        <Text style={styles.infoText}>
          Your privacy matters. These permissions are only used for alarm functionality.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.grantButton, isRequesting && styles.buttonDisabled]}
          onPress={handleRequestPermissions}
          disabled={isRequesting}
          accessibilityRole="button"
          accessibilityLabel="Grant permissions"
        >
          {isRequesting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark" size={24} color="#fff" />
              <Text style={styles.grantButtonText}>Grant Permissions</Text>
            </>
          )}
        </TouchableOpacity>

        {onSkip && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            accessibilityRole="button"
            accessibilityLabel="Skip for now"
          >
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  // Header Styles
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F5F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#5D5D5D',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  // Permissions Container
  permissionsContainer: {
    marginBottom: 24,
    gap: 12,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 4,
  },
  permissionDescription: {
    fontSize: 14,
    color: '#5D5D5D',
    lineHeight: 20,
  },
  // Info Card
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0F9F4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#C8E6D0',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#2D5D3A',
    lineHeight: 20,
  },
  // Button Styles
  buttonContainer: {
    gap: 12,
  },
  grantButton: {
    backgroundColor: '#6B4CE6',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#6B4CE6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  grantButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7D7D7D',
  },
});

