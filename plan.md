# ReceiptVault — Cursor Mobile App Build Prompt
## Samsung PRISM Hackathon 2026

---

> **How to use this file**: Copy everything inside the CURSOR PROMPT section
> and paste it directly into Cursor with this file attached. Everything before
> the prompt is for your reference only.

---

## Project Context (Your Reference)

ReceiptVault is an AI-powered receipt management system that works over WhatsApp.
Users photograph receipts, the system extracts data via Gemini Vision, and
autonomously monitors return deadlines, warranties, subscriptions, and spending
patterns — sending proactive alerts back via WhatsApp.

**Backend already built by teammates:**
- Node.js 22 + Express + TypeScript
- Supabase (PostgreSQL + pgvector)
- BullMQ + Redis
- Gemini 2.0 Flash (Vision + Embeddings)
- Cloudflare R2 (image storage)
- WhatsApp Business API

**Your job**: Build the ReceiptVault mobile app — a companion app to the WhatsApp
bot that gives users a beautiful visual interface to their receipt data.

---

# ═══════════════════════════════════════════════════
# CURSOR PROMPT — PASTE EVERYTHING BELOW
# ═══════════════════════════════════════════════════

```
⚠️ CRITICAL INSTRUCTION — READ THIS FIRST BEFORE DOING ANYTHING ⚠️

The existing project repository already has a backend built by other teammates.
DO NOT touch, modify, delete, or interfere with ANY existing files or folders
in the repository. DO NOT install packages at the root level. DO NOT edit any
existing .env files, backend configs, docker-compose.yml, or any backend code.

Your ONLY job is to create a brand new folder called `frontend/` at the root
of the repository and build the entire mobile app inside it.
All your work lives exclusively inside `frontend/`. The backend is untouched.

Steps to start:
1. Create a `frontend/` folder at the root of the project
2. Run `npx create-expo-app . --template blank-typescript` INSIDE `frontend/`
3. Install all dependencies INSIDE `frontend/` only
4. Never run any command outside of the `frontend/` directory
5. The `frontend/` folder is a completely self-contained Expo app with its own
   package.json, app.json, and .env file

If you are ever unsure whether an action affects the backend — DO NOT do it.
Only create, edit, or delete files inside `frontend/`.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build a complete, production-grade React Native (Expo) mobile application called
"ReceiptVault" — an AI-powered receipt intelligence app for the Samsung PRISM
Hackathon 2026. The UI must be extraordinary, premium, and unlike anything judges
have seen before. Think: the Robinhood app meets a sci-fi vault interface. Every
screen must feel like it belongs in a flagship fintech product from 2028.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## TECH STACK (all inside `frontend/` only — never touch root)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

All packages installed via npx expo install or npm install run strictly inside
the `frontend/` directory. Never touch the root-level package.json.

- React Native + Expo SDK 51 (managed workflow)
- TypeScript (strict mode)
- Expo Router v3 (file-based routing)
- React Native Reanimated 3 (ALL animations — never use the old Animated API)
- React Native Gesture Handler (swipe gestures, pull-to-refresh)
- Moti (Framer Motion-inspired animations built on Reanimated — staggered lists,
  enter/exit animations, skeleton loaders)
- Victory Native XL (charts — AreaChart, PieChart, BarChart)
- Expo Linear Gradient (gradient backgrounds, cards, buttons)
- Expo Blur (BlurView for glassmorphism effects on the tab bar)
- @expo-google-fonts/space-grotesk + @expo-google-fonts/dm-sans
- React Native SVG (inline SVG icons and the vault logo illustration)
- Expo Haptics (tactile feedback on every button press and swipe)
- Expo Status Bar
- date-fns (date formatting)
- Axios (API calls to backend at EXPO_PUBLIC_API_URL, default localhost:3000)
- AsyncStorage (local auth token + user preferences)
- React Native Safe Area Context
- React Native Screens

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## AESTHETIC DIRECTION — "DARK VAULT FUTURISM"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The visual identity must feel like a premium fintech app meets a sci-fi vault.
Dark everywhere. Sharp. Sophisticated. Slightly mysterious. Every screen is dark.
Think Robinhood dark mode + the look of a high-security digital safe.

### Color System (define in src/constants/colors.ts)

```typescript
export const Colors = {
  bgPrimary: '#080B14',
  bgSecondary: '#0D1120',
  bgTertiary: '#111827',
  bgElevated: '#161D2F',

  borderSubtle: 'rgba(99, 179, 237, 0.08)',
  borderGlow: 'rgba(99, 179, 237, 0.28)',
  borderActive: 'rgba(99, 179, 237, 0.55)',

  accentCyan: '#63B3ED',
  accentCyanBright: '#90CDF4',
  accentAmber: '#F6AD55',
  accentEmerald: '#68D391',
  accentRose: '#FC8181',
  accentPurple: '#B794F4',

  textPrimary: '#F7FAFC',
  textSecondary: '#A0AEC0',
  textMuted: '#4A5568',

  gradientCyan: ['#63B3ED', '#4299E1'] as const,
  gradientCard: ['rgba(13,17,32,0.95)', 'rgba(8,11,20,0.98)'] as const,
}
```

### Typography (define in src/constants/typography.ts)

- Headings: SpaceGrotesk_700Bold, letterSpacing: -0.5
- Body: DMSans_400Regular and DMSans_500Medium
- Numbers / Amounts / Dates / IDs: Platform.select monospace font, wrapped
  in a reusable <MonoText> component defined once and used everywhere
- Font scale: xs:11, sm:13, base:15, md:17, lg:20, xl:24, xxl:30, xxxl:38, hero:48

### Signature Visual Effects (implement ALL of these)

1. SCAN LINE ON LAUNCH: When the app first opens, a single 1px horizontal
   cyan line (opacity 0.6) sweeps from top to bottom of the screen exactly once
   using Reanimated withTiming over 800ms. Implemented in root _layout.tsx,
   plays only on first mount. This is the "system boot" moment.

2. GLOWING CARD BORDERS: Every GlowCard has a 1px LinearGradient border that
   loops from borderSubtle → borderGlow → borderSubtle using Reanimated
   withRepeat + withTiming (3s cycle). On press: border snaps to borderActive
   with withSpring. Build this as a reusable GlowCard component.

3. HAPTICS EVERYWHERE:
   - Nav tab press: Haptics.impactAsync(ImpactFeedbackStyle.Light)
   - Primary CTA button press: Haptics.impactAsync(ImpactFeedbackStyle.Medium)
   - Success action (receipt confirmed): Haptics.notificationAsync(Success)
   - Deadline warning: Haptics.notificationAsync(Warning)
   - Destructive action: Haptics.notificationAsync(Error)

4. COUNT-UP ANIMATIONS: Every stat number (total spent, receipt count, days left)
   counts from 0 to its real value when the screen mounts. Build a useCountUp
   hook using Reanimated's useSharedValue + withTiming + useDerivedValue.
   Format output using Indian number system (₹1,24,830 not ₹124,830).

5. SKELETON LOADERS: All data screens show animated skeleton screens while
   loading — never spinners. Use Moti's MotiView with a looping shimmer
   (bgSecondary → bgTertiary → bgSecondary, 1.2s infinite). Every skeleton
   must precisely match the shape of the real content it replaces.

6. BOTTOM SHEETS: All detail views, filters, and confirmations open as
   bottom sheets that slide up with spring physics (damping:20, stiffness:300).
   Backdrop fades to 0.65 opacity. Use Modal + Reanimated for this.

7. SWIPE GESTURES: Receipt cards support swipe-left (reveal red delete) and
   swipe-right (reveal cyan share). Use Gesture Handler Swipeable. Add haptic
   feedback as the swipe threshold is crossed.

8. PULL TO REFRESH: Every list screen has pull-to-refresh with a custom
   animated indicator — a spinning cyan VaultLogo icon.

9. STACK NAVIGATION TRANSITIONS: Pushing a screen: new screen slides in from
   right while old screen fades to opacity 0.8 + scale 0.95. Popping: reverse.
   Configure in Expo Router stack layout options.

10. AMBIENT GLOW BLOBS: On Home and Splash screens, add 2-3 large blurred
    circular gradient orbs positioned absolutely (no interaction). Cyan blob
    top-right, purple blob bottom-left, both at ~0.07 opacity. LinearGradient
    inside a View with borderRadius 9999. They add depth without distraction.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## APP NAVIGATION STRUCTURE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Use Expo Router v3 file-based routing:

```
frontend/app/
├── _layout.tsx              ← Root layout: fonts, safe area, scan line, auth gate
├── index.tsx                ← Splash / onboarding
├── login.tsx                ← Phone + OTP login
├── (tabs)/
│   ├── _layout.tsx          ← Custom floating bottom tab bar
│   ├── index.tsx            ← Home / Dashboard
│   ├── receipts.tsx         ← Receipts list
│   ├── deadlines.tsx        ← Deadline tracker
│   ├── spending.tsx         ← Spending analytics
│   └── settings.tsx         ← Settings
└── receipt/
    └── [id].tsx             ← Receipt detail (stack screen over tabs)
