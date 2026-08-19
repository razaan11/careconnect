import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../lib/api';
import EmptyState from '../../components/EmptyState';
import { colors, donationTypeStyle, radii, shadow, spacing, type } from '../../lib/theme';

const TYPE_ICON = { FOOD: 'restaurant-outline', CLOTHES: 'shirt-outline', BOOKS: 'book-outline' };

const STAGE = { LOADING: 'loading', ERROR: 'error', READY: 'ready' };

export default function HistoryScreen() {
  const [stage, setStage] = useState(STAGE.LOADING);
  const [deliveries, setDeliveries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const load = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true);
    else setStage(STAGE.LOADING);
    try {
      const { data } = await api.get('/volunteers/history');
      const sorted = [...(data?.donations || [])].sort((a, b) => {
        const da = new Date(a.completedAt || a.updatedAt || a.createdAt).getTime();
        const db = new Date(b.completedAt || b.updatedAt || b.createdAt).getTime();
        return db - da;
      });
      setDeliveries(sorted);
      setStage(STAGE.READY);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Could not load your delivery history.');
      setStage(STAGE.ERROR);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={type.eyebrow}>DELIVERY LOG</Text>
        <Text style={type.display}>History</Text>
        {stage === STAGE.READY ? (
          <Text style={styles.subtitle}>
            {deliveries.length === 0
              ? 'No completed deliveries yet'
              : `${deliveries.length} delivered so far`}
          </Text>
        ) : null}
      </View>

      {stage === STAGE.LOADING ? (
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : stage === STAGE.ERROR ? (
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Couldn't load history"
          body={errorMessage}
          actionLabel="Try again"
          onAction={() => load()}
        />
      ) : (
        <FlatList
          data={deliveries}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={deliveries.length === 0 ? styles.emptyListContent : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => load({ isRefresh: true })} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              icon="archive-outline"
              title="Nothing delivered yet"
              body="Completed pickups will show up here with the date, the trust, and what was delivered."
            />
          }
          renderItem={({ item }) => <HistoryRow donation={item} />}
        />
      )}
    </View>
  );
}

function HistoryRow({ donation }) {
  const typeStyle = donationTypeStyle(donation.type);
  const completedDate = donation.completedAt || donation.updatedAt || donation.createdAt;
  const formatted = formatDate(completedDate);

  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: typeStyle.bg }]}>
        <Ionicons name={TYPE_ICON[donation.type] || 'cube-outline'} size={18} color={typeStyle.fg} />
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {donation.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {donation.quantity} {donation.unit} · {donation.matchedTrust?.orgName || 'Trust'}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
        <Text style={styles.rowDate}>{formatted}</Text>
      </View>
    </View>
  );
}

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.md },
  subtitle: { ...type.body, color: colors.muted, marginTop: spacing.xs },
  centerFill: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 80 },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxxl },
  emptyListContent: { flexGrow: 1, justifyContent: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowBody: { flex: 1, marginRight: spacing.sm },
  rowTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  rowMeta: { fontSize: 12.5, fontWeight: '500', color: colors.muted },
  rowRight: { alignItems: 'flex-end', gap: 4 },
  rowDate: { fontSize: 11.5, fontWeight: '700', color: colors.muted },
});
