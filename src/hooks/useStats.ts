import { useMemo } from 'react';
import { Entry } from '../database/db';
import {
  getDaysInCurrentWeek,
  formatDayLabel,
  isSameDayAs,
} from '../utils/dateHelpers';
import { parseISO, getMonth, getYear, startOfMonth } from 'date-fns';
import { CATEGORY_COLORS } from '../constants/theme';

export interface WeeklyChartData {
  labels: string[];
  datasets: { data: number[] }[];
}

export interface CategoryChartData {
  name: string;
  amount: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

export interface StatsData {
  totalWeek: number;
  totalMonth: number;
  topCategory: string;
  weeklyChart: WeeklyChartData;
  categoryChart: CategoryChartData[];
}

export function useStats(entries: Entry[]): StatsData {
  return useMemo(() => {
    const now = new Date();
    const currentMonth = getMonth(now);
    const currentYear = getYear(now);

    const weekDays = getDaysInCurrentWeek();

    // Weekly total
    const weekEntries = entries.filter((e) =>
      weekDays.some((day) => isSameDayAs(e.created_at, day))
    );
    const totalWeek = weekEntries.reduce((sum, e) => sum + e.amount, 0);

    // Monthly total
    const monthEntries = entries.filter((e) => {
      const d = parseISO(e.created_at);
      return getMonth(d) === currentMonth && getYear(d) === currentYear;
    });
    const totalMonth = monthEntries.reduce((sum, e) => sum + e.amount, 0);

    // Top category (by month)
    const categoryTotals: Record<string, number> = {};
    for (const e of monthEntries) {
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
    }
    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';

    // Weekly bar chart
    const weeklyAmounts = weekDays.map((day) =>
      entries
        .filter((e) => isSameDayAs(e.created_at, day))
        .reduce((sum, e) => sum + e.amount, 0)
    );
    const weeklyChart: WeeklyChartData = {
      labels: weekDays.map(formatDayLabel),
      datasets: [{ data: weeklyAmounts.map((v) => (v === 0 ? 0.001 : v)) }],
    };

    // Category pie chart (monthly)
    const categoryChart: CategoryChartData[] = Object.entries(categoryTotals)
      .filter(([, v]) => v > 0)
      .map(([name, amount]) => ({
        name,
        amount,
        color: CATEGORY_COLORS[name] || '#6B7280',
        legendFontColor: '#A0A0A0',
        legendFontSize: 12,
      }));

    return { totalWeek, totalMonth, topCategory, weeklyChart, categoryChart };
  }, [entries]);
}
