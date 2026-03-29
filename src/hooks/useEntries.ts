import { useState, useCallback } from 'react';
import {
  getAllEntries,
  getEntriesByDateRange,
  insertEntry,
  deleteEntry,
  Entry,
  NewEntry,
} from '../database/db';
import { getWeekRange, getMonthRange } from '../utils/dateHelpers';
import * as FileSystem from 'expo-file-system/legacy';

export type FilterPeriod = 'week' | 'month' | 'all';

export function useEntries() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadEntries = useCallback(async (period: FilterPeriod = 'all') => {
    setLoading(true);
    try {
      let data: Entry[];
      if (period === 'week') {
        const { start, end } = getWeekRange();
        data = await getEntriesByDateRange(start, end);
      } else if (period === 'month') {
        const { start, end } = getMonthRange();
        data = await getEntriesByDateRange(start, end);
      } else {
        data = await getAllEntries();
      }
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const addEntry = useCallback(async (entry: NewEntry): Promise<number> => {
    const id = await insertEntry(entry);
    return id;
  }, []);

  const removeEntry = useCallback(async (id: number, photoUri: string) => {
    await deleteEntry(id);
    // Delete photo file from local storage
    try {
      const info = await FileSystem.getInfoAsync(photoUri);
      if (info.exists) {
        await FileSystem.deleteAsync(photoUri);
      }
    } catch {
      // ignore file deletion errors
    }
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return { entries, loading, loadEntries, addEntry, removeEntry };
}
