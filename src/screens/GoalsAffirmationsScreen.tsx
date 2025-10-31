import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { initDatabase } from '../db/schema';
import { Goal, Affirmation } from '../types';

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
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} accessibilityRole="header">
          Goals & Affirmations
        </Text>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Goals</Text>
            <TouchableOpacity
              onPress={handleAddGoal}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Add new goal"
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {goals.length === 0 ? (
            <Text style={styles.emptyText}>No goals yet. Add one to get started!</Text>
          ) : (
            goals.map(goal => (
              <View key={goal.id} style={styles.itemCard}>
                {editingGoalId === goal.id ? (
                  <View>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      autoFocus
                      accessibilityLabel="Edit goal text"
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        onPress={saveGoalEdit}
                        style={styles.saveButton}
                        accessibilityRole="button"
                        accessibilityLabel="Save goal changes"
                      >
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
                  <View>
                    <TouchableOpacity
                      onPress={() => startEditingGoal(goal)}
                      onLongPress={() => deleteGoal(goal.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Goal: ${goal.text}`}
                      accessibilityHint="Tap to edit, long press to delete"
                    >
                      <Text style={styles.itemText}>{goal.text}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Affirmations</Text>
            <TouchableOpacity
              onPress={handleAddAffirmation}
              style={styles.addButton}
              accessibilityRole="button"
              accessibilityLabel="Add new affirmation"
            >
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {affirmations.length === 0 ? (
            <Text style={styles.emptyText}>No affirmations yet. Add one to get started!</Text>
          ) : (
            affirmations.map(affirmation => (
              <View key={affirmation.id} style={styles.itemCard}>
                {editingAffirmationId === affirmation.id ? (
                  <View>
                    <TextInput
                      style={styles.editInput}
                      value={editText}
                      onChangeText={setEditText}
                      multiline
                      autoFocus
                      accessibilityLabel="Edit affirmation text"
                    />
                    <View style={styles.editButtons}>
                      <TouchableOpacity
                        onPress={saveAffirmationEdit}
                        style={styles.saveButton}
                        accessibilityRole="button"
                        accessibilityLabel="Save affirmation changes"
                      >
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
                  <View>
                    <TouchableOpacity
                      onPress={() => startEditingAffirmation(affirmation)}
                      onLongPress={() => deleteAffirmation(affirmation.id)}
                      accessibilityRole="button"
                      accessibilityLabel={`Affirmation: ${affirmation.text}`}
                      accessibilityHint="Tap to edit, long press to delete"
                    >
                      <Text style={styles.itemText}>{affirmation.text}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a2e',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a2e',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 32,
  },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemText: {
    fontSize: 16,
    color: '#1a1a2e',
    lineHeight: 24,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  editButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});
