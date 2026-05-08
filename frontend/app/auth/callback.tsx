import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { getRegistrationStatus, saveGoogleConsent, saveUserPhone } from '../../lib/api';
import { Colors } from '../../src/constants/colors';
import { Fonts, FontSizes } from '../../src/constants/typography';

// Helper to wrap async operations with timeout
const withTimeout = <T,>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
    ),
  ]);
};

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; error?: string; error_description?: string }>();
  const [message, setMessage] = useState('Signing you in...');
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const finishSignIn = async () => {
      try {
        // On web, OAuth response comes in hash fragment or query params
        if (Platform.OS === 'web') {
          // Check both hash params (normal OAuth flow) and query params (error cases)
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const queryParams = new URLSearchParams(window.location.search);
          
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          let errorParamHash = hashParams.get('error') || queryParams.get('error');
          let errorDescHash = hashParams.get('error_description') || queryParams.get('error_description');

          if (errorParamHash) {
            const msg = `OAuth Error: ${errorParamHash} - ${errorDescHash || 'Unknown error'}`;
            setDebugInfo(msg);
            console.error(msg);
            setMessage('Sign in failed. Redirecting...');
            setTimeout(() => router.replace('/login'), 2000);
            return;
          }

          if (accessToken) {
            console.log('Found access token in hash, setting session...');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });

            if (error) {
              const msg = `Session Error: ${error.message}`;
              setDebugInfo(msg);
              console.error(msg);
              throw error;
            }

            console.log('Session set successfully from OAuth token');
            const { data } = await supabase.auth.getSession();
            if (data.session) {
                const refreshToken = (data.session as any)?.provider_refresh_token || (data.session as any)?.provider_token || '';
              if (!isEmailVerified(data.session.user)) {
                await supabase.auth.signOut();
                const msg = 'Email verification is required before registration.';
                setDebugInfo(msg);
                setMessage('Email verification required. Redirecting...');
                setTimeout(() => router.replace('/login'), 2000);
                return;
              }

              const email = data.session.user.email;
              if (email) {
                try {
                  const statusResponse = await withTimeout(
                    getRegistrationStatus({ email }),
                    3000
                  );
                  const registration = statusResponse.data;

                  if (registration?.registered && registration?.user?.id && refreshToken) {
                    await saveGoogleConsent({
                      userId: registration.user.id,
                      email,
                      refreshToken,
                    });
                  }

                  if (registration?.registered && registration?.phone) {
                    await saveUserPhone(registration.phone);
                    console.log('Registered OAuth user found, navigating to app');
                    router.replace('/(tabs)');
                    return;
                  }

                  console.log('OAuth user is not registered yet, sending to login completion');
                  router.replace(`/login?mode=register&email=${encodeURIComponent(email)}`);
                  return;
                } catch (apiErr: any) {
                  // If backend is unreachable, still proceed with registration flow
                  console.warn('Registration status check failed, proceeding to register:', apiErr.message);
                  router.replace(`/login?mode=register&email=${encodeURIComponent(email)}`);
                  return;
                }
              }
            }
          }
        }

        // Fallback: Try code exchange (native or alternate flow)
        const code = params.code;
        const errorParamCode = params.error;
        const errorDescCode = params.error_description;

        if (errorParamCode) {
          const msg = `OAuth Error: ${errorParamCode} - ${errorDescCode || 'Unknown error'}`;
          setDebugInfo(msg);
          console.error(msg);
          setMessage('Sign in failed. Redirecting...');
          setTimeout(() => router.replace('/login'), 2000);
          return;
        }

        if (typeof code === 'string' && code.length > 0) {
          console.log('Exchanging auth code for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            const msg = `Exchange Error: ${error.message}`;
            setDebugInfo(msg);
            console.error(msg);
            throw error;
          }
          console.log('Session exchanged successfully');
        } else {
          const msg = `No code or token received. Hash params: ${window.location.hash}`;
          setDebugInfo(msg);
          console.log(msg);
        }

        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const refreshToken = (data.session as any)?.provider_refresh_token || (data.session as any)?.provider_token || '';
          if (!isEmailVerified(data.session.user)) {
            await supabase.auth.signOut();
            const msg = 'Email verification is required before registration.';
            setDebugInfo(msg);
            setMessage('Email verification required. Redirecting...');
            setTimeout(() => router.replace('/login'), 2000);
            return;
          }

          const email = data.session.user.email;
          if (email) {
            try {
              const statusResponse = await withTimeout(
                getRegistrationStatus({ email }),
                3000
              );
              const registration = statusResponse.data;

              if (registration?.registered && registration?.user?.id && refreshToken) {
                await saveGoogleConsent({
                  userId: registration.user.id,
                  email,
                  refreshToken,
                });
              }

              if (registration?.registered && registration?.phone) {
                await saveUserPhone(registration.phone);
                console.log('Registered OAuth user found, navigating to app');
                router.replace('/(tabs)');
                return;
              }

              console.log('OAuth user is not registered yet, sending to login completion');
              router.replace(`/login?mode=register&email=${encodeURIComponent(email)}`);
              return;
            } catch (apiErr: any) {
              // If backend is unreachable, still proceed with registration flow
              console.warn('Registration status check failed, proceeding to register:', apiErr.message);
              router.replace(`/login?mode=register&email=${encodeURIComponent(email)}`);
              return;
            }
          }
        }

        const msg = 'No session found after exchange';
        setDebugInfo(msg);
        setMessage('Unable to complete sign in. Redirecting...');
        setTimeout(() => router.replace('/login'), 1200);
      } catch (error: any) {
        const msg = `Error: ${error?.message || JSON.stringify(error)}`;
        setDebugInfo(msg);
        console.error(msg);
        setMessage('Sign in failed. Redirecting...');
        setTimeout(() => router.replace('/login'), 2000);
      }
    };

    finishSignIn();
  }, [params.code, params.error, router]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ActivityIndicator size="large" color={Colors.accentCyan} />
        <Text style={styles.title}>ReceiptVault</Text>
        <Text style={styles.message}>{message}</Text>
        {debugInfo ? (
          <View style={styles.debugBox}>
            <Text style={styles.debugLabel}>Debug Info:</Text>
            <Text style={styles.debugText}>{debugInfo}</Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    marginTop: 20,
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
  },
  message: {
    marginTop: 12,
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  debugBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: Colors.bgSecondary,
    borderRadius: 8,
    borderColor: Colors.accentRose,
    borderWidth: 1,
    maxWidth: 300,
  },
  debugLabel: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.accentRose,
    marginBottom: 4,
  },
  debugText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});

function isEmailVerified(user: any): boolean {
  if (user?.email_confirmed_at) return true;
  return user?.user_metadata?.email_verified === true;
}