```

### Custom Bottom Tab Bar (build in src/components/BottomTabBar.tsx)

Build a fully custom tab bar — do NOT use Expo Router's default tab bar styling.

- Position: absolute, bottom: 20, left: 16, right: 16
- Background: bgElevated + BlurView intensity 40 (frosted glass look)
- Shape: borderRadius 28, border 1px borderSubtle
- 5 tabs with Lucide icons: Home, Receipt, Clock, BarChart2, Settings
- Active tab: a pill-shaped bgTertiary highlight (accentCyan 15% opacity)
  that SLIDES between tabs using Reanimated withSpring (do not jump-cut)
- Active icon: accentCyan, scale 1.1 with spring
- Inactive icon: textMuted, scale 1.0
- Every tab press: Haptics.impactAsync Light
- Sits above bottom safe area inset

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SCREEN DESIGNS — DETAILED SPECS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

### 1. SPLASH / ONBOARDING (`app/index.tsx`)

The very first screen. Make it unforgettable.

Full screen bgPrimary + ambient glow blobs (cyan top-right, purple bottom-left).

Center content (Moti stagger entrance, 80ms between each element):
- VaultLogo SVG (react-native-svg inline hexagon with keyhole cutout, cyan→purple
  gradient fill). On mount: scale 0 → 1.1 → 1.0 with spring overshoot.
  After settling: the outer hexagon ring slowly rotates continuously (360deg,
  20s, infinite, linear) using Reanimated withRepeat.
- "ReceiptVault" SpaceGrotesk_700Bold fontSize 38 textPrimary, slides up y:20→0
  opacity 0→1, delay 300ms.
- "Your financial memory, secured." DMSans fontSize 15 textSecondary, fade in
  delay 500ms.

Bottom section:
- "Get Started" full-width pill button, LinearGradient (accentCyan → #4299E1),
  SpaceGrotesk_700Bold text in dark color. On press: scale 0.97 spring +
  Haptics Medium + navigate to /login.
- "Already have an account? Sign in" textMuted below, tappable.

Scan line effect plays once on this screen (see signature effect #1).

---

### 2. LOGIN SCREEN (`app/login.tsx`)

Header: "Access Your Vault" in SpaceGrotesk_700Bold fontSize 28 textPrimary.
Subtitle: "Enter your number to continue" textSecondary fontSize 14.

Phone input:
- Row: 🇮🇳 flag + "+91" label (bgTertiary, borderRadius 12, padding H:12) +
  TextInput (keyboardType phone-pad, flex 1, bgTertiary)
- Full row: borderRadius 16, border 1px borderSubtle, height 56
- On focus: border → borderActive with withSpring + cyan shadow glow
- "Send OTP" pill button below (same gradient style as splash CTA)

OTP section (slides up with Moti AnimatePresence after OTP sent):
- 6 single-character TextInput boxes in a row, equally spaced
- Each box: bgTertiary background, 48x56, borderRadius 14, border 1px
- Focused: borderActive + cyan glow shadow
- Filled: borderGlow, MonoText accentCyan SpaceGrotesk_700Bold fontSize 22
- Auto-advance focus to next box on input, backspace goes to previous
- Boxes animate in with Moti stagger (50ms each)

"Enter Vault" button: same gradient pill, full width.

On wrong OTP: all 6 boxes shake (Reanimated withSequence x: 0→-8→8→-8→0,
400ms total) + borders flash accentRose + Haptics Warning.
On correct OTP: borders flash accentEmerald + Haptics Success + navigate to tabs.

---

### 3. HOME / DASHBOARD (`app/(tabs)/index.tsx`)

The most important screen. Mission control for the user's finances.

Header area:
- "Good morning 👋" DMSans textSecondary fontSize 13
- User phone or name SpaceGrotesk_700Bold textPrimary fontSize 17
- Right: notification bell Lucide icon. If unread alerts > 0: red dot badge (8px
  circle, accentRose, position absolute top-right of icon). Bell swings once on
  mount (rotation: -15→15→-10→10→0, Reanimated, plays once on screen focus).
- Below header row: "✦ Gemini Active" pill — accentPurple background 15% opacity,
  border accentPurple 40% opacity, accentPurple text DMSans fontSize 11.
  Slow pulse opacity animation (0.6 → 1.0 → 0.6, 2.5s infinite).

Hero Stat Card (full width, height 180, GlowCard):
- LinearGradient background (bgSecondary → bgTertiary)
- Label: "TOTAL SPENT THIS MONTH" SpaceGrotesk uppercase textMuted fontSize 11
  letterSpacing 1.5
- Amount: ₹24,830 MonoText fontSize 48 textPrimary bold — COUNT UP on mount
- Below: two pills in a row:
  - "↑ 12% vs last month" accentAmber or accentEmerald pill
  - "47 receipts" textSecondary bgTertiary pill
- Bottom: mini Victory AreaChart (no axes, just the gradient shape), last 7 days,
  height 48, area fill accentCyan 35% opacity, line accentCyan 1.5px

Quick Stats Row (3 equal GlowCards, horizontal, stagger in 0/100/200ms):
- Card A: Clock icon in accentAmber circle (32x32) + "4" MonoText fontSize 28
  accentAmber count-up + "Expiring Soon" label. Amber glow border.
  If count > 0: border has more intense pulsing (urgency signal).
- Card B: Shield icon accentEmerald + "12" count-up + "Protected"
- Card C: TrendingUp icon accentCyan + "₹3,240" count-up + "This Week"

Deadline Alerts section:
- Header: "⚡ Deadline Watch" SpaceGrotesk_700Bold textPrimary + "See all" right
- 3 most urgent items, each as a card row (bgSecondary, borderRadius 16):
  - Left: colored urgency dot + store name bold + item name textSecondary
  - Right: "X days left" MonoText urgency-colored + DeadlineBadge pill
  - Rose items (≤1 day): pulsing border animation
- Items slide in from right with Moti stagger (80ms each)

Recent Receipts section:
- Header: "Recent Receipts" + "View All" accentCyan right
- Horizontal ScrollView (peek design: each card 220px wide showing next card edge)
- Each card (height 140, borderRadius 20, bgSecondary, GlowCard):
  - Top: store initial circle (44x44, colored by category) + store name + date MonoText
  - Bottom: amount MonoText accentCyan fontSize 22 bold + category pill
  - "✦ AI" badge top-right corner, accentPurple tiny pill

Spending chart:
- "Spending This Week" header
- Victory AreaChart full width height 160, last 7 days
- Gradient area (accentCyan 40% → transparent), line accentCyan 2px
- On touch/drag: vertical cursor line + floating tooltip card (date + amount,
  Reanimated scale 0→1 spring entrance on first touch)

paddingBottom: 100 at bottom to clear floating tab bar.

---

### 4. RECEIPTS SCREEN (`app/(tabs)/receipts.tsx`)

Header:
- "Receipts" SpaceGrotesk_700Bold fontSize 28 + "47 total" bgTertiary pill
- Search bar: bgTertiary, borderRadius 16, height 48, magnifier icon left,
  TextInput placeholder "Search stores, items..." On focus: borderActive + glow

Category filter pills (horizontal ScrollView, no scroll indicator):
All | Electronics | Food | Fashion | Groceries | Other
- Inactive: bgTertiary, border borderSubtle, height 34, borderRadius 17
- Active: LinearGradient (accentCyan → #4299E1), dark text
- Active indicator slides with Reanimated layout animation
- Tap: Haptics Light

FlatList of receipts (performance — do not use ScrollView + map):
Each row (height 80, bgSecondary, borderRadius 16, marginBottom 8):
- Left: store initial circle 44x44 (color based on category) + store name
  SpaceGrotesk_700Bold + date MonoText textMuted fontSize 12 below
- Right: amount MonoText accentCyan fontSize 17 bold + DeadlineBadge below
- Swipe left: red delete action (Gesture Handler Swipeable)
- Swipe right: cyan share action
- On press: navigate to receipt/[id]
- Mount animation: Moti stagger (opacity 0→1 + y 20→0, 40ms per item)

Empty state: centered SVG vault illustration + "No receipts found" heading +
"Try a different filter or send a photo on WhatsApp" subtext + "Open WhatsApp"
button (green, wa.me deep link).

---

### 5. RECEIPT DETAIL (`app/receipt/[id].tsx`)

Stack screen pushed over tabs.

Header: back arrow (spring scale on press) + store name as title.

Receipt image (full width, height 220, borderRadius 20):
- Skeleton shimmer while loading
- On long press: full-screen image viewer Modal (black bg, pinch-to-zoom)
- "✦ Extracted by Gemini 2.0 Flash" badge overlaid at bottom of image in
  accentPurple with BlurView background

Key info card (bgSecondary, borderRadius 20, below image):
- Store name SpaceGrotesk_700Bold fontSize 24 textPrimary
- Date + Category row, textSecondary fontSize 13
- TOTAL: MonoText fontSize 42 accentCyan bold with COUNT UP animation
- Payment mode as bgTertiary pill

Deadline card (if return deadline exists — amber GlowCard):
- "Return Window" label
- Live countdown: Days | Hours | Minutes in 3 MonoText tiles with flip animation
  (Reanimated, updates every second using a useInterval hook)
- "Expires on [date]" in textMuted

Warranty card (if exists — emerald GlowCard):
- Warranty expiry date + days remaining

Itemized table:
- "Items" section header SpaceGrotesk_700Bold
- Each row: item name flex1 + quantity textMuted + price MonoText accentCyan
- Alternating backgrounds bgSecondary / bgTertiary
- Total row: bold accentCyan, slightly larger, top border 1px borderSubtle

Action buttons (fixed bottom above safe area):
- "Share via WhatsApp" LinearGradient green pill (wa.me deep link)
- Row 2: "Re-extract with AI" (accentPurple border) + "Delete" (accentRose border)

---

### 6. DEADLINES SCREEN (`app/(tabs)/deadlines.tsx`)

Header: "Deadline Guardian" SpaceGrotesk_700Bold fontSize 28 + amber Clock icon.

Urgency summary row (3 mini stat cards):
- 🔴 Today/Tomorrow: count in accentRose, GlowCard rose variant
- 🟡 This Week: count in accentAmber
- 🟢 Upcoming: count in accentEmerald

Main content has TWO views switchable by swiping left/right on the content area:

TIMELINE VIEW (default):
- Vertical scrolling timeline
- 2px vertical line: LinearGradient accentCyan top → transparent bottom
- TODAY marker: glowing 12px cyan dot with a pulsing ring around it
  (Reanimated withRepeat scale 1→1.6 + opacity 1→0, 2s infinite)
- Items positioned relative to today with connecting lines
- Expired items: rose tint, 0.6 opacity, strikethrough on date text
- Today items: accentAmber, pulse border
- Future items: accentCyan → textMuted gradient

Each timeline card:
- bgSecondary, borderRadius 16, left border 4px solid (urgency color)
- Store name bold + item name textSecondary + date MonoText
- Right: "X days" badge pill in urgency color
- Press: navigate to receipt detail

CARD STACK VIEW (swipe to switch):
- Tinder-style stacked cards showing the most urgent deadline on top
- Stack visual: cards behind are scaled 0.95 and 0.90, translated up 8/16px
- Swipe right: card flies off right + accentEmerald flash + Success haptic +
  mark as acknowledged. Spring animation bringing next card forward.
- Swipe left: card flies off left + next card comes forward
- Empty state: "All clear! No urgent deadlines." with emerald checkmark animation

View indicator: 2 small dots at bottom showing which view is active.

---

### 7. SPENDING SCREEN (`app/(tabs)/spending.tsx`)

Period selector: 3 pills "Week" | "Month" | "Year", sliding active indicator.
Switching period triggers count-up re-animation on all numbers.

Hero chart:
- Victory AreaChart full width height 200
- Gradient fill accentCyan → transparent, line accentCyan 2px
- Interactive touch drag: vertical cursor + floating tooltip (scale spring)
- Total for period below chart: MonoText fontSize 36 textPrimary count-up

Category breakdown ("Where Your Money Goes"):
Each category row:
- Left: emoji + name DMSans
- Center: progress track (bgTertiary, height 6, borderRadius 3) with accentCyan
  fill that animates width from 0 → actual % using withTiming when row enters view
- Right: MonoText amount + percentage textMuted
Categories: Food 🍕 amber | Electronics ⚡ cyan | Fashion 👗 purple |
Groceries 🛒 emerald | Other 📦 muted

Top merchants section:
- "Your Top Stores" SpaceGrotesk_700Bold
- Ranked 1-5: rank number + store name + amount MonoText + horizontal mini bar

AI Insight card (accentPurple GlowCard at bottom):
- "✦ AI Insight" header accentPurple
- Insight text like "You spent 34% more at Zomato this week vs your usual.
  Weekend orders are your biggest food category."
- "Ask about my spending →" tappable row → opens bottom sheet with TextInput
  for semantic search queries against the backend

---

### 8. SETTINGS SCREEN (`app/(tabs)/settings.tsx`)

Header: "Settings" SpaceGrotesk_700Bold + user avatar (initials, cyan circle 40x40).

Grouped sections (iOS-style grouped list, but styled dark):

Profile:
- Phone number row + "Verified ✓" accentEmerald badge
- "Notification channel" row → WhatsApp only

Notifications:
- "Quiet Hours" row → tap opens time range bottom sheet
- "Alert Frequency" row → tap opens picker (Immediate / Hourly / Daily)
- "Deadline Alerts" AnimatedToggle
- "Spending Alerts" AnimatedToggle

Appearance:
- "VAULT MODE 🔒" row with AnimatedToggle
  When ON: increases all glow intensities app-wide, makes ambient blobs more
  visible on every screen, plays the scan line on every screen transition instead
  of just launch. Store this preference in AsyncStorage. This is a premium easter
  egg that judges will love — label it "Enhanced Vault Experience".

Data:
- "Download My Data" → triggers mock JSON export
- "Clear Receipt History" → confirmation bottom sheet with "This cannot be undone"

About:
- "ReceiptVault v1.0.0"
- "Built for Samsung PRISM Hackathon 2026"
- "Powered by Gemini 2.0 Flash ✦" row in accentPurple

Every toggle: custom AnimatedToggle component (Reanimated). Pill-shape, thumb
slides left to right, color transitions bgTertiary → accentCyan over 250ms.
Every toggle press: Haptics Light.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## SHARED COMPONENTS (src/components/)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build all of these as reusable components:

GlowCard.tsx: Base card with animated gradient border. Props: children,
glowColor ('cyan'|'amber'|'emerald'|'purple'), intensity ('subtle'|'medium'|'high'),
onPress. Uses Reanimated animated border loop + LinearGradient. Every card in the
app uses this component.

MonoText.tsx: Text with platform monospace font. Props: children, style.
Automatically applies the right font. Used for ALL numbers, dates, receipt IDs,
amounts. Never use regular Text for numeric data.

StatCard.tsx: Quick stat card with count-up. Props: icon, value, label, color,
animate. Wraps GlowCard, includes useCountUp hook internally.

SkeletonLoader.tsx: Shimmer skeleton. Props: width, height, borderRadius, style.
Moti MotiView with looping gradient shimmer.

DeadlineBadge.tsx: Status pill. Props: daysLeft (number or null). Auto-selects:
rose "Today!" / amber "X days left" / emerald "Safe ✓" / muted "No deadline".
Applies urgency pulse animation if daysLeft <= 1.

BottomSheet.tsx: Custom modal bottom sheet. Props: visible, onClose, title, height,
children. Reanimated slide-up spring + backdrop dim.

AnimatedToggle.tsx: Custom iOS-style toggle. Props: value, onToggle, activeColor.
Reanimated thumb + background transition.

ScanLine.tsx: Boot scan line effect. Renders absolutely positioned over full screen,
Reanimated translateY sweep top-to-bottom 800ms, then unmounts via state.

VaultLogo.tsx: The hexagon keyhole SVG. Props: size, animated. Built with
react-native-svg Polygon + Path for the keyhole. Animated prop enables the
continuous ring rotation.

PillButton.tsx: Reusable gradient pill button. Props: label, onPress, variant
('primary'|'secondary'|'danger'), loading. Primary uses LinearGradient cyan.
Loading state shows a spinning small icon inside the button. All presses have
scale 0.97 spring + appropriate haptics.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## MOCK DATA (src/lib/mockData.ts)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Create this file with realistic data. All amounts in ₹, dates in DD/MM/YYYY.

Receipts array (15+ entries):
- Reliance Digital: Samsung 55" QLED TV — ₹82,990 — return deadline: 2 days from now
- Myntra: Nike Air Force 1 — ₹7,495 — return deadline: 5 days from now
- Flipkart: boAt Airdopes 141 — ₹1,299 — return deadline: 1 day from now (URGENT)
- Amazon.in: Kindle Paperwhite — ₹11,999 — warranty: 1 year from purchase
- Zomato: Weekend dinner — ₹847 — no return deadline
- BigBasket: Monthly groceries — ₹3,240 — no return
- D-Mart: Weekly vegetables — ₹560 — no return
- Croma: realme Buds — ₹999 — return expired 2 days ago
- Swiggy: Lunch order — ₹342 — no return
- Nykaa: Skincare set — ₹2,100 — return: 8 days
- H&M: Winter jacket — ₹4,999 — return: 14 days
- JioMart: Household items — ₹1,850 — no return
- Decathlon: Running shoes — ₹3,499 — return: 30 days
- Boat Lifestyle: Speaker — ₹2,299 — warranty: 1 year
- Lenskart: Eyeglasses — ₹5,499 — return: 7 days

Subscriptions (5 entries):
- Netflix Premium — ₹649/month — renews in 4 days
- Spotify Premium — ₹119/month — renews in 12 days
- Amazon Prime — ₹1,499/year — renews in 45 days
- YouTube Premium — ₹189/month — renews in 2 days (URGENT)
- Disney+ Hotstar — ₹899/year — renews in 90 days

Spending by month (last 6 months):
{ month: 'Jul', amount: 28900 },
{ month: 'Aug', amount: 19800 },
{ month: 'Sep', amount: 22100 },
{ month: 'Oct', amount: 31500 },
{ month: 'Nov', amount: 18200 },
{ month: 'Dec', amount: 24830 },

Category breakdown:
Food: 28% ₹6,952 | Electronics: 35% ₹8,690 | Fashion: 18% ₹4,469 |
Groceries: 12% ₹2,980 | Other: 7% ₹1,739

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## WHAT NOT TO DO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- ❌ Do NOT use React Native's old Animated API — use Reanimated 3 everywhere
- ❌ Do NOT use white or light backgrounds on any screen
- ❌ Do NOT use the default Expo Router tab bar — build the custom one specified
- ❌ Do NOT use ActivityIndicator/spinner — skeleton loaders everywhere
- ❌ Do NOT skip haptics on any interactive element
- ❌ Do NOT hardcode color strings — always use Colors constants from colors.ts
- ❌ Do NOT use regular Text for numbers or amounts — use MonoText component
- ❌ Do NOT build any screen without mock data showing on it
- ❌ Do NOT skip the GlowCard border animation — it is the app's signature detail
- ❌ Do NOT touch any files outside the `frontend/` folder
- ❌ Do NOT use web-only libraries (no framer-motion, no CSS files, no DOM APIs)
- ❌ Do NOT use FlatList with no key extractor — always define keyExtractor

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
## DELIVERABLE CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Build all of the following and confirm each renders correctly in Expo Go:

[ ] Splash screen: VaultLogo spring entrance + ring rotation + ambient blobs
[ ] Splash: scan line sweep on first launch
[ ] Login: phone input with focus glow + OTP 6-box stagger animation
[ ] Login: wrong OTP shake animation + correct OTP green flash
[ ] Custom floating bottom tab bar with sliding active pill indicator
[ ] Home: hero stat card with count-up ₹ amount + sparkline
[ ] Home: 3 quick stat cards staggered entrance
[ ] Home: deadline feed with urgency colors + pulse on rose items
[ ] Home: horizontal receipt scroll with peek design
[ ] Home: Gemini Active pulse pill + notification bell swing
[ ] Home: ambient glow blobs in background
[ ] Receipts: search bar + filter pills with sliding active state
[ ] Receipts: FlatList with swipe gestures (delete/share)
[ ] Receipts: Moti stagger entrance animation on list items
[ ] Receipt detail: live countdown timer (days/hours/minutes flip)
[ ] Receipt detail: full-screen image viewer on long press
[ ] Deadlines: timeline view with TODAY pulsing dot
[ ] Deadlines: tinder-style card stack swipe view
[ ] Spending: area chart + animated category progress bars
[ ] Spending: AI insight card + ask bottom sheet
[ ] Settings: Vault Mode toggle easter egg
[ ] Settings: all animated toggles with haptics
[ ] All skeleton loaders on initial data load
[ ] All haptic feedback on every interactive element
[ ] WhatsApp deep-link buttons on receipt detail + empty states
[ ] "✦ Gemini 2.0" badges on all AI-extracted content
[ ] "✦ Gemini Active" pulse pill on home screen
[ ] Indian number formatting (₹1,24,830) on all amounts
[ ] DD/MM/YYYY date format everywhere
[ ] All mock data loaded with Indian brands and ₹ amounts
[ ] Page transitions: slide + scale/fade on stack navigation
[ ] Pull-to-refresh with spinning VaultLogo on all lists
[ ] Bottom sheets for confirmations and filters

This is a hackathon-winning mobile app. Every interaction must feel intentional,
premium, and technically impressive. Execute it completely.
```

