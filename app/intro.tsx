// ============================================
// BEŞLİ PATRON — app/intro.tsx
// Açılış hikayesi (daktilo efekti) ve "Oyuna Başla"
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated, Easing } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGame } from '../context/GameContext';
import { Colors } from '../constants/colors';

const BOLUMLER = [
  {
    chapter: 'I. BÖLÜM — Beşli',
    emoji: '⚽',
    lines: [
      'On yıl boyunca sahalarda koştun.',
      'Sırtında 5 numaralı formayla. Herkes sana "Beşli" derdi.',
      'Tribünler sana uğuldayordu: "Beşli! Beşli!"',
    ],
  },
  {
    chapter: 'II. BÖLÜM — O Maç',
    emoji: '🩹',
    lines: [
      'Kupa finaliydi. 89. dakika.',
      'Kaydın... ve dizin pes etti.',
      'Sahayı sedyeyle terk ederken tribün ayaktaydı.',
      'Onlar alkışlıyordu. Sen ağlıyordun.',
    ],
  },
  {
    chapter: 'III. BÖLÜM — Nokta',
    emoji: '🏥',
    lines: [
      'Doktor tek cümle kurdu:',
      '"Artık oynayamazsın."',
      'Telefonlar sustu. Kontratlar yırtıldı.',
      'Futbol bitti. Hayat bitmemişti... henüz.',
    ],
  },
  {
    chapter: 'IV. BÖLÜM — Kıvılcım',
    emoji: '💡',
    lines: [
      'Bir akşam pencereden dışarı baktın.',
      'Mahallede çocuklar ceketle kale çizmiş, karlı zeminde oynuyordu.',
      'O an anladın: sahalarla bağın hiç kopmamıştı.',
    ],
  },
  {
    chapter: 'V. BÖLÜM — Beşli Sahası',
    emoji: '🔑',
    lines: [
      'Biriktirdiğin her kuruşu topladın.',
      "İstanbul'da küçük ama mütevazı bir halısaha kiraladın.",
      'Kapıya tabela astın: "Beşli Sahası".',
    ],
  },
  {
    chapter: 'SON — Asıl Maç',
    emoji: '👑',
    lines: [
      'Amaç sadece kira ödemek değil.',
      'Bu şehrin en iyi sahasını kuracaksın. Turnuvalar kazanacaksın.',
      'Şehir şehir ilerleyip Halısaha Kralı olacaksın.',
      'İşte şimdi asıl maç başlıyor.',
    ],
  },
];

const YAZMA_HIZI_MS = 30;

function BlinkingCursor() {
  const opaklik = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.timing(opaklik, { toValue: 0, duration: 450, useNativeDriver: true }),
        Animated.timing(opaklik, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
    );
    dongu.start();
    return () => dongu.stop();
  }, [opaklik]);
  return <Animated.Text style={[styles.cursor, { opacity: opaklik }]}>█</Animated.Text>;
}

