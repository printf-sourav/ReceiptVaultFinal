# ReceiptVault — Complete UI Redesign Implementation Prompt
## For: Cursor / Antigravity
## Design System: "Obsidian & Pearl"

---

> Paste everything inside the CURSOR PROMPT section into Cursor or Antigravity.
> All file paths are exact based on the real project structure.

---

# ═══════════════════════════════════════════════════════
# CURSOR PROMPT — PASTE EVERYTHING BELOW
# ═══════════════════════════════════════════════════════

```
You are redesigning the ReceiptVault React Native (Expo) mobile app.
The app already exists and is working. Your job is to completely replace
the visual design with a new premium minimal iOS-inspired design system
called "Obsidian & Pearl". Do NOT rewrite business logic, navigation
structure, mock data, or auth. Only redesign the visual layer.

All files you touch are inside `frontend/`. Do not touch any backend files
(src/, package.json at root, docker-compose.yml, SOUL.md, HEARTBEAT.md, etc.)

These are the exact files you will modify:
  frontend/src/constants/colors.ts
  frontend/src/constants/typography.ts
  frontend/src/components/GlowCard.tsx         → becomes GlassCard
  frontend/src/components/BottomTabBar.tsx
  frontend/src/components/StatCard.tsx
  frontend/src/components/DeadlineBadge.tsx
  frontend/src/components/MonoText.tsx
  frontend/src/components/PillButton.tsx
  frontend/src/components/SkeletonLoader.tsx
  frontend/src/components/AnimatedToggle.tsx
  frontend/src/components/BottomSheet.tsx
  frontend/app/index.tsx
  frontend/app/login.tsx
  frontend/app/(tabs)/index.tsx
  frontend/app/(tabs)/receipts.tsx
  frontend/app/(tabs)/deadlines.tsx
  frontend/app/(tabs)/spending.tsx
  frontend/app/(tabs)/settings.tsx
  frontend/app/receipt/[id].tsx
  frontend/app/(tabs)/_layout.tsx

Also create these new files:
  frontend/src/components/GlassCard.tsx        (new — replaces GlowCard)
  frontend/src/components/SectionHeader.tsx    (new)
  frontend/src/components/ListRow.tsx          (new)
  frontend/src/components/HeroAmount.tsx       (new)

Do not delete GlowCard.tsx — just leave it empty and deprecated.
Any screen that imports GlowCard must be updated to import GlassCard instead.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 1 — REPLACE THE COLOR SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completely replace `frontend/src/constants/colors.ts` with this:

```typescript
export const Colors = {
  // ── Backgrounds ───────────────────────────────────────
  bgPrimary:    '#0A0A0F',   // near-black with warm undertone
  bgSecondary:  '#111118',   // card surfaces
  bgTertiary:   '#18181F',   // elevated elements, inputs
  bgElevated:   '#1E1E28',   // modals, bottom sheets
  bgSplash:     '#000000',   // true black for splash + login only

  // ── Glass Surfaces (simulated frosted glass) ───────────
  glassLight:   'rgba(255, 255, 255, 0.04)',
  glassMedium:  'rgba(255, 255, 255, 0.07)',
  glassStrong:  'rgba(255, 255, 255, 0.10)',
  glassBorder:  'rgba(255, 255, 255, 0.08)',
  glassBorderActive: 'rgba(255, 255, 255, 0.18)',
  glassHighlight: 'rgba(255, 255, 255, 0.06)', // top edge inner highlight

  // ── Accent — Soft Violet Indigo ────────────────────────
  accent:       '#818CF8',
  accentBright: '#A5B4FC',
  accentDim:    'rgba(129, 140, 248, 0.15)',
  accentGlow:   'rgba(129, 140, 248, 0.25)',
  accentBorder: 'rgba(129, 140, 248, 0.30)',

  // ── Semantic ───────────────────────────────────────────
  emerald:      '#34D399',
  emeraldDim:   'rgba(52, 211, 153, 0.15)',
  emeraldGlow:  'rgba(52, 211, 153, 0.20)',
  amber:        '#FBBF24',
  amberDim:     'rgba(251, 191, 36, 0.15)',
  amberGlow:    'rgba(251, 191, 36, 0.20)',
  rose:         '#F87171',
  roseDim:      'rgba(248, 113, 113, 0.15)',
  roseGlow:     'rgba(248, 113, 113, 0.20)',
  purple:       '#C084FC',
  purpleDim:    'rgba(192, 132, 252, 0.15)',

  // ── Text Hierarchy (iOS system labels) ────────────────
  textPrimary:     '#F5F5F7',  // Apple off-white — NOT pure white
  textSecondary:   '#8E8E93',  // iOS secondary label
  textTertiary:    '#48484A',  // iOS tertiary label
  textQuaternary:  '#2C2C2E',  // separators, very subtle

  // ── Separators ────────────────────────────────────────
  separator:    'rgba(255, 255, 255, 0.06)',
  separatorStrong: 'rgba(255, 255, 255, 0.10)',
} as const;

