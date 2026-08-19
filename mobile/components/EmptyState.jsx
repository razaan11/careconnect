import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import PrimaryButton from './PrimaryButton';
import { colors, spacing, type } from '../lib/theme';

// An empty screen is an invitation to act, not a dead end — every empty
// state here names the reason and, where there's something to do about it,
// gives a concrete next step.
export default function EmptyState({ icon = 'file-tray-outline', title, body, actionLabel, onAction, tone = 'default' }) {
  const iconColor = tone === 'error' ? colors.error : tone === 'warning' ? colors.warning : colors.accent;
  const iconBg = tone === 'error' ? colors.errorTint : tone === 'warning' ? colors.warningTint : colors.accentTint;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={34} color={iconColor} />
      </View>
      <Text style={[type.h1, styles.title]}>{title}</Text>
      {body ? <Text style={[type.bodyRegular, styles.body]}>{body}</Text> : null}
      {actionLabel && onAction ? (
        <PrimaryButton label={actionLabel} onPress={onAction} variant="primary" style={styles.action} fullWidth={false} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.xxxl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  body: { textAlign: 'center', color: colors.muted, marginBottom: spacing.lg },
  action: { paddingHorizontal: spacing.xxl, marginTop: spacing.sm },
});
