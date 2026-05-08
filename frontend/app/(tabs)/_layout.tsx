import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '../../src/components/BottomTabBar';
import { Colors } from '../../src/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="receipts" options={{ title: 'Receipts' }} />
      <Tabs.Screen name="deadlines" options={{ title: 'Deadlines' }} />
      <Tabs.Screen name="spending" options={{ title: 'Spending' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
