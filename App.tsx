import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

import { COLORS, SPACING, BORDER_RADIUS } from './src/constants/theme';
import { getDatabase } from './src/database/db';
import { Currency } from './src/utils/formatCurrency';

import OnboardingScreen from './src/screens/OnboardingScreen';
import CaptureScreen from './src/screens/CaptureScreen';
import GalleryScreen from './src/screens/GalleryScreen';
import StatsScreen from './src/screens/StatsScreen';
import EntryDetailScreen from './src/screens/EntryDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const GalleryStack = createStackNavigator();
const StatsStack = createStackNavigator();

const NavTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.text,
    border: COLORS.border,
    primary: COLORS.accent,
    notification: COLORS.accent,
  },
};

function GalleryNavigator({
  currency,
  onSettingsChange,
  onDataCleared,
}: {
  currency: Currency;
  onSettingsChange: (c: Currency) => void;
  onDataCleared: () => void;
}) {
  return (
    <GalleryStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <GalleryStack.Screen
        name="GalleryMain"
        options={{
          title: 'Gallery',
          headerRight: () => (
            <Text
              style={styles.settingsIcon}
              onPress={() => {}}
            >
              {/* Settings accessible via Stats tab */}
            </Text>
          ),
        }}
      >
        {() => <GalleryScreen currency={currency} />}
      </GalleryStack.Screen>
      <GalleryStack.Screen
        name="EntryDetail"
        options={{ title: 'Entry Detail' }}
        component={EntryDetailScreen}
      />
    </GalleryStack.Navigator>
  );
}

function StatsNavigator({
  currency,
  onCurrencyChange,
  onDataCleared,
}: {
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  onDataCleared: () => void;
}) {
  return (
    <StatsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.surface },
        headerTintColor: COLORS.text,
        headerTitleStyle: { fontWeight: '700' },
        cardStyle: { backgroundColor: COLORS.background },
      }}
    >
      <StatsStack.Screen
        name="StatsMain"
        options={({ navigation }) => ({
          title: 'Stats',
          headerRight: () => (
            <Text
              style={styles.settingsIcon}
              onPress={() => navigation.navigate('Settings')}
            >
              ⚙️
            </Text>
          ),
        })}
      >
        {() => <StatsScreen currency={currency} />}
      </StatsStack.Screen>
      <StatsStack.Screen
        name="EntryDetail"
        options={{ title: 'Entry Detail' }}
        component={EntryDetailScreen}
      />
      <StatsStack.Screen name="Settings" options={{ title: 'Settings' }}>
        {() => (
          <SettingsScreen
            currency={currency}
            onCurrencyChange={onCurrencyChange}
            onDataCleared={onDataCleared}
          />
        )}
      </StatsStack.Screen>
    </StatsStack.Navigator>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currency, setCurrency] = useState<Currency>('VND');

  useEffect(() => {
    async function init() {
      try {
        await getDatabase();
        const [onboarded, savedCurrency] = await Promise.all([
          AsyncStorage.getItem('onboarding_complete'),
          AsyncStorage.getItem('currency'),
        ]);
        setShowOnboarding(!onboarded);
        if (savedCurrency === 'USD' || savedCurrency === 'VND') {
          setCurrency(savedCurrency);
        }
      } finally {
        setReady(true);
      }
    }
    init();
  }, []);

  async function handleCurrencyChange(c: Currency) {
    setCurrency(c);
    await AsyncStorage.setItem('currency', c);
  }

  async function handleDataCleared() {
    // force re-render of stats/gallery by updating key
    setCurrency((c) => c);
  }

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashLogo}>Lockey</Text>
        <Text style={styles.splashSub}>📷 + 💸</Text>
      </View>
    );
  }

  if (showOnboarding) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onDone={() => setShowOnboarding(false)} />
      </SafeAreaProvider>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={NavTheme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: false,
              tabBarStyle: styles.tabBar,
              tabBarActiveTintColor: COLORS.accent,
              tabBarInactiveTintColor: COLORS.textMuted,
              tabBarLabelStyle: styles.tabLabel,
              tabBarIcon: ({ focused }) => {
                const icons: Record<string, string> = {
                  Capture: '📷',
                  Gallery: '🖼️',
                  Stats: '📊',
                };
                const icon = icons[route.name] || '●';
                return (
                  <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
                    {icon}
                  </Text>
                );
              },
            })}
          >
            <Tab.Screen name="Capture">
              {() => (
                <View style={{ flex: 1 }}>
                  <CaptureScreen currency={currency} />
                </View>
              )}
            </Tab.Screen>
            <Tab.Screen name="Gallery">
              {() => (
                <GalleryNavigator
                  currency={currency}
                  onSettingsChange={handleCurrencyChange}
                  onDataCleared={handleDataCleared}
                />
              )}
            </Tab.Screen>
            <Tab.Screen name="Stats">
              {() => (
                <StatsNavigator
                  currency={currency}
                  onCurrencyChange={handleCurrencyChange}
                  onDataCleared={handleDataCleared}
                />
              )}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  splashLogo: {
    fontSize: 48,
    fontWeight: '800',
    color: COLORS.accent,
    letterSpacing: -2,
  },
  splashSub: {
    fontSize: 28,
  },
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIcon: {
    fontSize: 22,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  settingsIcon: {
    fontSize: 20,
    paddingRight: SPACING.md,
  },
});
