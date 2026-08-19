import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { getToken } from '../lib/storage';
import { colors } from '../lib/theme';

// Root entry: decides whether the volunteer lands on the sign-in screen or
// straight into their pickups, based on whether a token is already cached.
export default function Index() {
  const [checking, setChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const token = await getToken();
      if (mounted) {
        setHasToken(!!token);
        setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <Redirect href={hasToken ? '/(tabs)/pickups' : '/(auth)/login'} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
});
