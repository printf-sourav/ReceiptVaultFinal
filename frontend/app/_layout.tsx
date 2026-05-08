import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  DMSans_400Regular,
  DMSans_500Medium,
} from '@expo-google-fonts/dm-sans';
import { ScanLine } from '../src/components/ScanLine';
import { Colors } from '../src/constants/colors';
import { AuthProvider, useAuth } from '../context/AuthContext';

// ============================================================
// ROUTE GUARD
// Redirects unauthenticated users away from protected routes
// and authenticated users away from auth screens.
// ============================================================
function RouteGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inProtectedGroup = segments[0] === '(tabs)' || segments[0] === 'receipt' || segments[0] === 'upload';

    if (!isAuthenticated && inProtectedGroup) {
      router.replace('/login');
    } else if (isAuthenticated && segments[0] === 'login' && segments.length === 1) {
      // Only redirect from login if on the root login route
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accentCyan} />
      </View>
    );
  }

  return <>{children}</>;
}

// ============================================================
// ROOT LAYOUT
// Loads custom fonts, shows initial scan-line animation,
// wraps everything in AuthProvider for global auth state,
// and applies RouteGuard for automatic redirects.
// ============================================================
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
  });

  const [showScanLine, setShowScanLine] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowScanLine(false), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bgPrimary }} />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <View style={styles.container}>
            <StatusBar style="light" />
            {showScanLine && <ScanLine />}
            <RouteGuard>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: { backgroundColor: Colors.bgPrimary },
                  animation: 'slide_from_right',
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen
                  name="auth/callback"
                  options={{
                    animation: 'none',
                    gestureEnabled: false,
                  }}
                />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                  name="receipt/[id]"
                  options={{
                    animation: 'slide_from_right',
                    presentation: 'card',
                  }}
                />
              </Stack>
            </RouteGuard>
          </View>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
