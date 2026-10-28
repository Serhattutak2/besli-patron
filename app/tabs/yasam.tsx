// ============================================
// BEŞLİ PATRON — app/tabs/yasam.tsx
// Yaşam: ulaşım, konut, lüks eşyalar ve Ela ile ilişki
// ============================================
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from 'react-native';
import { useGame } from '../../context/GameContext';
import { Colors } from '../../constants/colors';
import { KIZ_ARKADAS_CONFIG, LIFE_ITEMS } from '../../constants/gameConfig';
import OdulluReklamButonu from '../../components/OdulluReklamButonu';

const KATEGORILER: Record<string, { emoji: string; label: string }> = {
  ulasim: { emoji: '🚗', label: 'Ulaşım' },
  konut: { emoji: '🏠', label: 'Konut' },
  luks: { emoji: '✨', label: 'Lüks' },
};

const KATEGORI_SIRASI = ['ulasim', 'konut', 'luks'];
const MONO = { fontFamily: 'SpaceMono' };

type Onay = { type: 'life'; id: string } | { type: 'kiz' } | null;

export default function YasamScreen() {
  const { state, buyLifeItem, upgradeKizArkadas } = useGame();
  const [mesaj, setMesaj] = useState('');
  const [mesajTipi, setMesajTipi] = useState<'success' | 'error'>('success');
  const [onay, setOnay] = useState<Onay>(null);

  const prestij = state?.prestij ?? 0;
  const iliskiSeviyeleri: any[] = (KIZ_ARKADAS_CONFIG as any)?.levels ?? [];
  const iliskiGerekli = (KIZ_ARKADAS_CONFIG as any)?.requiredPrestij ?? 0;
  const urunler: any[] = (LIFE_ITEMS as any) ?? [];

  const showMsg = (metin: string, tip: 'success' | 'error' = 'success') => {
    setMesaj(metin);
    setMesajTipi(tip);
    setTimeout(() => setMesaj(''), 2500);
  };

  const iliskiSeviye = state?.kizArkdasSeviye ?? 0;
  const iliskiTamam = iliskiSeviye >= iliskiSeviyeleri.length;
  const sonrakiIliski = iliskiTamam ? null : iliskiSeviyeleri[iliskiSeviye];
  const iliskiAlinabilir =
    !iliskiTamam && !!sonrakiIliski && (state?.nakit ?? 0) >= (sonrakiIliski?.cost ?? 0) && prestij >= iliskiGerekli;
  const iliskiKilitli = prestij < iliskiGerekli;

  const handleConfirm = () => {
    if (!onay) return;
    if (onay.type !== 'life') {
      const hata = upgradeKizArkadas();
      if (hata) showMsg(hata, 'error');
      else showMsg('Ela ilişkiyi ilerletti! ❤️');
    } else {
      const hata = buyLifeItem(onay.id);
      if (hata) showMsg(hata, 'error');
      else showMsg('Satın alındı! 🎉');
    }
    setOnay(null);
  };

  const onayMetni = () => {
    if (!onay) return '';
    if (onay.type !== 'life') {
      const sv = iliskiSeviyeleri[state?.kizArkdasSeviye ?? 0];
      return `${sv?.emoji ?? ''} ${sv?.label ?? ''} - ${(sv?.cost ?? 0).toLocaleString('tr-TR')} ₺`;
    }
    const urun = urunler.find((u) => u?.id === onay.id);
    const sv = urun?.levels ? urun.levels[state?.lifeItems?.[onay.id]?.level ?? 0] : undefined;
    return `${urun?.emoji ?? ''} ${sv?.label ?? ''} - ${(sv?.cost ?? 0).toLocaleString('tr-TR')} ₺`;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {mesaj ? (
        <View style={[styles.messageBox, mesajTipi === 'error' && styles.messageError]}>
          <Text style={[styles.messageText, MONO, mesajTipi === 'error' && styles.messageTextError]}>{mesaj}</Text>
        </View>
      ) : null}

      <View style={styles.prestijBar}>
        <Text style={[styles.prestijLabel, MONO]}>⭐ Prestij Puanı</Text>
        <Text style={[styles.prestijValue, MONO]}>{prestij}</Text>
      </View>

      {KATEGORI_SIRASI.map((kat) => {
        const bilgi = KATEGORILER[kat];
        const liste = urunler.filter((u) => u?.kategori === kat);
        return (
          <View key={kat} style={styles.section}>
            <Text style={[styles.sectionTitle, MONO]}>
              {bilgi?.emoji} {bilgi?.label}
            </Text>
            {liste.map((urun) => {
              const seviye = state?.lifeItems?.[urun.id]?.level ?? 0;
              const tamam = seviye >= (urun.levels?.length ?? 0);
              const sonraki = tamam ? null : urun.levels?.[seviye];
              const parasiVar = sonraki ? (state?.nakit ?? 0) >= (sonraki.cost ?? 0) : false;
              const kilitli = prestij < (urun.requiredPrestij ?? 0);
              const alinabilir = !tamam && parasiVar && !kilitli;
              return (
                <View key={urun.id} style={[styles.itemCard, kilitli && styles.itemLocked]}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemEmoji}>{urun.emoji}</Text>
                    <View style={styles.itemInfo}>
                      <Text style={[styles.itemName, MONO]}>{urun.label}</Text>
                      <Text style={[styles.itemDesc, MONO]}>{urun.aciklama}</Text>
                      {seviye > 0 ? (
                        <Text style={[styles.itemCurrentLevel, MONO]}>✅ {urun.levels?.[seviye - 1]?.label ?? ''}</Text>
                      ) : null}
                    </View>
                  </View>
                  {kilitli ? (
                    <View style={styles.lockedRow}>
                      <Text style={[styles.lockedText, MONO]}>🔒 {urun.requiredPrestij ?? 0} Prestij gerekli</Text>
                    </View>
                  ) : tamam ? (
                    <View style={styles.maxedRow}>
                      <Text style={[styles.maxedText, MONO]}>✅ Maksimum</Text>
                    </View>
                  ) : sonraki ? (
                    <View style={styles.buyRow}>
                      <View>
                        <Text style={[styles.nextLevelLabel, MONO]}>{sonraki.label}</Text>
                        <Text style={[styles.nextLevelCost, MONO]}>{(sonraki.cost ?? 0).toLocaleString('tr-TR')} ₺</Text>
                        <Text style={[styles.nextLevelPrestij, MONO]}>+{sonraki.prestij ?? 0} ⭐</Text>
                      </View>
                      <Pressable
                        style={({ pressed }) => [
                          styles.buyBtn,
                          !alinabilir && styles.btnDisabled,
                          pressed && alinabilir && styles.btnPressed,
                        ]}
                        onPress={() => setOnay({ type: 'life', id: urun.id })}
                        disabled={!alinabilir}
                        accessibilityLabel={`${urun.label} satın al`}
                        accessibilityRole="button"
                      >
                        <Text style={[styles.buyBtnText, MONO]}>Satın Al</Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              );
            })}
          </View>
        );
      })}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, MONO]}>❤️ İlişki</Text>
        <View style={[styles.itemCard, iliskiKilitli && styles.itemLocked]}>
          <View style={styles.itemHeader}>
            <Text style={styles.itemEmoji}>👩</Text>
            <View style={styles.itemInfo}>
              <Text style={[styles.itemName, MONO]}>Ela 💕</Text>
              <Text style={[styles.itemDesc, MONO]}>Hayatına Ela'yı kat</Text>
              {iliskiSeviye > 0 ? (
                <Text style={[styles.itemCurrentLevel, MONO]}>
                  {iliskiSeviyeleri[iliskiSeviye - 1]?.emoji ?? ''} {iliskiSeviyeleri[iliskiSeviye - 1]?.label ?? ''}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={styles.progressRow}>
            {iliskiSeviyeleri.map((sv, i) => (
              <View key={i} style={styles.progressStep}>
                <View style={[styles.progressDot, i < iliskiSeviye && styles.progressDotActive]} />
                <Text style={[styles.progressLabel, MONO]}>{sv?.emoji ?? ''}</Text>
              </View>
            ))}
          </View>
          {iliskiKilitli ? (
            <View style={styles.lockedRow}>
              <Text style={[styles.lockedText, MONO]}>🔒 {iliskiGerekli} Prestij gerekli</Text>
            </View>
          ) : iliskiTamam ? (
            <View style={styles.maxedRow}>
              <Text style={[styles.maxedText, MONO]}>💍 Ciddi İlişki</Text>
            </View>
          ) : sonrakiIliski ? (
            <View style={styles.buyRow}>
              <View>
                <Text style={[styles.nextLevelLabel, MONO]}>
                  {sonrakiIliski.emoji} {sonrakiIliski.label}
                </Text>
                <Text style={[styles.nextLevelCost, MONO]}>{(sonrakiIliski.cost ?? 0).toLocaleString('tr-TR')} ₺</Text>
                <Text style={[styles.nextLevelPrestij, MONO]}>+{sonrakiIliski.prestij ?? 0} ⭐</Text>
              </View>
              <Pressable
                style={({ pressed }) => [
                  styles.buyBtn,
                  !iliskiAlinabilir && styles.btnDisabled,
                  pressed && iliskiAlinabilir && styles.btnPressed,
                ]}
                onPress={() => setOnay({ type: 'kiz' })}
                disabled={!iliskiAlinabilir}
                accessibilityLabel="Ela ile ilişkiyi ilerlet"
                accessibilityRole="button"
              >
                <Text style={[styles.buyBtnText, MONO]}>İlerlet</Text>
              </Pressable>
            </View>
          ) : null}
        </View>
      </View>

      <Modal visible={onay !== null} transparent animationType="fade" onRequestClose={() => setOnay(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={[styles.modalTitle, MONO]}>Satın almak istediğine emin misin?</Text>
            {onay ? <Text style={[styles.modalDesc, MONO]}>{onayMetni()}</Text> : null}
            <View style={styles.modalButtons}>
              <Pressable style={[styles.modalBtn, styles.modalBtnYes]} onPress={handleConfirm}>
                <Text style={[styles.modalBtnText, MONO]}>Onayla</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalBtnNo]} onPress={() => setOnay(null)}>
                <Text style={[styles.modalBtnText, MONO]}>İptal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Yayındaki sürümde ödül 1 enerji olarak geçiyordu */}
      <OdulluReklamButonu odulEnerji={1} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  messageBox: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderRadius: 2,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  messageError: { borderColor: Colors.danger },
  messageText: { color: Colors.accent, fontSize: 12 },
  messageTextError: { color: Colors.danger },
  prestijBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#FFD70060',
    borderRadius: 2,
    padding: 14,
    marginBottom: 16,
  },
  prestijLabel: { color: Colors.gold, fontSize: 14 },
  prestijValue: { color: Colors.gold, fontSize: 22, fontWeight: 'bold' },
  section: { marginBottom: 20 },
  sectionTitle: { color: Colors.textPrimary, fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  itemCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 2,
    padding: 14,
    marginBottom: 10,
  },
  itemLocked: { opacity: 0.45 },
  itemHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  itemEmoji: { fontSize: 30, marginRight: 12 },
  itemInfo: { flex: 1 },
  itemName: { color: Colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  itemDesc: { color: Colors.textSecondary, fontSize: 11, marginTop: 2 },
  itemCurrentLevel: { color: Colors.accent, fontSize: 11, marginTop: 3 },
  lockedRow: { alignItems: 'center', paddingVertical: 4 },
  lockedText: { color: Colors.textSecondary, fontSize: 12 },
  maxedRow: { alignItems: 'center', paddingVertical: 4 },
  maxedText: { color: Colors.accent, fontSize: 13 },
  buyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: `${Colors.border}60`,
    paddingTop: 10,
  },
  nextLevelLabel: { color: Colors.textPrimary, fontSize: 12 },
  nextLevelCost: { color: Colors.gold, fontSize: 13, fontWeight: 'bold', marginTop: 2 },
  nextLevelPrestij: { color: `${Colors.gold}BB`, fontSize: 11, marginTop: 1 },
  buyBtn: { backgroundColor: Colors.accent, borderRadius: 2, paddingVertical: 10, paddingHorizontal: 20 },
  buyBtnText: { color: Colors.white, fontSize: 13, fontWeight: 'bold' },
  btnDisabled: { opacity: 0.4 },
  btnPressed: { transform: [{ scale: 0.97 }] },
  progressRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  progressStep: { alignItems: 'center', gap: 4 },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
    borderWidth: 1,
    borderColor: `${Colors.textSecondary}40`,
  },
  progressDotActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  progressLabel: { color: Colors.textSecondary, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 2,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDesc: { color: Colors.textSecondary, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  modalBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 2 },
  modalBtnYes: { backgroundColor: Colors.accent },
  modalBtnNo: { backgroundColor: Colors.surfaceLight, borderWidth: 1, borderColor: Colors.border },
  modalBtnText: { color: Colors.white, fontSize: 14, fontWeight: 'bold' },
});
