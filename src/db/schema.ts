import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'affirmation_alarm.db';

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS user_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      timezone TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      why TEXT NOT NULL,
      barriers TEXT NOT NULL,
      supports TEXT NOT NULL,
      last_edited_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS affirmations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      text TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1,
      last_edited_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS alarms (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      time_local TEXT NOT NULL,
      days_of_week TEXT NOT NULL,
      volume REAL NOT NULL DEFAULT 0.8,
      tone_uri TEXT NOT NULL,
      vibrate INTEGER NOT NULL DEFAULT 1,
      max_snoozes INTEGER NOT NULL DEFAULT 3,
      snooze_length_min INTEGER NOT NULL DEFAULT 9,
      require_affirmations INTEGER NOT NULL DEFAULT 1,
      require_goals INTEGER NOT NULL DEFAULT 1,
      random_challenge INTEGER NOT NULL DEFAULT 0,
      enabled INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS alarm_runs (
      id TEXT PRIMARY KEY,
      alarm_id TEXT NOT NULL,
      fired_at TEXT NOT NULL,
      dismissed_at TEXT,
      snoozes_used INTEGER NOT NULL DEFAULT 0,
      success INTEGER NOT NULL DEFAULT 0,
      transcript_json TEXT NOT NULL,
      similarity_scores TEXT NOT NULL,
      cheat_flags TEXT NOT NULL,
      FOREIGN KEY (alarm_id) REFERENCES alarms(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS streaks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      current INTEGER NOT NULL DEFAULT 0,
      best INTEGER NOT NULL DEFAULT 0,
      last_completion_date TEXT,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      stt_mode TEXT NOT NULL DEFAULT 'onDevice',
      challenge_word_count INTEGER NOT NULL DEFAULT 1,
      min_similarity REAL NOT NULL DEFAULT 0.72,
      ambient_threshold_db REAL NOT NULL DEFAULT -40.0
    );

    CREATE INDEX IF NOT EXISTS idx_alarms_enabled ON alarms(enabled);
    CREATE INDEX IF NOT EXISTS idx_alarm_runs_alarm_id ON alarm_runs(alarm_id);
    CREATE INDEX IF NOT EXISTS idx_alarm_runs_fired_at ON alarm_runs(fired_at);
    CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
    CREATE INDEX IF NOT EXISTS idx_affirmations_user_id ON affirmations(user_id);
  `);

  return db;
}

export async function getOrCreateDefaultSettings(db: SQLite.SQLiteDatabase): Promise<any> {
  const result = await db.getFirstAsync('SELECT * FROM settings LIMIT 1');
  
  if (!result) {
    const id = `settings_${Date.now()}`;
    await db.runAsync(
      `INSERT INTO settings (id, stt_mode, challenge_word_count, min_similarity, ambient_threshold_db)
       VALUES (?, ?, ?, ?, ?)`,
      [id, 'onDevice', 1, 0.72, -40.0]
    );
    return await db.getFirstAsync('SELECT * FROM settings WHERE id = ?', [id]);
  }
  
  return result;
}
