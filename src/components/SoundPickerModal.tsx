import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export const ALARM_SOUNDS = [
  { label: 'Gentle Chime', value: 'default' },
  { label: 'Classic Bell', value: 'bell' },
  { label: 'Ocean Waves', value: 'ocean' },
  { label: 'Bird Song', value: 'birds' },
];

interface SoundPickerModalProps {
  visible: boolean;
  selectedValue: string;
  onSelect: (value: string) => void;
  onClose: () => void;
}

export function SoundPickerModal({
  visible,
  selectedValue,
  onSelect,
  onClose,
}: SoundPickerModalProps) {
  const handleSelect = (value: string) => {
    onSelect(value);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <SafeAreaView edges={['bottom']} style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Alarm Sound</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {ALARM_SOUNDS.map((sound) => (
                <TouchableOpacity
                  key={sound.value}
                  style={[
                    styles.option,
                    selectedValue === sound.value && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(sound.value)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${sound.label}`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === sound.value && styles.optionTextSelected,
                    ]}
                  >
                    {sound.label}
                  </Text>
                  {selectedValue === sound.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: 'transparent',
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 16,
    color: '#7C3AED',
    fontWeight: '600',
  },
  scrollView: {
    maxHeight: 400,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  optionSelected: {
    backgroundColor: '#F5F0FF',
  },
  optionText: {
    fontSize: 16,
    color: '#2D2D2D',
  },
  optionTextSelected: {
    color: '#7C3AED',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#7C3AED',
    fontWeight: 'bold',
  },
});

