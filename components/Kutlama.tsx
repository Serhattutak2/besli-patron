// ============================================
// SAHA BİZİM — components/Kutlama.tsx
// Unvan atlayınca ışıltılı kutlama
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Animated, Pressable, StyleSheet, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useOyun } from '../context/OyunContext';
import * as V from '../engine/veri';
import { R, Y } from './ui';
import { efekt } from '../services/ses';

const SIRA = ['Yeni patron', 'Mahallenin tanıdığı', 'Sözü dinlenen', 'Semtin abisi', 'Şehrin patronu', 'Halısaha kralı'];

export default function Kutlama() {
  const { s } = useOyun();
  const onceki = useRef<string | null>(null);
  const [unvan, setUnvan] = useState<string | null>(null);
  const a = useRef(new Animated.Value(0)).current;
  const don = useRef(new Animated.Value(0)).current;
  const yeni = s ? V.itibarUnvani(s.itibar) : null;

  useEffect(() => {
    if (!yeni) return;
    if (onceki.current && SIRA.indexOf(yeni) > SIRA.indexOf(onceki.current)) {
      setUnvan(yeni);
      a.setValue(0);
      don.setValue(0);
      Animated.spring(a, { toValue: 1, useNativeDriver: true, friction: 5 }).start();
      Animated.loop(Animated.timing(don, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true })).start();
      efekt('fanfar');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const t = setTimeout(() => setUnvan(null), 4200);
      onceki.current = yeni;
      return () => clearTimeout(t);
    }
    onceki.current = yeni;
  }, [yeni]);

  if (!unvan) return null;
  const rot = don.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <Pressable style={st.perde} onPress={() => setUnvan(null)}>
      <Animated.View style={[st.isin, { transform: [{ rotate: rot }] }]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <View key={i} style={[st.cubuk, { transform: [{ rotate: `${i * 30}deg` }] }]} />
        ))}
      </Animated.View>
      {Array.from({ length: 14 }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            opacity: a,
            transform: [
              { translateX: a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(i * 0.9) * (90 + (i % 3) * 40)] }) },
              { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(i * 0.9) * (90 + (i % 4) * 30)] }) },
            ],
          }}
        >
          <Ionicons name="sparkles" size={14 + (i % 3) * 6} color={i % 2 ? R.sari : R.turuncu} />
        </Animated.View>
      ))}
      <Animated.View style={[st.kutu, { transform: [{ scale: a }] }]}>
        <Ionicons name="star" size={46} color={R.sari} />
        <Y k style={{ color: R.soluk, marginTop: 6, fontSize: 12 }}>YENİ UNVAN</Y>
        <Y s style={{ fontSize: 26, color: R.sari, textAlign: 'center', marginTop: 4 }}>{unvan}</Y>
        <Y style={{ color: R.yazi2, marginTop: 6, textAlign: 'center' }}>Mahallede adın artık başka anılıyor!</Y>
      </Animated.View>
    </Pressable>
  );
}

const st = StyleSheet.create({
  perde: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(3,7,18,0.72)', alignItems: 'center', justifyContent: 'center', zIndex: 80 },
  isin: { position: 'absolute', width: 420, height: 420, alignItems: 'center', justifyContent: 'center', opacity: 0.35 },
  cubuk: { position: 'absolute', width: 18, height: 420, backgroundColor: '#F59E0B', borderRadius: 9 },
  kutu: { backgroundColor: R.panel, borderRadius: 24, padding: 24, alignItems: 'center', borderWidth: 2, borderColor: R.sari, maxWidth: 300 },
});
