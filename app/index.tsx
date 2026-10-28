// ============================================
// BEŞLİ PATRON — app/index.tsx
// Açılış yönlendirmesi: kayıt varsa sahaya, yoksa girişe
// ============================================
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { Colors } from '../constants/colors';
import { useGame } from '../context/GameContext';

export default function Index() {
  const { state, loading } = useGame();
  const [hazir, setHazir] = useState(false);
  const [oyunVar, setOyunVar] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (state?.isGameStarted) setOyunVar(true);
    setHazir(true);
  }, [loading, state]);

  if (!hazir) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }
  if (oyunVar && state?.isGameOver) return <Redirect href="/gameover" />;
  return <Redirect href={oyunVar ? '/tabs/saha' : '/intro'} />;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
});
