// ============================================
// BEŞLİ PATRON — app/tabs/profil.tsx
// Profil: istatistikler, jeton, kayıt, şehirler, sıfırlama
// (Karaktere 5 kez dokununca geliştirici paneli açılır — yayındaki sürümle aynı)
// ============================================
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useGame } from '../../context/GameContext';
import { Colors } from '../../constants/colors';
import { CITIES, JETON_ENERJI_COST, JETON_ENERJI_GAIN, MAX_ENERJI } from '../../constants/gameConfig';
import { taniOku, islemKaydet } from '../../services/tani';

const F = { fontFamily: 'SpaceMono' };
const tl = (n: number) => `${Math.round(n).toLocaleString('tr-TR')} ₺`;

export default function Profil() {
  const { state, useJeton, manualSave, resetGame, unlockCity, switchCity, devHediye } = useGame();
  const [mesaj, setMesaj] = useState('');
  const [devAcik, setDevAcik] = useState(false);
  const [tikSayisi, setTikSayisi] = useState(0);
  const [taniMetni, setTaniMetni] = useState<string | null>(null);
  const [sifirlaOnay, setSifirlaOnay] = useState(false);
  const [acilacakSehir, setAcilacakSehir] = useState<any>(null);

  const jeton = state?.jeton ?? 0;
  const enerji = state?.enerji ?? 0;
  const prestij = state?.prestij ?? 0;
  const nakit = state?.nakit ?? 0;
  const jetonKullanilir = jeton >= JETON_ENERJI_COST && enerji < MAX_ENERJI;

  const showMsg = (m: string) => {
    setMesaj(m);
    setTimeout(() => setMesaj(''), 2500);
  };

  const futbolcuTik = () => {
    const yeni = tikSayisi + 1;
    if (yeni >= 5) {
      setDevAcik(true);
      setTikSayisi(0);
      showMsg('Geliştirici paneli açıldı! 🧪');
    } else setTikSayisi(yeni);
  };

  const sifirla = async () => {
    islemKaydet('KULLANICI: oyunu sifirladi');
    setSifirlaOnay(false);
    await resetGame();
    router.replace('/intro');
  };

  const sehirler = CITIES as any[];

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {mesaj !== '' && (
          <View style={styles.messageBox}>
            <Text style={[styles.messageText, F]}>{mesaj}</Text>
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.avatarRow}>
            <View style={styles.avatar}>
              <View style={styles.avatarHead} />
              <View style={styles.avatarBody} />
            </View>
            <Pressable style={styles.charInfo} onPress={futbolcuTik}>
              <Text style={[styles.charName, F]}>Eski Futbolcu</Text>
              <Text style={[styles.charTitle, F]}>Halısaha Patronu</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, F]}>📊 İstatistikler</Text>
          <Satir etiket="📅 Toplam Gün" deger={String(state?.gun ?? 1)} />
          <Satir etiket="💰 Nakit" deger={tl(nakit)} stil={styles.statValueGold} />
          <Satir etiket="💵 Toplam Kazanç" deger={tl(state?.toplamKazanc ?? 0)} stil={styles.statValueGold} />
          <Satir etiket="🏟️ Saha Kalitesi" deger={`${state?.sahaKalitesi ?? 0}/10`} />
          <Satir etiket="⚡ Enerji" deger={String(enerji)} />
          <Satir etiket="⭐ Prestij" deger={String(prestij)} stil={styles.statValuePrestige} />
          <Satir etiket="🔵 Jeton" deger={String(jeton)} />
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, F]}>⚡ Enerji ve Kayıt</Text>
          <Pressable
            style={[styles.actionButton, !jetonKullanilir && styles.disabledButton]}
            disabled={!jetonKullanilir}
            onPress={() => {
              const hata = useJeton();
              showMsg(hata ?? `${JETON_ENERJI_GAIN} Enerji yüklendi!`);
            }}
          >
            <Text style={[styles.buttonText, F]}>
              🔵 Jeton Kullan — +{JETON_ENERJI_GAIN} Enerji ({JETON_ENERJI_COST} jeton)
            </Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            onPress={async () => {
              await manualSave();
              showMsg('Oyun kaydedildi!');
            }}
          >
            <Text style={[styles.buttonText, F]}>💾 Oyunu Kaydet</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, F]}>🏙️ Şehirler</Text>
          {sehirler.map((c) => {
            const acik = !!state?.cities?.[c.id]?.unlocked;
            const aktif = state?.activeSehir === c.id;
            const maliyet = Number(c.unlockCost ?? 0);
            const gerekPrestij = Number(c.requiredPrestij ?? c.prestijCost ?? 0);
            return (
              <View key={c.id} style={styles.cityRow}>
                <View style={styles.cityInfo}>
                  <Text style={[styles.cityName, F]}>
                    {c.emoji ?? '🏙️'} {c.label ?? c.ad ?? c.id}
                  </Text>
                  {acik ? (
                    <Text style={[styles.cityStatus, F]}>{aktif ? '✅ Aktif şehir' : '🔓 Açık'}</Text>
                  ) : (
                    <Text style={[styles.cityLocked, F]}>
                      🔒 {maliyet.toLocaleString('tr-TR')}₺ / ⭐{gerekPrestij}
                    </Text>
                  )}
                </View>
                <Pressable
                  style={[styles.smallButton, aktif && styles.disabledButton]}
                  disabled={aktif}
                  onPress={() => {
                    if (!acik) return setAcilacakSehir(c);
                    const hata = switchCity(c.id);
                    showMsg(hata ?? 'Şehir değiştirildi! 🏙️');
                  }}
                >
                  <Text style={[styles.smallButtonText, F]}>{aktif ? 'Aktif' : acik ? 'Geç' : 'Aç'}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <Pressable style={styles.resetButton} onPress={() => setSifirlaOnay(true)}>
          <Text style={[styles.resetButtonText, F]}>🗑️ Oyunu Sıfırla</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={devAcik} transparent animationType="fade" onRequestClose={() => setDevAcik(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.devPanel}>
            <Text style={[styles.devTitle, F]}>🧪 Geliştirici Test Paneli</Text>
            <Text style={[styles.devDescription, F]}>Kilitli özellikleri test etmek için kullanılır.</Text>
            {(
              [
                ['💰 +1.000.000₺', () => devHediye(1000000, 0, 0), '+1.000.000₺ eklendi! 💰'],
                ['⭐ +100 Prestij', () => devHediye(0, 100, 0), '+100 prestij eklendi! ⭐'],
                ['🔵 +50 Jeton', () => devHediye(0, 0, 50), '+50 jeton eklendi! 🔵'],
                ['⚡ Enerjiyi Doldur', () => devHediye(0, 0, 0, true), 'Enerji tamamen dolduruldu! ⚡'],
              ] as [string, () => void, string][]
            ).map(([yazi, is, m]) => (
              <Pressable
                key={yazi}
                style={styles.devButton}
                onPress={() => {
                  is();
                  showMsg(m);
                }}
              >
                <Text style={[styles.devButtonText, F]}>{yazi}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.devButton} onPress={async () => setTaniMetni(await taniOku())}>
              <Text style={[styles.devButtonText, F]}>🩺 Tanı Raporu</Text>
            </Pressable>
            <Pressable style={styles.closeButton} onPress={() => setDevAcik(false)}>
              <Text style={[styles.closeButtonText, F]}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={taniMetni !== null} transparent animationType="fade" onRequestClose={() => setTaniMetni(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.devPanel}>
            <Text style={[styles.devTitle, F]}>🩺 Tanı Raporu</Text>
            <ScrollView style={{ maxHeight: 360, marginBottom: 8 }}>
              <Text selectable style={{ color: '#E5E7EB', fontFamily: 'SpaceMono', fontSize: 10, lineHeight: 15 }}>
                {taniMetni}
              </Text>
            </ScrollView>
            <Pressable style={styles.closeButton} onPress={() => setTaniMetni(null)}>
              <Text style={[styles.closeButtonText, F]}>Kapat</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={sifirlaOnay} transparent animationType="fade" onRequestClose={() => setSifirlaOnay(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmPanel}>
            <Text style={[styles.confirmTitle, F]}>Oyunu sıfırlamak istiyor musun?</Text>
            <Text style={[styles.confirmText, F]}>Tüm ilerleme silinecek. Bu işlem geri alınamaz.</Text>
            <View style={styles.confirmButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setSifirlaOnay(false)}>
                <Text style={[styles.buttonText, F]}>Vazgeç</Text>
              </Pressable>
              <Pressable style={styles.dangerButton} onPress={sifirla}>
                <Text style={[styles.buttonText, F]}>Sıfırla</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={!!acilacakSehir} transparent animationType="fade" onRequestClose={() => setAcilacakSehir(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.confirmPanel}>
            <Text style={[styles.confirmTitle, F]}>Şehir kilidi açılsın mı?</Text>
            <Text style={[styles.confirmText, F]}>
              Bu şehir için {Number(acilacakSehir?.unlockCost ?? 0).toLocaleString('tr-TR')}₺ ve ⭐
              {Number(acilacakSehir?.requiredPrestij ?? acilacakSehir?.prestijCost ?? 0)} prestij gereklidir.
            </Text>
            <View style={styles.confirmButtons}>
              <Pressable style={styles.cancelButton} onPress={() => setAcilacakSehir(null)}>
                <Text style={[styles.buttonText, F]}>Vazgeç</Text>
              </Pressable>
              <Pressable
                style={styles.confirmButton}
                onPress={() => {
                  const hata = unlockCity(acilacakSehir.id);
                  setAcilacakSehir(null);
                  showMsg(hata ?? 'Şehir açıldı! 🎉');
                }}
              >
                <Text style={[styles.buttonText, F]}>Şehri Aç</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

function Satir({ etiket, deger, stil }: { etiket: string; deger: string; stil?: any }) {
  return (
    <View style={styles.statRow}>
      <Text style={[styles.statLabel, F]}>{etiket}</Text>
      <Text style={[stil ?? styles.statValue, F]}>{deger}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageBox: { backgroundColor: '#173F2A', borderRadius: 12, padding: 12, marginBottom: 14 },
  messageText: { color: Colors.white, textAlign: 'center', fontSize: 13 },
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#26364D',
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginRight: 14,
  },
  avatarHead: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#E3A878', marginBottom: 4 },
  avatarBody: { width: 42, height: 25, borderTopLeftRadius: 18, borderTopRightRadius: 18, backgroundColor: '#D89B32' },
  charInfo: { flex: 1 },
  charName: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  charTitle: { color: Colors.textMuted, fontSize: 13, marginTop: 5 },
  cardTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 12 },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statLabel: { color: Colors.textMuted, fontSize: 13 },
  statValue: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  statValueGold: { color: '#F2C14E', fontSize: 14, fontWeight: '700' },
  statValuePrestige: { color: '#B88CFF', fontSize: 14, fontWeight: '700' },
  actionButton: { backgroundColor: Colors.primary, borderRadius: 10, padding: 13, alignItems: 'center', marginTop: 8 },
  disabledButton: { opacity: 0.45 },
  buttonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cityInfo: { flex: 1, paddingRight: 8 },
  cityName: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  cityStatus: { color: '#65D391', fontSize: 11, marginTop: 3 },
  cityLocked: { color: '#E6A04B', fontSize: 11, marginTop: 3 },
  smallButton: { backgroundColor: Colors.primary, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  smallButtonText: { color: Colors.white, fontSize: 11, fontWeight: '700' },
  resetButton: { backgroundColor: '#642D35', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 4 },
  resetButtonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  devPanel: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E5A93D',
  },
  devTitle: { color: '#E5A93D', fontSize: 18, fontWeight: '700', textAlign: 'center' },
  devDescription: { color: Colors.textMuted, textAlign: 'center', fontSize: 12, marginTop: 8, marginBottom: 16 },
  devButton: { backgroundColor: '#2A3950', borderRadius: 10, padding: 14, marginTop: 9, alignItems: 'center' },
  devButtonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  closeButton: { backgroundColor: '#642D35', borderRadius: 10, padding: 13, marginTop: 18, alignItems: 'center' },
  closeButtonText: { color: Colors.white, fontSize: 13, fontWeight: '700' },
  confirmPanel: { width: '100%', maxWidth: 380, backgroundColor: Colors.card, borderRadius: 18, padding: 20 },
  confirmTitle: { color: Colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  confirmText: { color: Colors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  confirmButtons: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelButton: { flex: 1, backgroundColor: '#536174', borderRadius: 10, padding: 13, alignItems: 'center' },
  dangerButton: { flex: 1, backgroundColor: '#A33A45', borderRadius: 10, padding: 13, alignItems: 'center' },
  confirmButton: { flex: 1, backgroundColor: Colors.primary, borderRadius: 10, padding: 13, alignItems: 'center' },
});