export default function IntroScreen() {
  const insets = useSafeAreaInsets();
  const { initNewGame } = useGame();
  const [bolum, setBolum] = useState(0);
  const [yazilan, setYazilan] = useState('');
  const [bitti, setBitti] = useState(false);
  const konum = useRef(0);
  const zamanlayici = useRef<ReturnType<typeof setTimeout> | null>(null);

  const butonOpaklik = useRef(new Animated.Value(0)).current;
  const nabiz = useRef(new Animated.Value(1)).current;
  const sahneOpaklik = useRef(new Animated.Value(1)).current;
  const sahneY = useRef(new Animated.Value(0)).current;
  const suzulme = useRef(new Animated.Value(0)).current;

  const sahne = BOLUMLER[bolum];
  const sonBolum = bolum === BOLUMLER.length - 1;
  const tamMetin = sahne.lines.join('\n');
  const basabilir = bitti && sonBolum;

  // Daktilo efekti
  useEffect(() => {
    const tick = () => {
      if (!(konum.current < tamMetin.length)) {
        setBitti(true);
        return;
      }
      konum.current += 1;
      setYazilan(tamMetin.slice(0, konum.current));
      zamanlayici.current = setTimeout(tick, YAZMA_HIZI_MS);
    };
    zamanlayici.current = setTimeout(tick, 400);
    return () => {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
    };
  }, [bolum, tamMetin]);

  // Emojinin süzülmesi
  useEffect(() => {
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.timing(suzulme, { toValue: 1, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(suzulme, { toValue: 0, duration: 1500, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    dongu.start();
    return () => dongu.stop();
  }, [suzulme]);

  // "Oyuna Başla" nabzı
  useEffect(() => {
    if (!basabilir) return;
    const dongu = Animated.loop(
      Animated.sequence([
        Animated.timing(nabiz, { toValue: 1.04, duration: 800, useNativeDriver: true }),
        Animated.timing(nabiz, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    );
    dongu.start();
    return () => dongu.stop();
  }, [basabilir, nabiz]);

  useEffect(() => {
    if (basabilir) Animated.timing(butonOpaklik, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [basabilir, butonOpaklik]);

  const advance = () => {
    if (!bitti) {
      if (zamanlayici.current) clearTimeout(zamanlayici.current);
      konum.current = tamMetin.length;
      setYazilan(tamMetin);
      setBitti(true);
      return;
    }
    if (sonBolum) return;
    sahneOpaklik.setValue(0);
    sahneY.setValue(24);
    Animated.parallel([
      Animated.timing(sahneOpaklik, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(sahneY, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
    konum.current = 0;
    setYazilan('');
    setBitti(false);
    setBolum(bolum + 1);
  };

  const skipAll = () => {
    if (zamanlayici.current) clearTimeout(zamanlayici.current);
    const son = BOLUMLER.length - 1;
    const metin = BOLUMLER[son].lines.join('\n');
    konum.current = metin.length;
    setBolum(son);
    setYazilan(metin);
    setBitti(true);
  };

  const startGame = async () => {
    await initNewGame();
    router.replace('/tabs/saha');
  };

  const emojiY = suzulme.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.topBar}>
        <Text style={[styles.chapterTag, { fontFamily: 'SpaceMono' }]}>{sahne.chapter}</Text>
        {sonBolum ? null : (
          <Pressable onPress={skipAll} hitSlop={12} accessibilityLabel="Hikayeyi atla" accessibilityRole="button">
            <Text style={[styles.skipText, { fontFamily: 'SpaceMono' }]}>Atla ▸</Text>
          </Pressable>
        )}
      </View>

      <Pressable style={styles.storyArea} onPress={advance}>
        <Animated.View style={[styles.sceneBox, { opacity: sahneOpaklik, transform: [{ translateY: sahneY }] }]}>
          <Animated.Text style={[styles.sceneEmoji, { transform: [{ translateY: emojiY }] }]}>{sahne.emoji}</Animated.Text>
          <View style={styles.storyCard}>
            <Text style={[styles.storyText, { fontFamily: 'SpaceMono' }]}>
              {yazilan}
              {bitti ? null : <BlinkingCursor />}
            </Text>
          </View>
        </Animated.View>
        <View style={styles.dots}>
          {BOLUMLER.map((_, i) => (
            <View key={i} style={[styles.dot, i === bolum && styles.dotActive, i < bolum && styles.dotPast]} />
          ))}
        </View>
        {bitti && !sonBolum ? (
          <Text style={[styles.hintText, { fontFamily: 'SpaceMono' }]}>devam etmek için dokun ▸</Text>
        ) : null}
      </Pressable>

      <Animated.View
        style={[styles.buttonArea, { opacity: butonOpaklik, transform: [{ scale: nabiz }] }]}
        pointerEvents={basabilir ? 'auto' : 'none'}
      >
        <Pressable
          style={({ pressed }) => [styles.startButton, pressed && styles.buttonPressed]}
          onPress={startGame}
          accessibilityLabel="Oyuna Başla"
          accessibilityRole="button"
        >
          <Text style={[styles.startButtonText, { fontFamily: 'SpaceMono' }]}>⚽ Oyuna Başla</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    minHeight: 32,
  },
  chapterTag: { color: Colors.accent, fontSize: 12, fontWeight: 'bold' },
  skipText: { color: Colors.textSecondary, fontSize: 12 },
  storyArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  sceneBox: { alignItems: 'center', width: '100%' },
  sceneEmoji: { fontSize: 56, marginBottom: 20 },
  storyCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 2,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    minHeight: 170,
  },
  storyText: { color: Colors.textPrimary, fontSize: 14, lineHeight: 25 },
  cursor: { color: Colors.accent, fontSize: 14 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 20 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border },
  dotActive: { backgroundColor: Colors.accent, width: 18 },
  dotPast: { backgroundColor: Colors.primary },
  hintText: { color: Colors.textSecondary, fontSize: 12, marginTop: 16 },
  buttonArea: { width: '100%', maxWidth: 400, alignSelf: 'center', paddingHorizontal: 24 },
  startButton: {
    backgroundColor: Colors.accent,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 2,
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonPressed: { transform: [{ scale: 0.97 }], opacity: 0.9 },
  startButtonText: { color: Colors.white, fontSize: 18, fontWeight: 'bold' },
});
