// Styled like a courier's claim tag: a solid stub up top, a perforated tear
// line, and the handoff details below. The perforation is real information
// here, not decoration — it's the same "torn between two parties" idea as
// the paper tag on a donated bag: one half stays with the donor, one half
// travels with the load.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors, donationTypeStyle, radii, shadow, spacing, type } from '../lib/theme';

const TYPE_ICON = { FOOD: 'restaurant-outline', CLOTHES: 'shirt-outline', BOOKS: 'book-outline' };

export default function PickupCard({ donation, onAccept, accepting, onPress }) {
  const typeStyle = donationTypeStyle(donation.type);
  const trustName = donation.matchedTrust?.orgName;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      <View style={styles.stub}>
        <View style={styles.headerRow}>
          <View style={[styles.typeChip, { backgroundColor: typeStyle.bg }]}>
            <Ionicons name={TYPE_ICON[donation.type] || 'cube-outline'} size={13} color={typeStyle.fg} />
            <Text style={[styles.typeChipText, { color: typeStyle.fg }]}>{donation.type}</Text>
          </View>
          {typeof donation.distanceKm === 'number' ? (
            <View style={styles.distanceWrap}>
              <Ionicons name="navigate-outline" size={13} color={colors.muted} />
              <Text style={styles.distanceText}>{donation.distanceKm.toFixed(1)} km away</Text>
            </View>
          ) : null}
        </View>

        <Text style={[type.h2, styles.title]} numberOfLines={2}>
          {donation.title}
        </Text>
        <Text style={styles.quantity}>
          {donation.quantity} {donation.unit}
        </Text>
        {donation.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {donation.description}
          </Text>
        ) : null}
        {(donation.landmark || donation.district) ? (
          <View style={styles.addressRow}>
            <Ionicons name="location-outline" size={13} color={colors.muted} />
            <Text style={styles.addressText} numberOfLines={1}>
              {[donation.landmark, donation.district].filter(Boolean).join(', ')}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.perforationRow}>
        <View style={styles.notchLeft} />
        <View style={styles.dashLine} />
        <View style={styles.notchRight} />
      </View>

      <View style={styles.footer}>
        <View style={styles.trustRow}>
          <Ionicons name="business-outline" size={15} color={colors.primary} />
          <Text style={styles.trustText} numberOfLines={1}>
            {trustName || 'Matched trust pending'}
          </Text>
        </View>
        {onAccept ? (
          <PrimaryButton
            label={accepting ? 'Accepting…' : 'Accept'}
            onPress={onAccept}
            loading={accepting}
            fullWidth={false}
            style={styles.acceptButton}
          />
        ) : (
          <Ionicons name="chevron-forward" size={20} color={colors.faint} />
        )}
      </View>
    </Pressable>
  );
}

const NOTCH = 16;

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  cardPressed: { opacity: 0.92 },
  stub: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
  },
  typeChipText: { fontSize: 11.5, fontWeight: '800', letterSpacing: 0.6 },
  distanceWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  distanceText: { fontSize: 12.5, fontWeight: '700', color: colors.muted },
  title: { marginBottom: 2 },
  quantity: { fontSize: 14, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  description: { fontSize: 13.5, color: colors.muted, lineHeight: 18 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  addressText: { fontSize: 12.5, color: colors.muted, flexShrink: 1 },
  perforationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: NOTCH,
  },
  notchLeft: {
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: colors.background,
    marginLeft: -NOTCH / 2,
  },
  notchRight: {
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: colors.background,
    marginRight: -NOTCH / 2,
  },
  dashLine: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, marginRight: spacing.sm },
  trustText: { fontSize: 13.5, fontWeight: '600', color: colors.text, flexShrink: 1 },
  acceptButton: { paddingHorizontal: spacing.lg, paddingVertical: 10 },
});
