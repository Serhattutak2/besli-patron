"""
SAHA BİZİM — scripts/asc_magaza.py
App Store mağaza sayfasını günceller (incelemeye GÖNDERMEZ):
  - magaza/metinler.json'daki metinler (TR + EN): açıklama, anahtar kelimeler,
    tanıtım metni, ad, alt başlık, inceleme notu, adresler
  - magaza/ekran/<cihaz>_<dil>/*.jpg ekran görüntüleri (iPhone 6.7" ve iPad 12.9")
Gizli bilgiler: ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_P8.
"""
import hashlib, json, os, sys, time
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apple_imza import istek, bilgi, hata, ASC_APP_ID, KOK  # noqa: E402

SITE = 'https://serhattutak2.github.io'
DUZENLENEBILIR = ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY')
EKRAN_TIPI = {'iphone': 'APP_IPHONE_67', 'ipad': 'APP_IPAD_PRO_3GEN_129'}
M = json.load(open(os.path.join(KOK, 'magaza', 'metinler.json'), encoding='utf-8'))
DIL_ANAHTAR = {v['locale']: k for k, v in M.items()}


def sayfali(yol):
    veri, url = [], yol
    while url:
        r = istek('GET', url)
        veri += r['data']
        nxt = r.get('links', {}).get('next')
        url = nxt.replace('https://api.appstoreconnect.apple.com', '') if nxt else None
    return veri


def surum_bul():
    surumler = istek('GET', f'/v1/apps/{ASC_APP_ID}/appStoreVersions?filter[platform]=IOS&limit=50')['data']
    sv = next((s for s in surumler if s['attributes']['appStoreState'] in DUZENLENEBILIR), None)
    if not sv:
        hata('Düzenlenebilir sürüm yok (sürüm incelemede ya da yayında olabilir).')
    bilgi(f"Sürüm sayfası: {sv['attributes']['versionString']} ({sv['attributes']['appStoreState']})")
    return sv


def surum_metinleri(sv):
    yerler = {l['attributes']['locale']: l for l in istek('GET', f"/v1/appStoreVersions/{sv['id']}/appStoreVersionLocalizations?limit=50")['data']}
    sonuc = {}
    for anahtar, m in M.items():
        loc = m['locale']
        ozellik = {'description': m['description'], 'keywords': m['keywords'], 'promotionalText': m['promotionalText'],
                   'marketingUrl': SITE, 'supportUrl': SITE + '/destek.html'}
        try:
            if loc in yerler:
                l = yerler[loc]
                eski_yeni = l['attributes'].get('whatsNew')
                istek('PATCH', f"/v1/appStoreVersionLocalizations/{l['id']}", json={'data': {'type': 'appStoreVersionLocalizations', 'id': l['id'], 'attributes': ozellik}})
            else:
                ozellik['whatsNew'] = M['en']['promotionalText'] if anahtar == 'en' else M['tr']['promotionalText']
                ozellik['locale'] = loc
                l = istek('POST', '/v1/appStoreVersionLocalizations', json={'data': {'type': 'appStoreVersionLocalizations', 'attributes': ozellik, 'relationships': {'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': sv['id']}}}}})['data']
                bilgi(f'{loc} mağaza sayfası eklendi.')
            sonuc[anahtar] = l
            bilgi(f'{loc}: açıklama, anahtar kelimeler ve tanıtım metni yazıldı.')
        except RuntimeError as e:
            print(f'::warning::{loc} metinleri yazılamadı: {e}')
    # İngilizce sayfada "Yenilikler" İngilizce olsun
    if 'en' in sonuc:
        try:
            from asc_surum import YENI_EN
            istek('PATCH', f"/v1/appStoreVersionLocalizations/{sonuc['en']['id']}", json={'data': {'type': 'appStoreVersionLocalizations', 'id': sonuc['en']['id'], 'attributes': {'whatsNew': YENI_EN}}})
        except Exception as e:
            print('::warning::İngilizce yenilikler yazılamadı:', e)
    return sonuc


def uygulama_bilgileri():
    infos = istek('GET', f'/v1/apps/{ASC_APP_ID}/appInfos')['data']
    info = next((i for i in infos if (i['attributes'].get('appStoreState') or i['attributes'].get('state')) not in ('READY_FOR_SALE', 'READY_FOR_DISTRIBUTION')), infos[0])
    yerler = {l['attributes']['locale']: l for l in istek('GET', f"/v1/appInfos/{info['id']}/appInfoLocalizations?limit=50")['data']}
    for anahtar, m in M.items():
        loc = m['locale']
        ozellik = {'name': m['name'], 'subtitle': m['subtitle'], 'privacyPolicyUrl': SITE + '/gizlilik.html'}
        try:
            if loc in yerler:
                istek('PATCH', f"/v1/appInfoLocalizations/{yerler[loc]['id']}", json={'data': {'type': 'appInfoLocalizations', 'id': yerler[loc]['id'], 'attributes': ozellik}})
            else:
                ozellik['locale'] = loc
                istek('POST', '/v1/appInfoLocalizations', json={'data': {'type': 'appInfoLocalizations', 'attributes': ozellik, 'relationships': {'appInfo': {'data': {'type': 'appInfos', 'id': info['id']}}}}})
            bilgi(f"{loc}: ad '{m['name']}', alt başlık '{m['subtitle']}'.")
        except RuntimeError as e:
            print(f'::warning::{loc} ad/alt başlık yazılamadı: {e}')


