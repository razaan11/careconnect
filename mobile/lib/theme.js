// CareConnect design system — the "field manifest" look.
// Volunteers are couriers on a verified relay: donor -> volunteer -> trust.
// Every screen borrows from waybills, claim tags and ink stamps: the tools
// of someone who moves physical things and needs proof they arrived.
//
// Colors and the base scale are fixed by the CareConnect brand. Everything
// else here (spacing, radii, shadows, type scale) is this app's own system,
// built for one-handed use in the field — big tap targets, high contrast,
// nothing that requires two hands to operate.
import { Platform } from 'react-native';

export const colors = {
  // Brand-fixed values — do not change.
  primary: '#1B4332',
  accent: '#52B788',
  warning: '#F4A261',
  error: '#E76F51',
  background: '#F8FAF9',
  text: '#1A1A2E',

  // Derived tones used throughout the app.
  primaryDark: '#0F2A1C',
  primaryTint: '#E7F0EA',
  accentTint: '#E3F5EB',
  warningTint: '#FDEEE0',
  errorTint: '#FBE7E1',
  surface: '#FFFFFF',
  border: '#E1E8E4',
  muted: '#6E7B74',
  faint: '#A7B3AD',
  white: '#FFFFFF',
  overlay: 'rgba(15, 42, 28, 0.55)',
};

// A deliberate, restrained type scale. React Native has no custom font
// loading here, so personality comes from weight, size, spacing and case
// rather than typeface — the OTP figures use the system monospace so the
// numbers a volunteer is reading aloud off a phone screen never mistype.
const monospace = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export const type = {
  display: { fontSize: 30, fontWeight: '800', color: colors.text, letterSpacing: -0.6, lineHeight: 36 },
  h1: { fontSize: 22, fontWeight: '800', color: colors.text, letterSpacing: -0.3, lineHeight: 27 },
  h2: { fontSize: 18, fontWeight: '700', color: colors.text, lineHeight: 23 },
  eyebrow: { fontSize: 12, fontWeight: '800', color: colors.muted, letterSpacing: 1.6, textTransform: 'uppercase' },
  body: { fontSize: 15.5, fontWeight: '500', color: colors.text, lineHeight: 21 },
  bodyRegular: { fontSize: 15.5, fontWeight: '400', color: colors.text, lineHeight: 21 },
  caption: { fontSize: 12.5, fontWeight: '600', color: colors.muted, lineHeight: 16 },
  button: { fontSize: 16, fontWeight: '700', color: colors.white, letterSpacing: 0.2 },
  otp: { fontSize: 34, fontWeight: '800', color: colors.text, letterSpacing: 12, fontFamily: monospace },
  stat: { fontSize: 32, fontWeight: '800', color: colors.text, letterSpacing: -0.8 },
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 40 };

export const radii = { sm: 8, md: 14, lg: 20, xl: 28, pill: 999 };

export const shadow = {
  card: {
    shadowColor: '#0F2A1C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  raised: {
    shadowColor: '#0F2A1C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 6,
  },
};

export const typeColors = {
  FOOD: { fg: '#B5651D', bg: '#FBEEDD' },
  CLOTHES: { fg: '#2A6F97', bg: '#E3EFF7' },
  BOOKS: { fg: '#6A4C93', bg: '#EEE7F5' },
};

export function donationTypeStyle(t) {
  return typeColors[t] || { fg: colors.muted, bg: colors.primaryTint };
}
