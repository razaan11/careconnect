import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import PickupCard from '../../components/PickupCard';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, spacing, type } from '../../lib/theme';

const STAGE = {
  LOADING: 'loading',
  PERMISSION_DENIED: 'permission_denied',
  ERROR: 'error',
  READY: 'ready',
};

export default function PickupsScreen() {
  const router = useRouter();
  const [stage, setStage] = useState(STAGE.LOADING);
  const [pickups, setPickups] = useState([]);
  // Donations already accepted by this volunteer but not yet delivered —
  // e.g. the hand-off code was entered but the photo/confirm step failed
  // or was backed out of. Without this list there was no way back to them.
  const [activePickups, setActivePickups] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const loadPickups = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setStage(STAGE.LOADING);
    setErrorMessage('');

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setStage(STAGE.PERMISSION_DENIED);
        setRefreshing(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;

      const { data } = await api.get('/volunteers/pickups', {
        params: { lat: latitude, lng: longitude },
      });

      const sorted = [...(data?.pickups || [])].sort((a, b) => {
        const da = typeof a.distanceKm === 'number' ? a.distanceKm : Infinity;
        const db = typeof b.distanceKm === 'number' ? b.distanceKm : Infinity;
        return da - db;
      });

      setPickups(sorted);
      setActivePickups(data?.active || []);
      setStage(STAGE.READY);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Could not load nearby pickups. Pull down to try again.'
      );
      setStage(STAGE.ERROR);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPickups();
    }, [loadPickups])
  );

  async function handleAccept(donation) {
    setAcceptingId(donation.id);
    try {
      const { data: updated } = await api.post(`/volunteers/pickups/${donation.id}/accept`);
      setPickups((prev) => prev.filter((p) => p.id !== donation.id));
      // The API contract has no GET /donations/:id, so the accepted donation
      // (already expanded with matchedTrust) travels with the navigation.
      const merged = { ...donation, ...updated };
      router.push({
        pathname: '/(tabs)/pickup/[id]',
        params: { id: String(merged.id ?? donation.id), donation: JSON.stringify(merged) },
      });
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || 'Could not accept this pickup. It may already be taken.'
      );
    } finally {
      setAcceptingId(null);
    }
  }

  function handleResume(donation) {
    // Already accepted — just go straight back to the hand-off/OTP screen,
    // no accept call needed.
    router.push({
      pathname: '/(tabs)/pickup/[id]',
      params: { id: String(donation.id), donation: JSON.stringify(donation) },
    });
  }

  const activeSection =
    activePickups.length > 0 ? (
      <View style={styles.activeSection}>
        <Text style={styles.activeSectionLabel}>
          Continue delivery — already accepted, not yet delivered
        </Text>
        {activePickups.map((donation) => (
          <PickupCard key={donation.id} donation={donation} onPress={() => handleResume(donation)} />
        ))}
      </View>
    ) : null;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={type.eyebrow}>TODAY'S ROUTE</Text>
        <Text style={type.display}>Nearby pickups</Text>
        {stage === STAGE.READY ? (
          <Text style={styles.subtitle}>
            {pickups.length === 0
              ? 'Nothing waiting right now'
              : `${pickups.length} donation${pickups.length === 1 ? '' : 's'} ready near you`}
          </Text>
        ) : null}
      </View>

      {stage === STAGE.LOADING ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding pickups near you…</Text>
        </View>
      ) : stage === STAGE.PERMISSION_DENIED ? (
        <EmptyState
          icon="location-outline"
          tone="warning"
          title="Location access is off"
          body="CareConnect needs your location to sort pickups by distance, so you always see the closest one first."
          actionLabel="Open settings"
          onAction={() => Linking.openSettings()}
        />
      ) : stage === STAGE.ERROR ? (
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Couldn't load pickups"
          body={errorMessage}
          actionLabel="Try again"
          onAction={() => loadPickups()}
        />
      ) : pickups.length === 0 ? (
        <FlatList
          data={[]}
          renderItem={null}
          contentContainerStyle={styles.emptyListContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPickups({ isRefresh: true })} tintColor={colors.primary} />
          }
          ListHeaderComponent={activeSection}
          ListEmptyComponent={
            <EmptyState
              icon="checkmark-done-circle-outline"
              title="You're all caught up"
              body="No donations are waiting for pickup near you right now. Pull down to check again in a bit."
              actionLabel="Refresh"
              onAction={() => loadPickups({ isRefresh: true })}
            />
          }
        />
      ) : (
        <FlatList
          data={pickups}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadPickups({ isRefresh: true })} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <>
              {activeSection}
              {errorMessage ? (
                <View style={styles.inlineError}>
                  <Ionicons name="alert-circle" size={16} color={colors.error} />
                  <Text style={styles.inlineErrorText}>{errorMessage}</Text>
                </View>
              ) : null}
            </>
          }
          renderItem={({ item }) => (
            // Only the explicit "Accept" button triggers acceptance — the
            // card itself has no separate onPress. Passing the same handler
            // to both used to mean a tap anywhere on the card *and* a tap on
            // the button could each fire handleAccept, risking a double
            // POST /accept for the same donation.
            <PickupCard
              donation={item}
              accepting={acceptingId === item.id}
              onAccept={() => handleAccept(item)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  subtitle: { ...type.body, color: colors.muted, marginTop: spacing.xs },
  activeSection: { marginBottom: spacing.lg },
  activeSectionLabel: {
    ...type.eyebrow,
    color: colors.accent,
    marginBottom: spacing.sm,
  },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  loadingText: { ...type.body, color: colors.muted, marginTop: spacing.md },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorTint,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  inlineErrorText: { ...type.caption, color: colors.error, fontWeight: '700', flex: 1 },
});
