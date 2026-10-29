"""
SAHA BİZİM — scripts/asc_surum.py
App Store Connect'te yeni sürüm sayfasını hazırlar (incelemeye GÖNDERMEZ):
  - Yüklenen derlemenin işlenmesini bekler
  - Sürüm yoksa oluşturur (ör. 1.1.0)
  - "Bu sürümdeki yenilikler", pazarlama ve gizlilik adreslerini yazar
  - Uygulama adını "Saha Bizim" yapar
  - Derlemeyi sürüme bağlar
Gizli bilgiler: ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_P8. İsteğe bağlı: SURUM, DERLEME.
"""
import os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apple_imza import istek, bilgi, hata, ASC_APP_ID, surum_anahtar  # noqa: E402

AD = 'Saha Bizim'
ALT_BASLIK = {'tr': 'Halısaha patronu ol', 'en': 'Run your five-a-side pitch'}
SITE = 'https://serhattutak2.github.io'
GIZLILIK = SITE + '/gizlilik.html'
YENI_TR = """Beşli Patron artık SAHA BİZİM!

• 8 şehir, şehre özel hikâyeler ve karakterler
• Yüzlerce canlı an, devam eden hikâyeler, altın anlar ve beceri oyunları
• Mahalle kupası, büyük final ve rakip patronla meydan okumalar
• Kendi takımını kur: Saha Bizim SK, transfer, antrenman ve haftalık lig
• Günlük görevler, haftalık sandık ve 30 kademeli sezon kartı
• Tesisini süsle: çim, tabela, bayrak ve maskot
• Yenilenen grafikler, harita ve maç sahneleri
• Özgün müzikler ve ses efektleri
• İngilizce dil desteği"""
YENI_EN = """Beşli Patron is now SAHA BİZİM!

• 8 cities with their own stories and characters
• Hundreds of live moments, ongoing storylines, golden moments and skill games
• District cup, grand final and challenges from the rival boss
• Build your own team: Saha Bizim SK, transfers, training and a weekly league
• Daily tasks, weekly chest and a 30-tier season pass
• Decorate your facility: grass, sign, flag and mascot
• Refreshed graphics, map and match scenes
• Original music and sound effects
• English language support"""

DUZENLENEBILIR = ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY')


def dil_tr(locale):
    return locale.lower().startswith('tr')


def main():
    surum = os.environ.get('SURUM') or ''
    derleme_no = os.environ.get('DERLEME') or ''
    # --- Derlemeyi bekle
    build = None
    for deneme in range(60):
        bs = istek('GET', f'/v1/builds?filter[app]={ASC_APP_ID}&sort=-uploadedDate&limit=10')['data']
        if derleme_no:
            bs = [b for b in bs if b['attributes']['version'] == derleme_no]
        if bs:
            b = bs[0]
            durum = b['attributes']['processingState']
            print(f"Derleme {b['attributes']['version']}: {durum}", flush=True)
            if durum == 'VALID':
                build = b
                break
            if durum in ('FAILED', 'INVALID'):
                hata(f'Apple derlemeyi reddetti ({durum}). App Store Connect e-postalarını kontrol et.')
        else:
            print('Derleme henüz görünmüyor, bekleniyor…', flush=True)
        time.sleep(30)
    if not build:
        hata('Derleme 30 dakikada işlenmedi; adımı daha sonra tekrar çalıştır.')
    if not surum:
        pre = istek('GET', f"/v1/builds/{build['id']}/preReleaseVersion")['data']
        surum = pre['attributes']['version']
    bilgi(f"İşlenen derleme: {build['attributes']['version']} · sürüm {surum}")

    # --- Şifreleme beyanı (Info.plist'te de var; yine de işaretle)
    try:
        if build['attributes'].get('usesNonExemptEncryption') is None:
            istek('PATCH', f"/v1/builds/{build['id']}", json={'data': {'type': 'builds', 'id': build['id'], 'attributes': {'usesNonExemptEncryption': False}}})
    except Exception as e:
        print('Şifreleme beyanı atlandı:', e)

    # --- Sürüm sayfası
    surumler = istek('GET', f'/v1/apps/{ASC_APP_ID}/appStoreVersions?filter[platform]=IOS&limit=50')['data']
    sv = next((s for s in surumler if s['attributes']['appStoreState'] in DUZENLENEBILIR), None)
    if sv and sv['attributes']['versionString'] != surum:
        istek('PATCH', f"/v1/appStoreVersions/{sv['id']}", json={'data': {'type': 'appStoreVersions', 'id': sv['id'], 'attributes': {'versionString': surum}}})
    if not sv:
        sv = istek('POST', '/v1/appStoreVersions', json={'data': {'type': 'appStoreVersions', 'attributes': {'platform': 'IOS', 'versionString': surum}, 'relationships': {'app': {'data': {'type': 'apps', 'id': ASC_APP_ID}}}}})['data']
        bilgi(f'{surum} sürüm sayfası oluşturuldu.')

    # --- Yenilikler ve adresler (her dil)
    yer = istek('GET', f"/v1/appStoreVersions/{sv['id']}/appStoreVersionLocalizations?limit=50")['data']
    for l in yer:
        loc = l['attributes']['locale']
        try:
            istek('PATCH', f"/v1/appStoreVersionLocalizations/{l['id']}", json={'data': {'type': 'appStoreVersionLocalizations', 'id': l['id'], 'attributes': {'whatsNew': YENI_TR if dil_tr(loc) else YENI_EN, 'marketingUrl': SITE}}})
            bilgi(f'{loc}: yenilikler ve pazarlama adresi yazıldı.')
        except Exception as e:
            print(f'{loc} yazılamadı:', e)

    # --- Uygulama adı ve gizlilik adresi
    try:
        infos = istek('GET', f'/v1/apps/{ASC_APP_ID}/appInfos')['data']
        info = next((i for i in infos if i['attributes'].get('appStoreState') in DUZENLENEBILIR or i['attributes'].get('state') in ('PREPARE_FOR_SUBMISSION', 'READY_FOR_REVIEW', 'WAITING_FOR_REVIEW')), None) or infos[0]
        for l in istek('GET', f"/v1/appInfos/{info['id']}/appInfoLocalizations?limit=50")['data']:
            loc = l['attributes']['locale']
            ozellik = {'name': AD, 'privacyPolicyUrl': GIZLILIK, 'subtitle': ALT_BASLIK['tr' if dil_tr(loc) else 'en']}
            try:
                istek('PATCH', f"/v1/appInfoLocalizations/{l['id']}", json={'data': {'type': 'appInfoLocalizations', 'id': l['id'], 'attributes': ozellik}})
                bilgi(f'{loc}: uygulama adı "{AD}" yapıldı.')
            except Exception as e:
                print(f'::warning::{loc} adı değiştirilemedi: {e}')
    except Exception as e:
        print(f'::warning::Uygulama bilgileri güncellenemedi: {e}')

    # --- Derlemeyi bağla
    istek('PATCH', f"/v1/appStoreVersions/{sv['id']}/relationships/build", json={'data': {'type': 'builds', 'id': build['id']}})
    bilgi(f"Derleme {build['attributes']['version']}, {surum} sürümüne bağlandı. Sıradaki adım: App Store Connect'te 'İncelemeye Gönder'.")


if __name__ == '__main__':
    main()