---

## Tips for Using This in Cursor

1. **Attach this plan.md** and say: *"Read plan.md completely then implement
   everything from start to finish inside the `frontend/` folder.
   Do not touch any files outside `frontend/`."*

2. **Bootstrap yourself first** (run in terminal before prompting Cursor):

```bash
mkdir frontend && cd frontend
npx create-expo-app . --template blank-typescript
npx expo install react-native-reanimated react-native-gesture-handler
npx expo install moti expo-blur expo-haptics expo-linear-gradient
npx expo install expo-router react-native-safe-area-context react-native-screens
npx expo install victory-native react-native-svg
npx expo install @expo-google-fonts/space-grotesk @expo-google-fonts/dm-sans
npx expo install axios @react-native-async-storage/async-storage date-fns
```

3. **To test**: Run `npx expo start` inside `frontend/`, scan QR code with
   Expo Go on your phone.

4. **If Cursor touches backend files**: Say *"Stop. Only work inside `frontend/`.
   Do not modify anything outside it."*

## Folder Map

```
receiptvault/                     ← existing repo root (DO NOT TOUCH)
├── src/                          ← backend (DO NOT TOUCH)
├── package.json                  ← backend (DO NOT TOUCH)
├── docker-compose.yml            ← (DO NOT TOUCH)
│
└── frontend/                     ← ✅ ALL YOUR WORK HERE ONLY
    ├── app/                      ← Expo Router screens
    ├── src/
    │   ├── components/           ← All shared components
    │   ├── constants/            ← colors.ts, typography.ts
    │   └── lib/                  ← mockData.ts, api.ts
    ├── assets/
    ├── app.json
    └── package.json              ← frontend's own (not root)
```
