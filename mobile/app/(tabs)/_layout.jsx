import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, type } from '../../lib/theme';

export default function TabsLayout() {
  // A fixed bottom padding here overlaps the phone's own back/home
  // buttons on devices with on-screen gesture/button navigation —
  // `insets.bottom` is the actual reserved system-UI height for
  // *this* device, 0 on phones that don't need it, ~20-48px on ones
  // that do.
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.faint,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom + spacing.sm,
          paddingTop: spacing.xs,
        },
        tabBarLabelStyle: { fontSize: 11.5, fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="pickups"
        options={{
          title: 'Pickups',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'cube' : 'cube-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person-circle' : 'person-circle-outline'} size={size} color={color} />
          ),
        }}
      />
      {/* Detail route lives inside the tabs group so it keeps the tab
          navigator's history stack, but it has no tab of its own. */}
      <Tabs.Screen
        name="pickup/[id]"
        options={{
          href: null,
          tabBarStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}
