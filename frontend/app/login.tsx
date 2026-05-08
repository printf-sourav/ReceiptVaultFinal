import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../src/constants/colors';
import { Fonts, FontSizes } from '../src/constants/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string; email?: string }>();
  const isRegistrationMode = params.mode === 'register';
  const { signInWithGoogle, signInWithOtp, sendOtpCode, completeOAuthRegistration, isAuthenticating, isRegistering, error, clearError } = useAuth();

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [otpSuccess, setOtpSuccess] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const otpRefs = useRef<(TextInput | null)[]>([]);

  const otpContainerOpacity = useSharedValue(0);
  const otpContainerY = useSharedValue(20);
  const shakeX = useSharedValue(0);
  const boxStagger = Array.from({ length: 6 }, () => useSharedValue(0));
  const phoneBorderColor = useSharedValue(0);

  // Animate the Google button in after a short delay
  const googleBtnOpacity = useSharedValue(0);
  const googleBtnY = useSharedValue(15);
  useEffect(() => {
    googleBtnOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    googleBtnY.value = withDelay(200, withSpring(0, { damping: 15 }));
  }, []);

  useEffect(() => {
    phoneBorderColor.value = withTiming(phoneFocused ? 1 : 0, {
      duration: 200,
    });
  }, [phoneFocused]);

  const phoneBorderStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      phoneBorderColor.value,
      [0, 1],
      [Colors.borderSubtle, Colors.borderActive]
    ),
  }));

  const googleBtnStyle = useAnimatedStyle(() => ({
    opacity: googleBtnOpacity.value,
    transform: [{ translateY: googleBtnY.value }],
  }));

  const handleSendOtp = async () => {
    if (phone.length < 10) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    clearError();

    setOtpSending(true);
    const result = await sendOtpCode(phone);
    setOtpSending(false);

    if (result.success) {
      setOtpSent(true);
      otpContainerOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
      otpContainerY.value = withDelay(100, withSpring(0, { damping: 15 }));

      boxStagger.forEach((sv, i) => {
        sv.value = withDelay(200 + i * 50, withSpring(1, { damping: 12 }));
      });
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    setOtpError(false);
    setOtpSuccess(false);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const enteredOtp = otp.join('');
    if (enteredOtp.length !== 6) {
      setOtpError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      clearError();
      if (isRegistrationMode) {
        await completeOAuthRegistration(phone, enteredOtp);
      } else {
        await signInWithOtp(phone, enteredOtp);
      }
      setOtpSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Navigation will happen automatically via the provider
    } catch (err: any) {
      setOtpError(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      shakeX.value = withSequence(
        withTiming(-8, { duration: 80 }),
        withTiming(8, { duration: 80 }),
        withTiming(-8, { duration: 80 }),
        withTiming(0, { duration: 80 })
      );
    }
  };

  const handleGoogleSignIn = async () => {
    clearError();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await signInWithGoogle();
  };

  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const otpContainerStyle = useAnimatedStyle(() => ({
    opacity: otpContainerOpacity.value,
    transform: [{ translateY: otpContainerY.value }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.content}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Access Your Vault</Text>
          <Text style={styles.subtitle}>
            {isRegistrationMode
              ? 'Complete registration with your phone number'
              : 'Sign in with Google or phone number'}
          </Text>
          <Text style={styles.infoText}>
            {isRegistrationMode
              ? 'Google sign-in is already done. Add your phone to finish registration.'
              : 'New users: Google login + phone required'}
          </Text>
        </View>

        {/* ── Google Sign-In Button ── */}
        <Animated.View style={googleBtnStyle}>
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isAuthenticating}
            style={({ pressed }) => [
              styles.googleBtn,
              pressed && styles.googleBtnPressed,
              isAuthenticating && styles.googleBtnDisabled,
            ]}
          >
            {isAuthenticating ? (
              <ActivityIndicator size="small" color={Colors.accentCyan} />
            ) : (
              <Text style={styles.googleIcon}>G</Text>
            )}
            <Text style={styles.googleBtnText}>
              {isAuthenticating ? 'Signing in…' : isRegistrationMode ? 'Google already linked' : 'Continue with Google'}
            </Text>
          </Pressable>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}
        </Animated.View>

        {/* ── Divider ── */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* ── Phone Number Input ── */}
        <Animated.View style={[styles.phoneRow, phoneBorderStyle]}>
          <View style={styles.countryCode}>
            <Text style={styles.flag}>🇮🇳</Text>
            <Text style={styles.code}>+91</Text>
          </View>
          <TextInput
            style={styles.phoneInput}
            placeholder="Phone number"
            placeholderTextColor={Colors.textMuted}
            keyboardType="phone-pad"
            maxLength={10}
            value={phone}
            onChangeText={setPhone}
            onFocus={() => setPhoneFocused(true)}
            onBlur={() => setPhoneFocused(false)}
          />
        </Animated.View>

        <Pressable
          onPress={handleSendOtp}
          disabled={otpSending || isAuthenticating || isRegistering}
          style={({ pressed }) => [
            { transform: [{ scale: pressed ? 0.97 : 1 }] },
            styles.sendBtn,
            (otpSending || isAuthenticating || isRegistering) && styles.btnDisabled,
          ]}
        >
          <LinearGradient
            colors={Colors.gradientCyan as unknown as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            {otpSending || isRegistering ? (
              <ActivityIndicator size="small" color={Colors.textPrimary} />
            ) : (
              <Text style={styles.btnText}>
                {otpSent ? 'Resend OTP' : 'Send OTP'}
              </Text>
            )}
          </LinearGradient>
        </Pressable>

        {otpSent && (
          <Animated.View style={[styles.otpSection, otpContainerStyle]}>
            <Text style={styles.otpLabel}>Enter verification code</Text>
            <Animated.View style={[styles.otpRow, shakeStyle]}>
              {otp.map((digit, index) => {
                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.otpBox,
                      otpError && styles.otpBoxError,
                      otpSuccess && styles.otpBoxSuccess,
                      digit ? styles.otpBoxFilled : {},
                    ]}
                  >
                    <TextInput
                      ref={(ref) => {
                        otpRefs.current[index] = ref;
                      }}
                      style={styles.otpInput}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={digit}
                      onChangeText={(val) => handleOtpChange(val, index)}
                      onKeyPress={({ nativeEvent }) =>
                        handleOtpKeyPress(nativeEvent.key, index)
                      }
                    />
                  </Animated.View>
                );
              })}
            </Animated.View>

            <Pressable
              onPress={handleVerify}
              disabled={isAuthenticating}
              style={({ pressed }) => [
                { transform: [{ scale: pressed ? 0.97 : 1 }] },
                styles.verifyBtn,
                isAuthenticating && styles.btnDisabled,
              ]}
            >
              <LinearGradient
                colors={Colors.gradientCyan as unknown as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientBtn}
              >
                {isAuthenticating ? (
                  <ActivityIndicator size="small" color={Colors.textPrimary} />
                ) : (
                  <Text style={styles.btnText}>Enter Vault</Text>
                )}
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xxl - 2,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm + 1,
    color: Colors.textSecondary,
  },
  infoText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    marginTop: 8,
  },

  // Google Sign-In
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    gap: 12,
    marginBottom: 8,
  },
  googleBtnPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleIcon: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.lg,
    color: Colors.accentCyan,
  },
  googleBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  errorText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.accentRose,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 4,
  },

  // Divider
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.borderSubtle,
  },
  dividerText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    marginHorizontal: 16,
  },

  // Phone input
  phoneRow: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    overflow: 'hidden',
    marginBottom: 16,
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: 12,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: Colors.borderSubtle,
  },
  flag: {
    fontSize: 18,
  },
  code: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: Colors.bgTertiary,
    paddingHorizontal: 16,
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  sendBtn: {
    marginBottom: 32,
  },
  gradientBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.bgPrimary,
    letterSpacing: -0.3,
  },
  otpSection: {
    gap: 20,
  },
  otpLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxFilled: {
    borderColor: Colors.borderGlow,
  },
  otpBoxError: {
    borderColor: Colors.accentRose,
  },
  otpBoxSuccess: {
    borderColor: Colors.accentEmerald,
  },
  otpInput: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.accentCyan,
    textAlign: 'center',
    width: '100%',
    height: '100%',
  },
  verifyBtn: {},
  btnDisabled: {
    opacity: 0.6,
  },
  hint: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