// Gradient helpers
export const Gradients = {
  accentIndigo: ['#818CF8', '#6366F1'] as const,
  accentFade:   ['rgba(129,140,248,0.20)', 'rgba(129,140,248,0)'] as const,
  cardSurface:  ['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.03)'] as const,
  heroFade:     ['rgba(10,10,15,0)', 'rgba(10,10,15,0.95)', '#0A0A0F'] as const,
  amberFade:    ['rgba(251,191,36,0.15)', 'rgba(251,191,36,0)'] as const,
  roseFade:     ['rgba(248,113,113,0.15)', 'rgba(248,113,113,0)'] as const,
  splashGlow:   ['rgba(129,140,248,0.08)', 'rgba(129,140,248,0)'] as const,
  chartArea:    ['rgba(129,140,248,0.18)', 'rgba(129,140,248,0.02)'] as const,
};
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 2 — REPLACE THE TYPOGRAPHY SYSTEM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completely replace `frontend/src/constants/typography.ts` with this:

```typescript
import { Platform } from 'react-native';

export const FontSize = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  32,
  hero: 52,   // the massive thin number
  display: 64,
} as const;

export const FontWeight = {
  thin:      '200' as const,
  light:     '300' as const,
  regular:   '400' as const,
  medium:    '500' as const,
  semibold:  '600' as const,
  bold:      '700' as const,
} as const;

export const LetterSpacing = {
  tight:  -0.8,
  snug:   -0.4,
  normal:  0,
  wide:    0.3,
  wider:   0.8,
  label:   1.2,   // for uppercase section labels
} as const;

export const LineHeight = {
  tight:  1.1,
  snug:   1.3,
  normal: 1.5,
  relaxed: 1.7,
} as const;

// Mono font for amounts, dates, IDs
export const monoFont = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

// Typography presets — use these instead of defining styles inline
export const TextStyles = {
  // Hero amount (Apple Wallet style — the signature look)
  heroAmount: {
    fontSize: FontSize.hero,
    fontWeight: FontWeight.light,
    letterSpacing: LetterSpacing.tight,
    fontFamily: monoFont,
  },
  // Large display heading
  displayTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.light,
    letterSpacing: LetterSpacing.snug,
  },
  // Screen titles (large iOS title style)
  screenTitle: {
    fontSize: 34,
    fontWeight: FontWeight.bold,
    letterSpacing: LetterSpacing.snug,
  },
  // Card title
  cardTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.snug,
  },
  // Section label (small uppercase)
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    letterSpacing: LetterSpacing.label,
    textTransform: 'uppercase' as const,
  },
  // Body text
  body: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
  },
  // Secondary label
  caption: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.regular,
    letterSpacing: LetterSpacing.normal,
  },
  // Mono data
  monoData: {
    fontSize: FontSize.base,
    fontFamily: monoFont,
    fontWeight: FontWeight.medium,
    letterSpacing: LetterSpacing.normal,
  },
  monoLarge: {
    fontSize: FontSize.xl,
    fontFamily: monoFont,
    fontWeight: FontWeight.medium,
    letterSpacing: LetterSpacing.snug,
  },
} as const;
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 3 — CREATE NEW SHARED COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 3A — Create frontend/src/components/GlassCard.tsx

This is the signature component of the new design system. Used everywhere.

```typescript
import React from 'react';
import { View, ViewStyle, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Gradients } from '../constants/colors';

type GlowColor = 'none' | 'indigo' | 'amber' | 'rose' | 'emerald';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  glowColor?: GlowColor;
  onPress?: () => void;
  pressable?: boolean;
  noHighlight?: boolean; // disable the top edge highlight
}

const glowColors: Record<GlowColor, string> = {
  none:    'transparent',
  indigo:  Colors.accentGlow,
  amber:   Colors.amberGlow,
  rose:    Colors.roseGlow,
  emerald: Colors.emeraldGlow,
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GlassCard({
  children, style, glowColor = 'none', onPress, pressable = false, noHighlight = false
}: GlassCardProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 400 });
  };

  const content = (
    <View style={[styles.card, style]}>
      {/* Top edge highlight — the key detail that makes glass look real */}
      {!noHighlight && (
        <LinearGradient
          colors={['rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
          style={styles.topHighlight}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          pointerEvents="none"
        />
      )}
      {/* Glow shadow layer (only if glowColor != none) */}
      {glowColor !== 'none' && (
        <View
          style={[styles.glowLayer, { shadowColor: glowColors[glowColor] }]}
          pointerEvents="none"
        />
      )}
      {children}
    </View>
  );

  if (!pressable && !onPress) return content;

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={animatedStyle}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.glassMedium,
    borderRadius: 20,
    borderWidth: 0.5,
    borderColor: Colors.glassBorder,
    overflow: 'hidden',
    // Card shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 8,
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    zIndex: 1,
  },
  glowLayer: {
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 0,
  },
});
```

### 3B — Create frontend/src/components/SectionHeader.tsx

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors, TextStyles } from '../constants';

interface SectionHeaderProps {
  label: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ label, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label.toUpperCase()}</Text>
      {actionLabel && (
        <Pressable onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 10,
    marginTop: 24,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
  },
  action: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.accent,
    letterSpacing: -0.2,
  },
});
```

### 3C — Create frontend/src/components/ListRow.tsx

