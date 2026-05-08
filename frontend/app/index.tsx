import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { VaultLogo } from '../src/components/VaultLogo';
import { Colors } from '../src/constants/colors';
import { Fonts, FontSizes } from '../src/constants/typography';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();

  const logoScale = useSharedValue(0);
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const buttonY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 200,
      overshootClamping: false,
    });

    titleY.value = withDelay(300, withSpring(0, { damping: 15 }));
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));

    subtitleOpacity.value = withDelay(500, withTiming(1, { duration: 400 }));

    buttonY.value = withDelay(700, withSpring(0, { damping: 15 }));
    buttonOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: titleY.value }],
    opacity: titleOpacity.value,
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: buttonY.value }],
    opacity: buttonOpacity.value,
  }));

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/login');
  };

  return (
    <View style={styles.container}>
      {/* Ambient glow blobs */}
      <View style={styles.blobCyan} />
      <View style={styles.blobPurple} />

      <View style={styles.center}>
        <Animated.View style={logoStyle}>
          <VaultLogo size={100} animated />
        </Animated.View>

        <Animated.View style={titleStyle}>
          <Text style={styles.title}>ReceiptVault</Text>
        </Animated.View>

        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>Your financial memory, secured.</Text>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <Animated.View style={buttonStyle}>
          <Pressable
            onPress={handleGetStarted}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <LinearGradient
              colors={Colors.gradientCyan as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </Pressable>

          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.signInText}>
              Already have an account? <Text style={styles.signInLink}>Sign in</Text>
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  blobCyan: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 9999,
    backgroundColor: Colors.accentCyan,
    opacity: 0.07,
  },
  blobPurple: {
    position: 'absolute',
    bottom: -60,
    left: -80,
    width: 260,
    height: 260,
    borderRadius: 9999,
    backgroundColor: Colors.accentPurple,
    opacity: 0.07,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xxxl,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  bottom: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.bgPrimary,
    letterSpacing: -0.3,
  },
  signInText: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
  },
  signInLink: {
    color: Colors.accentCyan,
  },
});
