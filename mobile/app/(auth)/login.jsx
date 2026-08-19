import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import api from '../../lib/api';
import { setToken, setUser } from '../../lib/storage';
import PrimaryButton from '../../components/PrimaryButton';
import { colors, radii, shadow, spacing, type } from '../../lib/theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = email.trim().length > 3 && password.length > 0 && !loading;

  async function handleLogin() {
    if (!canSubmit) return;
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', {
        email: email.trim(),
        password,
      });
      await setToken(data.token);
      await setUser(data.user);
      router.replace('/(tabs)/pickups');
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        (err?.response?.status === 401
          ? "That email and password don't match our records."
          : "Couldn't reach CareConnect. Check your connection and try again.");
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <View style={styles.sealWrap}>
            <Ionicons name="shield-checkmark" size={30} color={colors.accent} />
          </View>
          <Text style={styles.eyebrow}>VOLUNTEER SIGN-IN</Text>
          <Text style={styles.wordmark}>CareConnect</Text>
          <Text style={styles.tagline}>Every handoff, verified.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Email</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={colors.muted} style={styles.inputIcon} />
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.org"
              placeholderTextColor={colors.faint}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              textContentType="emailAddress"
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <Text style={[styles.fieldLabel, styles.fieldLabelSpaced]}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={colors.muted} style={styles.inputIcon} />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.faint}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              textContentType="password"
              style={styles.input}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={18}
              color={colors.muted}
              onPress={() => setShowPassword((v) => !v)}
              suppressHighlighting
            />
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color={colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <PrimaryButton
            label={loading ? 'Signing in…' : 'Sign in'}
            onPress={handleLogin}
            disabled={!canSubmit}
            loading={loading}
            style={styles.submit}
          />

          <Text style={styles.footnote}>
            Access is issued by your CareConnect coordinator. Contact them if you need an
            account.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1 },
  hero: {
    paddingTop: 88,
    paddingBottom: 48,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  sealWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...type.eyebrow,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: spacing.xs,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.75)',
    marginTop: spacing.xs,
  },
  card: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    ...shadow.raised,
  },
  fieldLabel: { ...type.caption, color: colors.text, fontWeight: '700', marginBottom: spacing.xs },
  fieldLabelSpaced: { marginTop: spacing.lg },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 52,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { flex: 1, fontSize: 15.5, color: colors.text, height: '100%' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.errorTint,
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginTop: spacing.lg,
  },
  errorText: { ...type.caption, color: colors.error, flex: 1, fontWeight: '700' },
  submit: { marginTop: spacing.xl },
  footnote: {
    ...type.caption,
    textAlign: 'center',
    marginTop: spacing.lg,
    color: colors.faint,
    lineHeight: 17,
  },
});
