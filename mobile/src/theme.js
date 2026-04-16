// ─── Design Tokens ────────────────────────────────────────────────────────────
export const colors = {
  // Brand
  primary: '#4F46E5',        // Indigo-600
  primaryLight: '#EEF2FF',   // Indigo-50
  primaryDark: '#3730A3',    // Indigo-800
  primaryGradient: ['#4F46E5', '#7C3AED'], // indigo → violet

  // Accent
  accent: '#06B6D4',         // Cyan-500
  accentLight: '#ECFEFF',

  // Semantic
  success: '#10B981',        // Emerald-500
  successLight: '#ECFDF5',   // Emerald-50
  successBorder: '#6EE7B7',
  error: '#EF4444',          // Red-500
  errorLight: '#FEF2F2',
  errorBorder: '#FCA5A5',
  warning: '#F59E0B',        // Amber-500
  warningLight: '#FFFBEB',
  warningBorder: '#FDE68A',

  // Neutrals
  background: '#F1F5F9',     // Slate-100
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#E2E8F0',         // Slate-200
  borderLight: '#F1F5F9',

  // Text
  textPrimary: '#0F172A',    // Slate-900
  textSecondary: '#475569',  // Slate-600
  textTertiary: '#94A3B8',   // Slate-400
  textOnPrimary: '#FFFFFF',
  textLink: '#4F46E5',

  // Label-specific
  oweRed: '#DC2626',
  oweRedBg: '#FEF2F2',
  oweRedBorder: '#FECACA',
  owedGreen: '#059669',
  owedGreenBg: '#F0FDF4',
  owedGreenBorder: '#BBF7D0',

  // Header background
  headerBg: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const shadow = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const typography = {
  displayLg: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  displayMd: { fontSize: 26, fontWeight: '700', letterSpacing: -0.3 },
  h1: { fontSize: 22, fontWeight: '700', letterSpacing: -0.2 },
  h2: { fontSize: 18, fontWeight: '700' },
  h3: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 15, fontWeight: '400' },
  bodySmall: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 11, fontWeight: '400' },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
};
