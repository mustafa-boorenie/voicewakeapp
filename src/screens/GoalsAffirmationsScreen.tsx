import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { initDatabase } from '../db/schema';
import { Goal, Affirmation } from '../types';
import { GradientCard } from '../components/GradientCard';

export function GoalsAffirmationsScreen({ navigation }: any) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [affirmations, setAffirmations] = useState<Affirmation[]>([]);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingAffirmationId, setEditingAffirmationId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(true);
  const userId = 'user_default';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const db = await initDatabase();
      
      const userResult = await db.getFirstAsync(
        'SELECT * FROM user_profiles WHERE id = ?',
        [userId]
      ) as any;

      if (!userResult) {
        await db.runAsync(
          'INSERT INTO user_profiles (id, name, timezone, created_at) VALUES (?, ?, ?, ?)',
          [userId, 'User', 'America/New_York', new Date().toISOString()]
        );
      }

      const goalsResults = await db.getAllAsync(
        'SELECT * FROM goals WHERE user_id = ? ORDER BY last_edited_at DESC',
        [userId]
      ) as any[];

      const loadedGoals: Goal[] = goalsResults.map(row => ({
        id: row.id,
        userId: row.user_id,
        text: row.text,
        why: row.why,
        barriers: JSON.parse(row.barriers),
        supports: JSON.parse(row.supports),
        lastEditedAt: row.last_edited_at,
      }));

      const affirmationsResults = await db.getAllAsync(
        'SELECT * FROM affirmations WHERE user_id = ? AND active = 1 ORDER BY last_edited_at DESC',
        [userId]
      ) as any[];

      const loadedAffirmations: Affirmation[] = affirmationsResults.map(row => ({
        id: row.id,
        userId: row.user_id,
        text: row.text,
        active: row.active === 1,
        lastEditedAt: row.last_edited_at,
      }));

      setGoals(loadedGoals);
      setAffirmations(loadedAffirmations);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load goals and affirmations');
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    const newGoalText = 'New goal - tap to edit';
    try {
      const db = await initDatabase();
      const id = `goal_${Date.now()}`;
      const now = new Date().toISOString();

      await db.runAsync(
        'INSERT INTO goals (id, user_id, text, why, barriers, supports, last_edited_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, userId, newGoalText, '', JSON.stringify([]), JSON.stringify([]), now]
      );

      await loadData();
    } catch (error) {
      console.error('Error adding goal:', error);
      Alert.alert('Error', 'Failed to add goal');
    }
  };

  const handleAddAffirmation = async () => {
    const newAffirmationText = 'New affirmation - tap to edit';
    try {
      const db = await initDatabase();
      const id = `affirmation_${Date.now()}`;
      const now = new Date().toISOString();

      await db.runAsync(
        'INSERT INTO affirmations (id, user_id, text, active, last_edited_at) VALUES (?, ?, ?, ?, ?)',
        [id, userId, newAffirmationText, 1, now]
      );

      await loadData();
    } catch (error) {
      console.error('Error adding affirmation:', error);
      Alert.alert('Error', 'Failed to add affirmation');
    }
  };

  const startEditingGoal = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setEditText(goal.text);
  };

  const startEditingAffirmation = (affirmation: Affirmation) => {
    setEditingAffirmationId(affirmation.id);
    setEditText(affirmation.text);
  };

  const saveGoalEdit = async () => {
    if (!editingGoalId) return;

    try {
      const db = await initDatabase();
      const now = new Date().toISOString();

      await db.runAsync(
        'UPDATE goals SET text = ?, last_edited_at = ? WHERE id = ?',
        [editText.trim(), now, editingGoalId]
      );

      setEditingGoalId(null);
      setEditText('');
      await loadData();
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    }
  };

  const saveAffirmationEdit = async () => {
    if (!editingAffirmationId) return;

    try {
      const db = await initDatabase();
      const now = new Date().toISOString();

      await db.runAsync(
        'UPDATE affirmations SET text = ?, last_edited_at = ? WHERE id = ?',
        [editText.trim(), now, editingAffirmationId]
      );

      setEditingAffirmationId(null);
      setEditText('');
      await loadData();
    } catch (error) {
      console.error('Error saving affirmation:', error);
      Alert.alert('Error', 'Failed to save affirmation');
    }
  };

  const cancelEdit = () => {
    setEditingGoalId(null);
    setEditingAffirmationId(null);
    setEditText('');
  };

  const deleteGoal = (goalId: string) => {
    Alert.alert(
      'Delete Goal',
      'Are you sure you want to delete this goal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await initDatabase();
              await db.runAsync('DELETE FROM goals WHERE id = ?', [goalId]);
              await loadData();
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal');
            }
          },
        },
      ]
    );
  };

  const deleteAffirmation = (affirmationId: string) => {
    Alert.alert(
      'Delete Affirmation',
      'Are you sure you want to delete this affirmation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = await initDatabase();
              await db.runAsync('DELETE FROM affirmations WHERE id = ?', [affirmationId]);
              await loadData();
            } catch (error) {
              console.error('Error deleting affirmation:', error);
              Alert.alert('Error', 'Failed to delete affirmation');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Goals & Affirmations</Text>
          <Text style={styles.subtitle}>Shape your future, one thought at a time</Text>
        </View>

        {/* Goals Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="flag" size={24} color="#6B4CE6" />
              <Text style={styles.sectionTitle}>My Goals</Text>
            </View>
            <TouchableOpacity
              onPress={handleAddGoal}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Add new goal"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="flag-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No goals yet</Text>
              <Text style={styles.emptyText}>Tap the + button to add your first goal</Text>
            </View>
          ) : (
            goals.map(goal => (
              <GradientCard
                key={goal.id}
                colors={['#E8D5FF', '#D5C6FF', '#C6B7FF']}
                style={styles.itemCard}
              >
                {editingGoalId === goal.id ? (
                  <View>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      autoFocus
                      placeholder="Enter your goal..."
                      placeholderTextColor="#999"
                      accessibilityLabel="Edit goal text"
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        onPress={saveGoalEdit}
                        style={styles.saveButton}
                        accessibilityRole="button"
                        accessibilityLabel="Save goal changes"
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={cancelEdit}
                        style={styles.cancelButton}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel editing"
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.itemRow}>
                    <TouchableOpacity
                      onPress={() => startEditingGoal(goal)}
                      accessibilityRole="button"
                      accessibilityLabel={`Goal: ${goal.text}`}
                      accessibilityHint="Tap to edit"
                      style={styles.itemContentTouchable}
                    >
                      <View style={styles.itemContent}>
                        <Ionicons name="flag" size={18} color="#6B4CE6" style={styles.itemIcon} />
                        <Text style={styles.itemText}>{goal.text}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteGoal(goal.id)}
                      style={styles.deleteButton}
                      accessibilityRole="button"
                      accessibilityLabel="Delete goal"
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                )}
              </GradientCard>
            ))
          )}
        </View>

        {/* Affirmations Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Ionicons name="sparkles" size={24} color="#6B4CE6" />
              <Text style={styles.sectionTitle}>Affirmations</Text>
            </View>
            <TouchableOpacity
              onPress={handleAddAffirmation}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Add new affirmation"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {affirmations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="sparkles-outline" size={48} color="#E0E0E0" />
              <Text style={styles.emptyTitle}>No affirmations yet</Text>
              <Text style={styles.emptyText}>Start with a positive thought</Text>
            </View>
          ) : (
            affirmations.map(affirmation => (
              <GradientCard
                key={affirmation.id}
                colors={['#FFE5D9', '#FFD7C4', '#FFC9AF']}
                style={styles.itemCard}
              >
                {editingAffirmationId === affirmation.id ? (
                  <View>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      autoFocus
                      placeholder="Enter your affirmation..."
                      placeholderTextColor="#999"
                      accessibilityLabel="Edit affirmation text"
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        onPress={saveAffirmationEdit}
                        style={styles.saveButton}
                        accessibilityRole="button"
                        accessibilityLabel="Save affirmation changes"
                      >
                        <Ionicons name="checkmark" size={20} color="#fff" />
                        <Text style={styles.saveButtonText}>Save</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={cancelEdit}
                        style={styles.cancelButton}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel editing"
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.itemRow}>
                    <TouchableOpacity
                      onPress={() => startEditingAffirmation(affirmation)}
                      accessibilityRole="button"
                      accessibilityLabel={`Affirmation: ${affirmation.text}`}
                      accessibilityHint="Tap to edit"
                      style={styles.itemContentTouchable}
                    >
                      <View style={styles.itemContent}>
                        <Ionicons name="sparkles" size={18} color="#6B4CE6" style={styles.itemIcon} />
                        <Text style={styles.itemText}>{affirmation.text}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => deleteAffirmation(affirmation.id)}
                      style={styles.deleteButton}
                      accessibilityRole="button"
                      accessibilityLabel="Delete affirmation"
                    >
                      <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                    </TouchableOpacity>
                  </View>
                )}
              </GradientCard>
            ))
          )}
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color="#6B4CE6" />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>How it works</Text>
            <Text style={styles.infoText}>
              Your goals and affirmations will be used during alarm wake-up challenges to help you start your day with intention.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  // Header Styles
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 16,
    color: '#7D7D7D',
    lineHeight: 22,
  },
  // Section Styles
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  addButton: {
    backgroundColor: '#6B4CE6',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6B4CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  // Empty State Styles
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#5D5D5D',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9D9D9D',
    textAlign: 'center',
  },
  // Item Card Styles
  itemCard: {
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemContentTouchable: {
    flex: 1,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  itemIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  itemText: {
    flex: 1,
    fontSize: 16,
    color: '#2D2D2D',
    lineHeight: 24,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Edit Mode Styles
  editInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#6B4CE6',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2D2D2D',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#6B4CE6',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: '#6B4CE6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cancelButtonText: {
    color: '#5D5D5D',
    fontSize: 16,
    fontWeight: '600',
  },
  // Info Card Styles
  infoCard: {
    backgroundColor: '#F5F0FF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8DBFF',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#5D5D5D',
    lineHeight: 20,
  },
});
