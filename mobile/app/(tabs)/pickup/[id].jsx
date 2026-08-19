// Pickup detail + hand-off gate.
//
// By the time a volunteer lands here, POST /volunteers/pickups/:id/accept has
// already run (back on the pickups list) and the donation now carries a
// server-set deliveryOtp / status PICKUP_SCHEDULED. Separately, the trust
// calls POST /trusts/donations/:donationId/generate-otp on THEIR side at the
// physical hand-off moment, then reads that OTP aloud (or shows it) to the
// volunteer. There is no volunteer-facing "confirm-pickup" endpoint in the
// API contract, so the box below is a LOCAL gate: it just makes sure the
// volunteer actually typed a code the trust gave them before letting them
// move on to photo proof + POST /donations/:id/confirm-delivery, which is
// where that OTP is actually verified server-side (in app/camera.jsx).
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import PrimaryButton from '../../../components/PrimaryButton';
import StampBadge from '../../../components/StampBadge';
import { colors, donationTypeStyle, radii, shadow, spacing, type } from '../../../lib/theme';

const TYPE_ICON = { FOOD: 'restaurant-outline', CLOTHES: 'shirt-outline', BOOKS: 'book-outline' };
const OTP_LENGTH = 6;

export default function PickupDetailScreen() {
  const { id, donation: donationParam } = useLocalSearchParams();
  const router = useRouter();
  const donation = safeParse(donationParam);

  const [otp, setOtp] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');
  const fade = useRef(new Animated.Value(1)).current;

  const canConfirm = otp.trim().length >= 4 && !confirming;
  const typeStyle = donation ? donationTypeStyle(donation.type) : donationTypeStyle(null);

  useEffect(() => {
    if (!confirmed) return;
    const timer = setTimeout(() => {
      router.push({
        pathname: '/camera',
        params: { id: String(id), otp: otp.trim() },
      });
    }, 850);
    return () => clearTimeout(timer);
  }, [confirmed, id, otp, router]);

  function handleConfirm() {
    if (!canConfirm) return;
    setError('');
    setConfirming(true);
    // Local validation only — the real OTP check happens server-side in
    // POST /donations/:id/confirm-delivery once photo proof is attached.
    if (otp.trim().length < 4) {
      setError('Enter the code the trust read out to you.');
      setConfirming(false);
      return;
    }
    Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    setConfirming(false);
    setConfirmed(true);
  }

  if (confirmed) {
    return (
      <View style={styles.successScreen}>
        <StampBadge label="HAND-OFF OK" color={colors.accent} />
        <Text style={styles.successText}>Opening camera for photo proof…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fade }}>
          <View style={styles.header}>
            <Text style={type.eyebrow}>PICKUP #{id}</Text>
            <Text style={type.display}>{donation?.title || 'Scheduled pickup'}</Text>
          </View>

          {donation ? (
            <View style={styles.detailCard}>
              <View style={styles.row}>
                <View style={[styles.typeChip, { backgroundColor: typeStyle.bg }]}>
                  <Ionicons name={TYPE_ICON[donation.type] || 'cube-outline'} size={13} color={typeStyle.fg} />
                  <Text style={[styles.typeChipText, { color: typeStyle.fg }]}>{donation.type}</Text>
                </View>
                <Text style={styles.quantity}>
                  {donation.quantity} {donation.unit}
                </Text>
              </View>

              {donation.description ? <Text style={styles.description}>{donation.description}</Text> : null}

              <View style={styles.divider} />

              <View style={styles.infoLine}>
                <Ionicons name="business-outline" size={16} color={colors.primary} />
                <Text style={styles.infoText}>{donation.matchedTrust?.orgName || 'Matched trust pending'}</Text>
              </View>
              {typeof donation.lat === 'number' && typeof donation.lng === 'number' ? (
                <View style={styles.infoLine}>
                  <Ionicons name="location-outline" size={16} color={colors.muted} />
                  <Text style={styles.infoTextMuted}>
                    {donation.lat.toFixed(4)}, {donation.lng.toFixed(4)}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : (
            <View style={styles.detailCard}>
              <Text style={styles.infoTextMuted}>
                Pickup details aren't available offline, but you can still confirm the hand-off below.
              </Text>
            </View>
          )}

          <View style={styles.otpCard}>
            <Text style={styles.otpEyebrow}>CONFIRM HAND-OFF</Text>
            <Text style={styles.otpPrompt}>
              Ask the trust for the pickup code shown on their screen, then enter it here to unlock
              photo proof.
            </Text>
            <TextInput
              value={otp}
              onChangeText={(v) => setOtp(v.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
              placeholder="000000"
              placeholderTextColor={colors.faint}
              keyboardType="number-pad"
              style={styles.otpInput}
              maxLength={OTP_LENGTH}
              textAlign="center"
            />
            {error ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
            <PrimaryButton
              label="Confirm hand-off"
              onPress={handleConfirm}
              disabled={!canConfirm}
              loading={confirming}
              style={styles.confirmButton}
              icon={<Ionicons name="checkmark-circle-outline" size={18} color={colors.white} />}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function safeParse(raw) {
  if (!raw) return null;
  try {
    return JSON.parse(Array.isArray(raw) ? raw[0] : raw);
  } catch {
    return null;
  }
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: spacing.xxxl },
  header: { marginBottom: spacing.lg },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  typeChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  typeChipText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6 },
  quantity: { fontSize: 15, fontWeight: '700', color: colors.primary },
  description: { ...type.bodyRegular, color: colors.muted, marginBottom: spacing.sm },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  infoLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  infoText: { ...type.body, fontWeight: '700' },
  infoTextMuted: { ...type.caption, color: colors.muted, flex: 1 },
  otpCard: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.xl,
    ...shadow.raised,
  },
  otpEyebrow: { ...type.eyebrow, color: 'rgba(255,255,255,0.65)', marginBottom: spacing.sm },
  otpPrompt: { fontSize: 14.5, color: 'rgba(255,255,255,0.85)', lineHeight: 20, marginBottom: spacing.lg },
  otpInput: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
    color: colors.white,
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 12,
    paddingVertical: 14,
    marginBottom: spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(231,111,81,0.18)',
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: { fontSize: 12.5, fontWeight: '700', color: '#FFD9CC', flex: 1 },
  confirmButton: { backgroundColor: colors.accent, borderColor: colors.accent },
  successScreen: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  successText: { color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: '600' },
});
