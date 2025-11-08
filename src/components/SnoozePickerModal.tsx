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

export const SNOOZE_OPTIONS = [5, 9, 10, 15];

interface SnoozePickerModalProps {
  visible: boolean;
  selectedValue: number;
  onSelect: (value: number) => void;
  onClose: () => void;
}

export function SnoozePickerModal({
  visible,
  selectedValue,
  onSelect,
  onClose,
}: SnoozePickerModalProps) {
  const handleSelect = (value: number) => {
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
              <Text style={styles.title}>Select Snooze Length</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeText}>Done</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {SNOOZE_OPTIONS.map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  style={[
                    styles.option,
                    selectedValue === minutes && styles.optionSelected,
                  ]}
                  onPress={() => handleSelect(minutes)}
                  accessibilityRole="button"
                  accessibilityLabel={`Select ${minutes} minutes`}
                >
                  <Text
                    style={[
                      styles.optionText,
                      selectedValue === minutes && styles.optionTextSelected,
                    ]}
                  >
                    {minutes} minutes
                  </Text>
                  {selectedValue === minutes && (
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
    maxHeight: 300,
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