iOS-style list row. Used for deadlines, settings, receipt rows.

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors } from '../constants/colors';

interface ListRowProps {
  leftContent: React.ReactNode;   // icon, dot, or initial circle
  title: string;
  subtitle?: string;
  rightContent?: React.ReactNode; // badge, value, arrow, toggle
  onPress?: () => void;
  showSeparator?: boolean;
  urgencyColor?: string;          // left vertical bar color (for deadlines)
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ListRow({
  leftContent, title, subtitle, rightContent, onPress,
  showSeparator = true, urgencyColor,
}: ListRowProps) {
  const scale = useSharedValue(1);
  const bg = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bg.value === 1
      ? 'rgba(255,255,255,0.03)'
      : 'transparent',
  }));

  return (
    <>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          bg.value = 1;
          if (onPress) Haptics.selectionAsync();
        }}
        onPressOut={() => { bg.value = 0; }}
        style={[styles.row, animStyle]}
      >
        {/* Urgency bar (deadlines only) */}
        {urgencyColor && (
          <View style={[styles.urgencyBar, { backgroundColor: urgencyColor }]} />
        )}

        {/* Left content (icon, dot, avatar) */}
        <View style={styles.left}>{leftContent}</View>

        {/* Text */}
        <View style={styles.textBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle && (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          )}
        </View>

        {/* Right content */}
        {rightContent && (
          <View style={styles.right}>{rightContent}</View>
        )}
      </AnimatedPressable>

      {/* iOS-style separator (indented from left) */}
      {showSeparator && (
        <View style={styles.separator} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  urgencyBar: {
    width: 3,
    height: 36,
    borderRadius: 2,
    marginRight: 12,
  },
  left: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: -0.1,
  },
  right: {
    marginLeft: 12,
    alignItems: 'flex-end',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.separator,
    marginLeft: 56, // indent past the left icon
  },
});
```

### 3D — Create frontend/src/components/HeroAmount.tsx

The signature large thin number. Used on Home, Receipt Detail, Spending.

```typescript
import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedProps, withTiming, Easing
} from 'react-native-reanimated';
import { Colors } from '../constants/colors';

