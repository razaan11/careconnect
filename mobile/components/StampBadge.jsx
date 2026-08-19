// The signature moment of the app: verification lands like a rubber stamp
// hitting paper. Used whenever the volunteer clears a proof gate (OTP
// confirmed, delivery complete) so the field feedback reads as unmistakably
// "done", not just a spinner disappearing.
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../lib/theme';

export default function StampBadge({ label = 'VERIFIED', size = 128, color = colors.accent, icon = 'checkmark' }) {
  const scale = useRef(new Animated.Value(0.4)).current;
  const rotate = useRef(new Animated.Value(-8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 120, useNativeDriver: true }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 5,
          tension: 140,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: -6,
          duration: 220,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [opacity, rotate, scale]);

  const spin = rotate.interpolate({ inputRange: [-8, 0], outputRange: ['-8deg', '0deg'] });

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: color,
          opacity,
          transform: [{ scale }, { rotate: spin }],
        },
      ]}
    >
      <Ionicons name={icon} size={size * 0.42} color={color} />
      <Text style={[styles.label, { color, fontSize: size * 0.1 }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  ring: {
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  label: {
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4,
  },
});