def inceleme_notu(sv):
    notlar = M['tr']['reviewNotes']
    try:
        r = istek('GET', f"/v1/appStoreVersions/{sv['id']}/appStoreReviewDetail")
        d = r.get('data')
        if d:
            istek('PATCH', f"/v1/appStoreReviewDetails/{d['id']}", json={'data': {'type': 'appStoreReviewDetails', 'id': d['id'], 'attributes': {'notes': notlar, 'demoAccountRequired': False}}})
        else:
            istek('POST', '/v1/appStoreReviewDetails', json={'data': {'type': 'appStoreReviewDetails', 'attributes': {'notes': notlar, 'demoAccountRequired': False}, 'relationships': {'appStoreVersion': {'data': {'type': 'appStoreVersions', 'id': sv['id']}}}}})
        bilgi('İnceleme notu güncellendi.')
    except RuntimeError as e:
        print(f'::warning::İnceleme notu yazılamadı: {e}')


def ekran_yukle(set_id, yol):
    veri = open(yol, 'rb').read()
    ad = os.path.basename(os.path.dirname(yol)) + '_' + os.path.basename(yol)
    s = istek('POST', '/v1/appScreenshots', json={'data': {'type': 'appScreenshots', 'attributes': {'fileName': ad, 'fileSize': len(veri)}, 'relationships': {'appScreenshotSet': {'data': {'type': 'appScreenshotSets', 'id': set_id}}}}})['data']
    for op in s['attributes']['uploadOperations']:
        bas, uz = op['offset'], op['length']
        h = {x['name']: x['value'] for x in op.get('requestHeaders', [])}
        r = requests.request(op['method'], op['url'], headers=h, data=veri[bas:bas + uz], timeout=120)
        if r.status_code >= 300:
            raise RuntimeError(f'Parça yüklenemedi: {r.status_code} {r.text[:200]}')
    istek('PATCH', f"/v1/appScreenshots/{s['id']}", json={'data': {'type': 'appScreenshots', 'id': s['id'], 'attributes': {'uploaded': True, 'sourceFileChecksum': hashlib.md5(veri).hexdigest()}}})
    return s['id']


def ekranlar(yerel):
    for anahtar, l in yerel.items():
        setler = {x['attributes']['screenshotDisplayType']: x for x in sayfali(f"/v1/appStoreVersionLocalizations/{l['id']}/appScreenshotSets?limit=50")}
        # Eski oyunun görsellerini temizle (tüm ekran tipleri)
        for tip, st in setler.items():
            for sc in sayfali(f"/v1/appScreenshotSets/{st['id']}/appScreenshots?limit=50"):
                try:
                    istek('DELETE', f"/v1/appScreenshots/{sc['id']}")
                except RuntimeError as e:
                    print(f'::warning::Eski görsel silinemedi ({tip}): {e}')
        for cihaz, tip in EKRAN_TIPI.items():
            klasor = os.path.join(KOK, 'magaza', 'ekran', f'{cihaz}_{anahtar}')
            if not os.path.isdir(klasor):
                continue
            st = setler.get(tip) or istek('POST', '/v1/appScreenshotSets', json={'data': {'type': 'appScreenshotSets', 'attributes': {'screenshotDisplayType': tip}, 'relationships': {'appStoreVersionLocalization': {'data': {'type': 'appStoreVersionLocalizations', 'id': l['id']}}}}})['data']
            dosyalar = sorted(f for f in os.listdir(klasor) if f.endswith(('.jpg', '.png')))
            for f in dosyalar:
                ekran_yukle(st['id'], os.path.join(klasor, f))
            bilgi(f"{l['attributes']['locale']} · {tip}: {len(dosyalar)} görsel yüklendi.")
    # Apple'ın görselleri işlemesini bekle ve kontrol et
    time.sleep(20)
    for anahtar, l in yerel.items():
        for st in sayfali(f"/v1/appStoreVersionLocalizations/{l['id']}/appScreenshotSets?limit=50"):
            durumlar = [sc['attributes'].get('assetDeliveryState', {}).get('state') for sc in sayfali(f"/v1/appScreenshotSets/{st['id']}/appScreenshots?limit=50")]
            if durumlar:
                bilgi(f"{l['attributes']['locale']} · {st['attributes']['screenshotDisplayType']}: {', '.join(str(d) for d in durumlar)}")


def main():
    sv = surum_bul()
    yerel = surum_metinleri(sv)
    uygulama_bilgileri()
    inceleme_notu(sv)
    ekranlar(yerel)
    bilgi('Mağaza sayfası güncellendi. Sıradaki adım: App Store Connect\'te kontrol et ve İncelemeye Gönder.')


if __name__ == '__main__':
    main()
