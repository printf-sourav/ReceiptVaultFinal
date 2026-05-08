import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { GlowCard } from '../src/components/GlowCard';
import { MonoText } from '../src/components/MonoText';
import { Colors } from '../src/constants/colors';
import { Fonts, FontSizes } from '../src/constants/typography';
import { uploadReceipt } from '../lib/api';
import { useData } from '../src/hooks/useData';
import { formatIndianCurrency } from '../src/lib/mockData';

export default function UploadReceiptScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { refetch } = useData();

  const pickImage = async (useCamera: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      setError('Permission denied. Please allow access in settings.');
      return;
    }

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setUploading(true);
    setError(null);
    setResult(null);

    try {
      const res = await uploadReceipt(imageUri);
      const data = res.data;
      if (res.status === 200 && data.receipt) {
        setResult(data.receipt);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Refresh global receipt/stats data so totals update immediately
        try {
          await refetch();
        } catch (e) {
          // ignore refetch errors
        }
        try {
          const { publish } = await import('../src/lib/eventBus');
          publish('data:updated');
        } catch (e) {
          // ignore
        }
      } else {
        setError(data.error || 'Upload failed');
      }
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message || 'Upload failed. Check server connection.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backBtn}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M19 12H5M12 19l-7-7 7-7"
              stroke={Colors.textPrimary}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Upload Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Image Preview */}
        <Pressable
          style={styles.imageArea}
          onPress={() => pickImage(false)}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="contain" />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📸</Text>
              <Text style={styles.placeholderText}>Tap to select a receipt image</Text>
              <Text style={styles.placeholderHint}>or use the buttons below</Text>
            </View>
          )}
        </Pressable>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <Pressable
            style={styles.pickBtn}
            onPress={() => pickImage(true)}
          >
            <Text style={styles.pickBtnIcon}>📷</Text>
            <Text style={styles.pickBtnText}>Camera</Text>
          </Pressable>
          <Pressable
            style={styles.pickBtn}
            onPress={() => pickImage(false)}
          >
            <Text style={styles.pickBtnIcon}>🖼️</Text>
            <Text style={styles.pickBtnText}>Gallery</Text>
          </Pressable>
        </View>

        {/* Upload Button */}
        {imageUri && !result && (
          <Pressable
            onPress={handleUpload}
            disabled={uploading}
            style={({ pressed }) => [
              { transform: [{ scale: pressed ? 0.97 : 1 }], opacity: uploading ? 0.6 : 1 },
            ]}
          >
            <LinearGradient
              colors={Colors.gradientCyan as unknown as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadBtn}
            >
              {uploading ? (
                <View style={styles.uploadingRow}>
                  <ActivityIndicator color={Colors.bgPrimary} size="small" />
                  <Text style={styles.uploadBtnText}>Extracting with Gemini...</Text>
                </View>
              ) : (
                <Text style={styles.uploadBtnText}>✦ Extract & Save Receipt</Text>
              )}
            </LinearGradient>
          </Pressable>
        )}

        {/* Error */}
        {error && (
          <Animated.View entering={FadeInDown.duration(300)}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        )}

        {/* Success Result */}
        {result && (
          <Animated.View entering={FadeInDown.duration(400)}>
            <GlowCard style={styles.resultCard}>
              <Text style={styles.successBadge}>✓ Receipt Saved</Text>
              <Text style={styles.resultStore}>{result.store}</Text>
              <MonoText style={styles.resultAmount}>
                {formatIndianCurrency(result.amount)}
              </MonoText>
              <Text style={styles.resultMeta}>
                {result.items?.length || 0} items • {result.category}
              </Text>
              {result.returnDeadline && (
                <Text style={styles.resultDeadline}>
                  Return by: {result.returnDeadline}
                </Text>
              )}
              <View style={styles.resultActions}>
                <Pressable
                  style={styles.viewBtn}
                  onPress={() => router.push(`/receipt/${result.id}`)}
                >
                  <Text style={styles.viewBtnText}>View Details</Text>
                </Pressable>
                <Pressable
                  style={styles.anotherBtn}
                  onPress={() => {
                    setImageUri(null);
                    setResult(null);
                  }}
                >
                  <Text style={styles.anotherBtnText}>Upload Another</Text>
                </Pressable>
              </View>
            </GlowCard>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgTertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.md,
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  imageArea: {
    width: '100%',
    height: 280,
    borderRadius: 20,
    backgroundColor: Colors.bgSecondary,
    borderWidth: 2,
    borderColor: Colors.borderSubtle,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderIcon: {
    fontSize: 48,
  },
  placeholderText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  placeholderHint: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickBtn: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.bgTertiary,
    borderWidth: 1,
    borderColor: Colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  pickBtnIcon: {
    fontSize: 20,
  },
  pickBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  uploadBtn: {
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadBtnText: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.base,
    color: Colors.bgPrimary,
    letterSpacing: -0.3,
  },
  errorText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentRose,
    textAlign: 'center',
  },
  resultCard: {
    padding: 20,
    gap: 8,
  },
  successBadge: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.sm,
    color: Colors.accentEmerald,
    marginBottom: 4,
  },
  resultStore: {
    fontFamily: Fonts.heading,
    fontSize: FontSizes.xl,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  resultAmount: {
    fontSize: FontSizes.xxl,
    color: Colors.accentCyan,
    fontWeight: 'bold',
  },
  resultMeta: {
    fontFamily: Fonts.bodyRegular,
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  resultDeadline: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentAmber,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  viewBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accentCyan,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.bgPrimary,
  },
  anotherBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.borderGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  anotherBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: FontSizes.sm,
    color: Colors.accentCyan,
  },
});
