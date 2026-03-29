import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { COLORS, SPACING } from '../constants/theme';
import { WeeklyChartData, CategoryChartData } from '../hooks/useStats';
import { Currency } from '../utils/formatCurrency';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.md * 2;

const chartConfig = {
  backgroundColor: COLORS.card,
  backgroundGradientFrom: COLORS.card,
  backgroundGradientTo: COLORS.card,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`,
  labelColor: () => COLORS.textSecondary,
  style: { borderRadius: 12 },
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: COLORS.border,
    strokeWidth: 1,
  },
  barPercentage: 0.6,
};

interface BarProps {
  data: WeeklyChartData;
  currency: Currency;
}

export function WeeklyBarChart({ data, currency }: BarProps) {
  const hasData = data.datasets[0].data.some((v) => v > 0.001);
  if (!hasData) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No spending this week</Text>
      </View>
    );
  }

  return (
    <BarChart
      data={data}
      width={CHART_WIDTH}
      height={180}
      chartConfig={chartConfig}
      style={styles.chart}
      showValuesOnTopOfBars={false}
      withInnerLines={true}
      fromZero
      yAxisLabel={currency === 'VND' ? '₫' : '$'}
      yAxisSuffix=""
    />
  );
}

interface PieProps {
  data: CategoryChartData[];
}

export function CategoryPieChart({ data }: PieProps) {
  if (data.length === 0) {
    return (
      <View style={styles.emptyChart}>
        <Text style={styles.emptyText}>No spending this month</Text>
      </View>
    );
  }

  return (
    <PieChart
      data={data}
      width={CHART_WIDTH}
      height={180}
      chartConfig={chartConfig}
      accessor="amount"
      backgroundColor="transparent"
      paddingLeft="16"
      absolute={false}
    />
  );
}

const styles = StyleSheet.create({
  chart: {
    borderRadius: 12,
  },
  emptyChart: {
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
