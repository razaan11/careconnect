import { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import {
  clearSession,
  getIsAvailable,
  getUser,
  setIsAvailable as persistIsAvailable,
} from '../../lib/storage';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, radii, shadow, spacing, type } from '../../lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [deliveryCount, setDeliveryCount] = useState(null);
  const [isAvailable, setIsAvailableState] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const [cachedUser, available] = await Promise.all([getUser(), getIsAvailable()]);
        if (!mounted) return;
        setUser(cachedUser);
        setIsAvailableState(available);
        setLoadingStats(true);
        try {
          const { data } = await api.get('/volunteers/history');
          if (mounted) setDeliveryCount(Array.isArray(data?.donations) ? data.donations.length : 0);
        } catch {
          if (mounted) setDeliveryCount(null);
        } finally {
          if (mounted) setLoadingStats(false);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  async function handleToggleAvailable(value) {
    setIsAvailableState(value);
    await persistIsAvailable(value);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await clearSession();
    router.replace('/(auth)/login');
  }

  const initials = getInitials(user?.name);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={type.eyebrow}>YOUR ID</Text>
        <Text style={type.display}>Profile</Text>
      </View>

      <View style={styles.identityCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={styles.identityBody}>
          <Text style={styles.name}>{user?.name || 'Volunteer'}</Text>
          <Text style={styles.email}>{user?.email || '—'}</Text>
        </View>
        <View style={[styles.statusPill, isAvailable ? styles.statusPillOn : styles.statusPillOff]}>
          <View style={[styles.statusDot, { backgroundColor: isAvailable ? colors.accent : colors.faint }]} />
          <Text style={[styles.statusPillText, { color: isAvailable ? colors.primary : colors.muted }]}>
            {isAvailable ? 'Available' : 'Paused'}
          </Text>
        </View>
      </View>

      <View style={styles.statCard}>
        <View style={styles.statIconWrap}>
          <Ionicons name="cube" size={22} color={colors.accent} />
        </View>
        <View style={styles.statBody}>
          <Text style={styles.statLabel}>Total deliveries</Text>
          {loadingStats ? (
            <ActivityIndicator size="small" color={colors.white} style={styles.statSpinner} />
          ) : (
            <Text style={[type.stat, styles.statValue]}>{deliveryCount ?? '—'}</Text>
          )}
        </View>
      </View>

      <View style={styles.toggleCard}>
        <View style={styles.toggleTextWrap}>
          <Text style={styles.toggleTitle}>Available for pickups</Text>
          <Text style={styles.toggleBody}>
            Turn this off when you're offline for the day so new pickups stop showing up as urgent.
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={handleToggleAvailable}
          trackColor={{ false: colors.border, true: colors.accent }}
          thumbColor={colors.white}
        />
      </View>

      <PrimaryButton
        label={loggingOut ? 'Logging out…' : 'Log out'}
        onPress={handleLogout}
        variant="danger"
        loading={loggingOut}
        style={styles.logoutButton}
        icon={<Ionicons name="log-out-outline" size={18} color={colors.white} />}
      />
    </ScrollView>
  );
}

function getInitials(name) {
  if (!name) return 'CC';
  const parts = name.trim().split(/\s+/);
  const letters = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() || '');
  return letters.join('') || 'CC';
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.xxxl },
  header: { marginBottom: spacing.lg },
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 20, fontWeight: '800' },
  identityBody: { flex: 1 },
  name: { fontSize: 17, fontWeight: '800', color: colors.text, marginBottom: 2 },
  email: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  statusPillOn: { backgroundColor: colors.accentTint },
  statusPillOff: { backgroundColor: colors.primaryTint },
  statusDot: { width: 7, height: 7, borderRadius: 3.5 },
  statusPillText: { fontSize: 11.5, fontWeight: '800' },
  statCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadow.card,
  },
  statIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  statBody: { flex: 1 },
  statLabel: { fontSize: 12.5, fontWeight: '700', color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  statValue: { color: colors.white },
  statSpinner: { alignSelf: 'flex-start', marginTop: 4 },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.xxl,
    ...shadow.card,
  },
  toggleTextWrap: { flex: 1, marginRight: spacing.md },
  toggleTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 4 },
  toggleBody: { fontSize: 12.5, color: colors.muted, lineHeight: 17 },
  logoutButton: {},
});