// Formats to Indian number system: 1,24,830
function formatIndian(amount: number): string {
  const str = Math.floor(amount).toString();
  if (str.length <= 3) return str;
  const last3 = str.slice(-3);
  const rest = str.slice(0, -3);
  const formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${formatted},${last3}`;
}

interface HeroAmountProps {
  amount: number;           // the final value
  prefix?: string;          // default: '₹'
  label?: string;           // e.g. 'TOTAL SPENT THIS MONTH'
  subLabel?: string;        // e.g. '↑ 12% · 47 receipts'
  color?: string;           // default: textPrimary
  animate?: boolean;        // count up from 0
  size?: 'hero' | 'large'; // hero = 52px, large = 34px
}

export default function HeroAmount({
  amount, prefix = '₹', label, subLabel,
  color = Colors.textPrimary, animate = true, size = 'hero',
}: HeroAmountProps) {
  const animated = useSharedValue(animate ? 0 : amount);

  useEffect(() => {
    if (animate) {
      animated.value = withTiming(amount, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [amount]);

  // Use JS-side display (Reanimated's animatedProps with Text is complex)
  // Instead: use a JS interval approach for the count-up
  const [displayed, setDisplayed] = React.useState(animate ? 0 : amount);

  useEffect(() => {
    if (!animate) { setDisplayed(amount); return; }
    const duration = 1200;
    const steps = 60;
    const stepTime = duration / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += 1;
      const progress = current / steps;
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayed(Math.floor(eased * amount));
      if (current >= steps) { setDisplayed(amount); clearInterval(timer); }
    }, stepTime);
    return () => clearInterval(timer);
  }, [amount, animate]);

  const fontSize = size === 'hero' ? 52 : 34;
  const fontWeight = size === 'hero' ? '300' : '400';

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={styles.amountRow}>
        <Text style={[styles.prefix, { fontSize: fontSize * 0.5, color }]}>
          {prefix}
        </Text>
        <Text style={[styles.amount, { fontSize, fontWeight: fontWeight as any, color }]}>
          {formatIndian(displayed)}
        </Text>
      </View>
      {subLabel && (
        <Text style={styles.subLabel}>{subLabel}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start' },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.2,
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  prefix: {
    fontWeight: '300',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginRight: 2,
    letterSpacing: -0.5,
  },
  amount: {
    letterSpacing: -2,
    lineHeight: undefined,
  },
  subLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    letterSpacing: -0.2,
  },
});
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 4 — REDESIGN THE BOTTOM TAB BAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Completely replace `frontend/src/components/BottomTabBar.tsx`:

The new tab bar is a floating pill — centered, not full width.

Key specs:
- Position: absolute, bottom: 28, alignSelf: 'center'
- Width: Dimensions.get('window').width * 0.88
- Height: 64
- borderRadius: 32
- Background: rgba(18, 18, 24, 0.94)
- Border: 0.5px solid rgba(255,255,255,0.10)
- Shadow: heavy drop shadow (iOS: shadowOpacity 0.7, Android: elevation 24)

Active tab indicator:
- A rounded rect (44px wide, 34px tall, borderRadius 17)
- Background: accentDim (rgba(129,140,248,0.15))
- Slides between positions using Reanimated withSpring
- The indicator is absolutely positioned and moves horizontally
- Do NOT use separate backgrounds per tab — one moving indicator

Icons:
- Use the same Lucide icons already in the project
- Active: accentBright (#A5B4FC), size 22
- Inactive: textTertiary (#48484A), size 22
- Active tab: icon scale 1.1 with spring
- Tab press: Haptics.selectionAsync() (lightest haptic)

No labels under icons. Icons only. The floating pill shape communicates
the tab bar purpose without needing labels.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 5 — REDESIGN THE SPLASH SCREEN (app/index.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Replace the splash screen content. Keep routing logic intact.

Background: bgSplash (#000000) — true black only on this screen.

Layout (all centered):
- Top 40% of screen: empty (negative space is intentional)
- Center: VaultLogo, size 72, no text
  - On mount: scale from 0.6 to 1.0 with withSpring (damping 18, stiffness 100)
  - After 400ms: opacity 0 → 1 animation on the text below
- "ReceiptVault" text:
  - fontSize 38, fontWeight '300' (THIN — this is important), textPrimary
  - letterSpacing -1.5
  - marginTop 20
  - fades in after logo settles
- Tagline: "Your receipts. Remembered." — fontSize 15, textSecondary, marginTop 8
  - fades in 200ms after title

Very subtle radial-ish glow behind the logo (position absolute, centered):
- A View, 240x240, borderRadius 120
- Background: radial-ish gradient achieved with LinearGradient from
  accentGlow (rgba 129,140,248,0.08) to transparent
- position absolute, centered, zIndex -1, opacity 0.6

Bottom section:
- "Get Started" button: full width pill, height 56, borderRadius 28
  - LinearGradient: ['#818CF8', '#6366F1']
  - Text: '#FFFFFF', fontWeight '600', fontSize 16
  - No icon — text only, centered
  - Shadow: shadowColor accentGlow, shadowOpacity 0.4, shadowRadius 16
  - On press: scale 0.97 spring + Haptics.impactAsync(Light)
- "Sign in" text link below in textSecondary, 13px

Entrance animation: Moti stagger sequence —
  1. Glow blob appears (opacity 0→0.6, 600ms)
  2. Logo scales in (spring, starts at 400ms)
  3. Title fades up (opacity 0→1, y 8→0, starts at 800ms)
  4. Tagline fades up (starts at 950ms)
  5. Button fades up (starts at 1100ms)

Remove the scan line from this screen — it breaks the Apple reveal feeling.
The slow reveal IS the animation on this screen.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 6 — REDESIGN THE LOGIN SCREEN (app/login.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep auth logic. Replace all visual styling.

Background: bgSplash (#000000) — same true black as splash.

Layout:
- Top half: VaultLogo centered (size 64) + a very subtle indigo radial
  glow behind it (same technique as splash, slightly smaller)
- "Welcome back." — fontSize 32, fontWeight '300', textPrimary,
  letterSpacing -1.2, textAlign center, marginTop 20
- Subtitle: "Sign in to access your vault." — fontSize 15, textSecondary,
  textAlign center, marginTop 6

Google button (the most important element on this screen):
- Full width, height 58, borderRadius 29
- Background: #FFFFFF — pure white — maximum contrast on black
- Left: Google G logo SVG (react-native-svg, 22x22, official Google colors)
- Text: "Continue with Google" — color '#1A1A1A', fontSize 16, fontWeight '600'
- Spacing: G logo then 10px gap then text, all centered as a row
- Inner top highlight: LinearGradient from rgba(255,255,255,0.15) to transparent,
  height 50%, positioned at top of button — makes it feel physically raised
- Shadow: shadowColor '#000', shadowOpacity 0.25, shadowRadius 16, elevation 8
- Loading state: ActivityIndicator replaces G logo, text → "Signing in..."
- On success: button flashes with a very brief emerald tint (150ms) then navigates
- On error: button shakes (x oscillation) + brief rose tint + error text appears

Error text: textSecondary color rose, 13px, centered, fades in below button.
Terms text: "#48484A", 11px, centered, below error.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 7 — REDESIGN HOME SCREEN (app/(tabs)/index.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep all data/mock logic. Replace all visual layout and styling.

Background: bgPrimary (#0A0A0F)
Add paddingBottom: 100 at the very bottom (tab bar clearance).
Use a ScrollView as the root container.
Horizontal padding for all sections: 16px.

**HEADER**:
Row: left text column + right notification bell
- "Good morning, {firstName}" — fontSize 13, textSecondary, marginBottom 2
- Phone number or name — fontSize 17, fontWeight '600', textPrimary, letterSpacing -0.3
- Bell icon: size 22, textSecondary. If alerts > 0: 8px rose dot, top-right absolute.
  Bell plays ONE swing animation on mount (rotate -12→12→-8→8→0, 600ms total).
- Below header: "✦ Gemini Active" pill
  - Background: accentDim, borderRadius 999, paddingH 10, paddingV 4, height 26
  - Text: fontSize 11, color accent, fontWeight '500'
  - Pulse animation: opacity 0.5→1→0.5, 3s infinite (very slow — subtle)

**HERO CARD** (GlassCard, full width, padding 20):
- Use the HeroAmount component:
  - label: "TOTAL SPENT THIS MONTH"
  - amount: 24830
  - subLabel: "↑ 12% vs last month  ·  47 receipts"
  - size: 'hero', animate: true
- Below amount: mini sparkline chart
  - Victory AreaChart, height 52, no axes, no labels, no padding
  - Colors: chartArea gradient, line accentBright 1px
  - No grid lines at all
- marginTop: 20

**QUICK STATS ROW** (3 GlassCards, horizontal, equal width):
- Container: flexDirection row, gap 10, marginTop 16
- Each card: flex 1, padding 16, borderRadius 20
- Inside each card (vertical stack):
  - Icon in a small colored circle (28x28, borderRadius 14)
    - Expiring: amberDim background, amber icon
    - Protected: emeraldDim background, emerald icon
    - This Week: accentDim background, accent icon
  - Number: fontSize 28, fontWeight '300' (THIN), count-up, color matches icon
  - Label: fontSize 11, textTertiary, fontWeight '600', letterSpacing 0.8,
    uppercase, marginTop 4
- Glowing border-less — the icon color subtly implies the card's meaning
- For Expiring card: if count > 0, add glowColor='amber' to GlassCard

**DEADLINE WATCH SECTION**:
- SectionHeader: label "Deadline Watch", actionLabel "See all"
- ALL deadline items grouped in ONE GlassCard (not separate cards)
- Use ListRow inside the GlassCard for each deadline
- Each row:
  - Left: a colored dot (8px circle) — rose/amber/cyan
  - urgencyColor prop on ListRow: the matching color (vertical bar)
  - title: store name
  - subtitle: item name
  - right: Column with "Xd left" in MonoText + DeadlineBadge below
  - showSeparator: true (except last row)
- The grouped card approach makes this feel iOS-native

**RECENT RECEIPTS** (horizontal scroll):
- SectionHeader: label "Recent Receipts", actionLabel "View All"
- Horizontal FlatList, showsHorizontalScrollIndicator: false
- Each card: width 160, marginRight 12, GlassCard with padding 14
  - Store initial circle: 36x36, borderRadius 18, accentDim background
    Text: accent, fontSize 16, fontWeight '700'
  - Store name: fontSize 13, fontWeight '600', textPrimary, marginTop 10
  - Date: fontSize 11, textTertiary, marginTop 2, fontFamily mono
  - Amount: HeroAmount size='large', fontSize 22 (override), marginTop 10
  - Category pill at bottom: bgTertiary, 10px radius, textTertiary, 11px

**SPENDING THIS WEEK**:
- SectionHeader: label "Spending This Week"
- GlassCard, full width, padding 16, height 200
- Victory AreaChart inside:
  - Fill: gradient from chartArea[0] to chartArea[1]
  - Line: accentBright (#A5B4FC), strokeWidth 1.5
  - X axis: dates in textTertiary, fontSize 10
  - No Y axis at all
  - Touch interaction: vertical cursor line + floating tooltip (GlassCard mini)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 8 — REDESIGN RECEIPTS SCREEN (app/(tabs)/receipts.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: bgPrimary. Horizontal padding: 16px.

**HEADER** (large iOS-style title):
- "Receipts" — fontSize 34, fontWeight '700', textPrimary, letterSpacing -0.8
- Count pill: bgTertiary, borderRadius 999, paddingH 10, paddingV 4
  Text: textSecondary, fontSize 13, monoFont. E.g. "47"
- Row: title left, count pill right

**SEARCH BAR** (iOS Spotlight style):
- Full width, height 44, borderRadius 22 (pill)
- Background: bgTertiary
- Border: 0.5px glassBorder
- Left icon: Search (Lucide), size 16, textTertiary
- TextInput: textPrimary, fontSize 15, placeholder textTertiary
- On focus: border transitions to glassBorderActive + scale 1.01 spring
- marginTop: 16

**FILTER PILLS** (horizontal scroll):
- marginTop: 12
- Each pill: height 30, paddingH 14, borderRadius 15
  Inactive: background glassMedium, border 0.5px glassBorder, text textSecondary 13px
  Active: background accentDim, NO border, text accent 13px fontWeight '600'
- Pills: All | Electronics | Food | Fashion | Groceries | Other
- Switching: active pill gets accentDim bg with spring, others reset

**VIEW TOGGLE** (top right — list vs grid):
- Two small icon buttons: List icon + Grid icon
- Active: accent color. Inactive: textTertiary.
- A small pill background slides between them (same technique as tab bar indicator)

**LIST VIEW** — receipts grouped by date:
Groups: "Today", "Yesterday", "This Week", "Earlier"
Each group:
- Group label: SectionHeader (no action link, just label)
- GlassCard wrapping all rows in that group
- Each row is a ListRow:
  - Left: store initial circle (36x36, colored bg based on category, letter)
  - title: store name + fontWeight 600
  - subtitle: item count or top item name
  - right: amount MonoText accent + DeadlineBadge below
  - showSeparator: true except last row
  - onPress: navigate to receipt/[id]
  - Swipe left reveals delete (rose), swipe right reveals share (accent)

**GRID VIEW** — 2-column grid:
- 2 columns, gap 12
- Each card: GlassCard, padding 14, borderRadius 20
  - Store initial large (40x40 circle)
  - Store name fontSize 13 semibold
  - Date fontSize 11 textTertiary mono
  - Amount HeroAmount size='large' (22px)
  - DeadlineBadge at bottom

Empty state: centered, 40px vault icon SVG (react-native-svg outline style),
"No receipts" textPrimary, helper text textSecondary, "Send a photo on WhatsApp"
button (accentDim bg, accent text, borderRadius 20).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 9 — REDESIGN RECEIPT DETAIL (app/receipt/[id].tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: bgPrimary. This is a stack screen pushed over tabs.

**RECEIPT IMAGE** (cinematic treatment):
- Full width, height 280, no borderRadius at top
- Image fills the area. Use resizeMode 'cover'.
- Over the image at the BOTTOM: a LinearGradient overlay
  from transparent at top to bgPrimary at bottom (height 160, position absolute)
  This blends the image into the app background — looks cinematic.
- Over the image at TOP: StatusBar area with a floating back button
  - Back button: glassMedium pill, 36x36, borderRadius 18, centered back-arrow icon
    Position absolute top-safe-area left-16. Tappable with spring scale.
- "✦ Gemini 2.0" badge: bottom-left over the gradient, accentDim bg,
  purple text "#C084FC", fontSize 11, fontWeight '600', borderRadius 8,
  paddingH 8, paddingV 4.

**CONTENT** (below image, scrollable):
Padding: horizontal 16, starts right after image.

Store name: fontSize 28, fontWeight '300' (THIN), textPrimary, letterSpacing -1

Amount row: HeroAmount component, size='hero', no label, animate true

Metadata pills (row, gap 8, marginTop 12):
- Date pill: bgTertiary, borderRadius 10, paddingH 12, paddingV 6
  Text: monoFont, textSecondary, fontSize 13
- Category pill: same style
- Payment mode pill: same style

**RETURN WINDOW** (if deadline exists):
GlassCard with glowColor='amber', marginTop 20, padding 16:
- "RETURN WINDOW" SectionHeader style label inside card
- Days remaining countdown: 3 tiles in a row (Days | Hours | Minutes)
  Each tile: bgTertiary, borderRadius 12, 60x60, centered
  Number: monoFont, fontSize 28, fontWeight '300', amber
  Label: fontSize 10, textTertiary, uppercase below
  Tiles have gap 8
- "Expires on [date]" — textTertiary, 13px, marginTop 12

**ITEMIZED TABLE** (GlassCard, marginTop 16):
- "ITEMS" label at top of card (SectionHeader style, inside card)
- Each item: ListRow (title=item name, subtitle=quantity, right=price MonoText)
  No urgencyColor. showSeparator true except last.
- Total row: bgTertiary strip at bottom of card, paddingH 16 paddingV 12
  "Total" left in textSecondary + amount right in monoFont accent fontWeight '600'

**ACTION BUTTONS** (fixed at bottom, above safe area):
- Container: bgElevated, paddingH 16, paddingT 12, paddingB safe-area-inset-bottom
  Border top: 0.5px separator
- "Share via WhatsApp" — full width, height 50, borderRadius 25
  Background: LinearGradient accent → #6366F1. Text white fontWeight '600'.
- Row below: "Re-extract with AI" (accentDim bg, accent text) flex 1 +
  "Delete" (roseDim bg, rose text) flex 1. Gap 10.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 10 — REDESIGN DEADLINES SCREEN (app/(tabs)/deadlines.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Background: bgPrimary. Padding horizontal 16.

**HEADER**:
"Deadlines" — large iOS title style (fontSize 34, fontWeight '700', textPrimary)
Subtitle: "{n} items need attention" in textSecondary 15px if any urgent.

**URGENCY TRIAGE ROW** (3 GlassCards, horizontal, equal width):
- Today: glowColor='rose', number in rose, "Today" label, amber bar left
- This Week: glowColor='amber', number in amber, "This Week" label
- Safe: glowColor='emerald', number in emerald, "Safe" label
Each: flex 1, gap 10, padding 14, centered content.

**FEATURED URGENT CARD** (only if something expires today or tomorrow):
Full-width GlassCard, glowColor='rose', padding 20:
- "URGENT" label in rose uppercase 11px tracking 1.2
- Store name: fontSize 24, fontWeight '300', textPrimary
- Item: textSecondary, 15px
- Countdown tiles (Days/Hours/Minutes) — same as receipt detail
- "Tap to view receipt →" — accent, 13px, marginTop 16

**MAIN LIST** (all deadlines, grouped by urgency):

Group 1 label: "TODAY & TOMORROW" (if any)
Group 1: GlassCard with ListRow items, urgencyColor=rose for each row.

Group 2 label: "THIS WEEK" (if any)
Group 2: GlassCard with ListRow items, urgencyColor=amber.

Group 3 label: "UPCOMING" (if any)
Group 3: GlassCard with ListRow items, urgencyColor=Colors.accent.

Each ListRow right side: "[N] days" in monoFont, the urgency color, fontWeight '300' fontSize 22.
Below: exact date in textTertiary, 11px monoFont.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 11 — BUILD SPENDING SCREEN FROM SCRATCH (app/(tabs)/spending.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This screen does not exist visually. Build it fresh using mock data.
Import spending data from frontend/src/lib/mockData.ts.

Background: bgPrimary. Padding horizontal 16. ScrollView root.
paddingBottom 100 for tab bar clearance.

**HEADER**:
"Spending" — fontSize 34, fontWeight '700', textPrimary, letterSpacing -0.8

**PERIOD SELECTOR** (3 pills: Week / Month / Year):
- Horizontal row, gap 8, marginTop 16
- Each pill: height 34, paddingH 18, borderRadius 17
  Inactive: bgTertiary, textSecondary, 14px
  Active: accentDim background, accent text, fontWeight '600'
- One sliding indicator pill underneath (Reanimated, same as tab bar technique)
- On switch: hero amount re-animates (count up to new value)

**HERO AMOUNT**:
HeroAmount component, animate=true, label="TOTAL", subLabel based on period.
marginTop: 20.

**CHART** (GlassCard, full width, padding 16, marginTop 16):
- "SPENDING OVER TIME" SectionHeader inside card, no action
- Victory AreaChart, height 160, width: card content width
- gradient area fill (chartArea gradient), line accentBright 1.5px
- Only X-axis labels (dates), textTertiary, fontSize 10
- Touch: cursor line + GlassCard tooltip floating at touch point

**CATEGORY BREAKDOWN** (GlassCard, marginTop 16, padding 16):
- "WHERE IT GOES" SectionHeader inside card
- Horizontal stacked bar at top:
  - Full width, height 8, borderRadius 4
  - Each segment is a View with the category color and proportional flex
  - Segments animate their flex from 0 to actual value using withTiming
  - borderRadius on first segment left and last segment right
- Below the bar: gap 16, each category row:
  - Row: colored 8px circle dot + category name (textPrimary, 15px) +
    spacer flex1 + percentage (textTertiary, 13px mono) + amount (accent, 13px mono bold)
  - Category colors: Food=amber, Electronics=accent, Fashion=purple,
    Groceries=emerald, Other=textTertiary

**TOP MERCHANTS** (GlassCard, marginTop 16, padding 16):
- "TOP STORES" SectionHeader inside card
- 5 rows: rank number (fontSize 22, fontWeight '300', textTertiary, width 32) +
  store name (textPrimary, 15px, flex 1) + amount (monoFont, accent, 13px)
- ListRow structure, showSeparator true except last

**AI INSIGHT CARD** (GlassCard, marginTop 16, glowColor='none', padding 16):
- Left border accent: position absolute, left 0, top 0, bottom 0, width 3,
  backgroundColor accent, borderRadius left side.
- "✦ AI Insight" — accent, fontSize 13, fontWeight '600', marginBottom 8
- Insight text in textSecondary, 15px, lineHeight 1.6
- "Ask about my spending →" — accent, 13px, fontWeight '500', marginTop 12

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 12 — REDESIGN SETTINGS SCREEN (app/(tabs)/settings.tsx)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Keep all auth/toggle logic. Replace all visual styling.

Background: bgPrimary. ScrollView, paddingH 16, paddingBottom 100.

**HEADER** (iOS large title):
"Settings" — fontSize 34, fontWeight '700', textPrimary, letterSpacing -0.8

**PROFILE CARD** (GlassCard, marginTop 16, padding 20):
- Row: user photo (expo-image, 52x52, borderRadius 26, fallback initials circle) +
  text column (flex 1, marginLeft 14) + "›" chevron right
- Name: fontSize 17, fontWeight '600', textPrimary
- Email: fontSize 13, textSecondary, marginTop 2
- Below row: "ReceiptVault · Samsung PRISM 2026" — accentDim background pill,
  accent text, fontSize 11, fontWeight '600', borderRadius 6, paddingH 8,
  paddingV 3, alignSelf 'flex-start', marginTop 12

**SECTION GROUPS** (each is a GlassCard):
Add SectionHeader label ABOVE each card (outside the card).

Group 1 — "NOTIFICATIONS":
  - Quiet Hours (row with time value right, tappable)
  - Alert Frequency (row with current value right)
  - Deadline Alerts (row with AnimatedToggle right)
  - Spending Alerts (row with AnimatedToggle right)

Group 2 — "APPEARANCE":
  - "Vault Mode" (AnimatedToggle, row with description "Enhanced glow & effects")
  - The toggle active color: accent (#818CF8)

Group 3 — "CONNECTED SERVICES":
  - WhatsApp row: green dot (8px) + "WhatsApp" + "Connected" right in emerald, 13px
  - Telegram row: textTertiary dot + "Telegram" + "Not connected" right in textTertiary

Group 4 — "DATA":
  - Download My Data (row, accent color text, no right content)
  - Clear History (row, rose color text, no right content)

Group 5 — "ABOUT":
  - "Version 1.0.0" row, textSecondary right
  - "Samsung PRISM 2026" row, textSecondary right
  - "✦ Powered by Gemini 2.0" row, purple text, textSecondary right

**SIGN OUT** (standalone, outside all GlassCards, marginTop 24):
- Centered Text: "Sign Out" — rose, fontSize 17, fontWeight '500'
- No card wrapper, no border, just the text as a Pressable
- On press: confirmation BottomSheet → then signOut() + redirect

All ListRow items inside group cards must have showSeparator=true except
the last row of each card. First and last rows get the card's border radius.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 13 — UPDATE ANIMATED COMPONENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### DeadlineBadge.tsx
Restyle to use new color system. Keep same logic.
Pills: borderRadius 8 (not full round), paddingH 8, paddingV 4, fontSize 11.
Background: roseDim/amberDim/emeraldDim. Text: rose/amber/emerald.
FontWeight '600'. No border. MonoFont.
"Today!" badge: rose bg, rose text, subtle pulse opacity (0.7→1→0.7, 1.5s).

### AnimatedToggle.tsx
Restyle. Thumb: white. Track on: accent. Track off: bgTertiary.
Border: 0.5px glassBorder always. Smoother spring physics.

### SkeletonLoader.tsx
Replace shimmer gradient with a simple pulse (opacity 0.3→0.5→0.3, 1.5s).
Background: bgTertiary. No moving gradient — more restrained (iOS style).
Shape: same width/height/borderRadius as content it replaces.

### PillButton.tsx
Update primary variant: gradient ['#818CF8', '#6366F1'].
Update secondary variant: bgTertiary, glassBorder, textPrimary.
Update danger variant: roseDim bg, rose text.
All buttons: height 50, borderRadius 25, fontWeight '600', fontSize 16.
Add glow shadow to primary: shadowColor accentGlow, shadowOpacity 0.35.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 14 — GLOBAL ANIMATION STANDARDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Apply these animation rules across ALL screens:

**Screen entrance**: Every screen mounts with a very subtle opacity 0→1 fade
(withTiming, 200ms, Easing.out(Easing.quad)). Nothing slides up — just fades.
This feels more iOS-native and refined than sliding elements.

**Stagger on lists**: List items on Receipts, Deadlines, Settings stagger in
using Moti's MotiView with a delay array. Delay per item: index * 40ms.
Each item: opacity 0→1, y 6→0. Very subtle — iOS doesn't overdo it.

**Card press**: All GlassCard with onPress do scale 0.97 (already in component).

**Number entrance**: All HeroAmount components animate count-up on mount (built in).

**Header compression on scroll**: On Receipts, Deadlines, Spending screens:
As user scrolls past 20px, the large title (34px bold) smoothly transitions
to a smaller centered title (17px semibold) in the header area.
Use ScrollView onScroll + Reanimated interpolation for this.
This is the iOS large title behavior — it is very polished.

**Haptics** — lighter than before:
- All navigation: Haptics.selectionAsync()
- Primary buttons (CTA, Sign In): Haptics.impactAsync(Light)
- Success: Haptics.notificationAsync(Success)
- Error / warning: Haptics.notificationAsync(Warning)
- Destructive confirm: Haptics.notificationAsync(Error)
- Toggle: Haptics.selectionAsync()

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## STEP 15 — THINGS TO REMOVE / CLEAN UP
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Remove or replace these from the entire codebase:

1. ALL references to the old cyan color (#63B3ED) → replace with accent (#818CF8)
2. ALL looping animated border effects from GlowCard — GlassCard has no loop
3. ALL full-width bottom tab bar styling — replaced by floating pill
4. ANY bold heavy section headers with emoji — use SectionHeader component
5. ALL individual floating deadline row cards → grouped in one GlassCard
6. The ScanLine component — remove from all screens (keep file, just don't render it)
7. ALL bgPrimary '#080B14' references → update to '#0A0A0F' (new warmer black)
8. ANY accentCyan references → accent
9. The "+" prefix in the Gemini Active pill
10. Heavy colored store initial circles → smaller, glassMedium bg, accent letter

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## CRITICAL RULES — DO NOT BREAK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ❌ Do NOT touch any backend files (src/, root package.json, docker-compose.yml)
- ❌ Do NOT change routing structure (Expo Router file names/paths stay the same)
- ❌ Do NOT change auth logic in AuthContext.tsx or auth.ts
- ❌ Do NOT change mock data in mockData.ts
- ❌ Do NOT change the useCountUp hook logic
- ❌ Do NOT use any white or light backgrounds (except login/splash button)
- ❌ Do NOT introduce new dependencies without checking frontend/package.json first
- ✅ Every screen must show real content from mockData on load
- ✅ All haptics must use the lighter intensities defined in Step 14
- ✅ All amounts must use Indian number format (₹1,24,830)
- ✅ All dates must be DD/MM/YYYY
- ✅ GlassCard must be used for every card element in the app
- ✅ HeroAmount must be used for every primary amount displayed
- ✅ ListRow must be used for all list/settings rows inside glass cards

Execute all 15 steps completely without stopping. Do not ask questions.
Make decisions based on these instructions. When complete, all 8 screens
must be visually redesigned using the Obsidian & Pearl system.
```
