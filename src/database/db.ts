import * as SQLite from 'expo-sqlite';

export interface Entry {
  id: number;
  photo_uri: string;
  amount: number;
  category: string;
  note: string;
  created_at: string;
}

export type NewEntry = Omit<Entry, 'id'>;

let db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('lockey.db');
    await initDatabase(db);
  }
  return db;
}

async function initDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      photo_uri TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      note TEXT DEFAULT '',
      created_at TEXT NOT NULL
    );
  `);
}

export async function insertEntry(entry: NewEntry): Promise<number> {
  const database = await getDatabase();
  const result = await database.runAsync(
    `INSERT INTO entries (photo_uri, amount, category, note, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [entry.photo_uri, entry.amount, entry.category, entry.note, entry.created_at]
  );
  return result.lastInsertRowId;
}

export async function getAllEntries(): Promise<Entry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Entry>(
    `SELECT * FROM entries ORDER BY created_at DESC`
  );
  return rows;
}

export async function getEntriesByDateRange(
  startDate: string,
  endDate: string
): Promise<Entry[]> {
  const database = await getDatabase();
  const rows = await database.getAllAsync<Entry>(
    `SELECT * FROM entries WHERE created_at >= ? AND created_at <= ? ORDER BY created_at DESC`,
    [startDate, endDate]
  );
  return rows;
}

export async function getEntryById(id: number): Promise<Entry | null> {
  const database = await getDatabase();
  const row = await database.getFirstAsync<Entry>(
    `SELECT * FROM entries WHERE id = ?`,
    [id]
  );
  return row ?? null;
}

export async function deleteEntry(id: number): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM entries WHERE id = ?`, [id]);
}

export async function clearAllEntries(): Promise<void> {
  const database = await getDatabase();
  await database.runAsync(`DELETE FROM entries`);
}
