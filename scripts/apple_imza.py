"""
SAHA BİZİM — scripts/apple_imza.py
GitHub Actions içinde çalışır. App Store Connect API anahtarıyla:
  1. Mevcut uygulamayı (App Store 6815316058) bulur, yeni sürüm ve derleme numarasını belirler.
  2. Dağıtım sertifikasını oluşturur (ilk seferde) ve şifreli olarak depoda saklar,
     sonraki derlemelerde aynı sertifikayı kullanır.
  3. Her derlemede taze bir App Store imza profili oluşturur.
  4. EAS için credentials.json ve eas.json'daki gönderim ayarlarını yazar,
     app.json'a sürüm ve derleme numarasını işler.
Gizli bilgiler ortam değişkenlerinden gelir: ASC_ISSUER_ID, ASC_KEY_ID, ASC_KEY_P8.
"""
import base64, hashlib, json, os, secrets, sys, time
import jwt, requests
from cryptography import x509
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs12
from cryptography.x509.oid import NameOID

BUNDLE = 'com.sardurtechnologies.beslipatron'
ASC_APP_ID = '6815316058'
API = 'https://api.appstoreconnect.apple.com'
KOK = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMZA = os.path.join(KOK, 'imza')  # derleme sırasında oluşur, depoya girmez
SAKLI = os.path.join(KOK, '.imza-sifreli')  # şifreli sertifika (depoda saklanır)

ISSUER = os.environ['ASC_ISSUER_ID'].strip()
KEY_ID = os.environ['ASC_KEY_ID'].strip()
P8 = os.environ['ASC_KEY_P8'].strip().replace('\\n', '\n')
if '-----BEGIN' not in P8:  # tek satır yapıştırıldıysa
    P8 = '-----BEGIN PRIVATE KEY-----\n' + P8 + '\n-----END PRIVATE KEY-----'
P8 = P8.replace('-----BEGIN PRIVATE KEY----- ', '-----BEGIN PRIVATE KEY-----\n').replace(' -----END PRIVATE KEY-----', '\n-----END PRIVATE KEY-----')


def bilgi(m):
    print(f'::notice::{m}', flush=True)


def hata(m):
    print(f'::error::{m}', flush=True)
    sys.exit(1)


def token():
    simdi = int(time.time())
    return jwt.encode({'iss': ISSUER, 'iat': simdi, 'exp': simdi + 1100, 'aud': 'appstoreconnect-v1'}, P8, algorithm='ES256', headers={'kid': KEY_ID, 'typ': 'JWT'})


def istek(yontem, yol, **kw):
    r = requests.request(yontem, API + yol, headers={'Authorization': 'Bearer ' + token(), 'Content-Type': 'application/json'}, timeout=60, **kw)
    if r.status_code >= 400:
        try:
            ayrinti = '; '.join(e.get('detail') or e.get('title', '') for e in r.json().get('errors', []))
        except Exception:
            ayrinti = r.text[:400]
        raise RuntimeError(f'{yontem} {yol} -> {r.status_code}: {ayrinti}')
    return r.json() if r.text else {}


def surum_buyut(v):
    p = [int(x) for x in v.split('.')] + [0, 0]
    return f'{p[0]}.{p[1] + 1}.0'


def surum_anahtar(v):
    return tuple(int(x) for x in (v.split('.') + ['0', '0'])[:3])


def main():
    os.makedirs(IMZA, exist_ok=True)
    # --- Uygulama ve sürümler
    try:
        app = istek('GET', f'/v1/apps/{ASC_APP_ID}')['data']
    except RuntimeError as e:
        hata(f'Uygulamaya erişilemedi. API anahtarının yetkisini (Yönetici) kontrol et. Ayrıntı: {e}')
    if app['attributes']['bundleId'] != BUNDLE:
        hata(f"App Store uygulamasının paket kimliği beklenenden farklı: {app['attributes']['bundleId']}")
    surumler = istek('GET', f'/v1/apps/{ASC_APP_ID}/appStoreVersions?filter[platform]=IOS&limit=50')['data']
    dizi = sorted((s['attributes']['versionString'] for s in surumler), key=surum_anahtar)
    duzenlenebilir = [s for s in surumler if s['attributes']['appStoreState'] in ('PREPARE_FOR_SUBMISSION', 'DEVELOPER_REJECTED', 'REJECTED', 'METADATA_REJECTED', 'INVALID_BINARY')]
    canli = [s['attributes']['versionString'] for s in surumler if s['attributes']['appStoreState'] == 'READY_FOR_SALE']
    # Yeni sürüm, yayınlanmış/incelenmiş tüm sürümlerden büyük olmalı
    yayinda = [s['attributes']['versionString'] for s in surumler if s not in duzenlenebilir]
    taban = surum_buyut(max(yayinda, key=surum_anahtar)) if yayinda else '1.1.0'
    if duzenlenebilir and surum_anahtar(duzenlenebilir[0]['attributes']['versionString']) >= surum_anahtar(taban):
        yeni_surum = duzenlenebilir[0]['attributes']['versionString']
    else:
        yeni_surum = taban
    bilgi(f"Mağazadaki sürüm(ler): {', '.join(dizi) or 'yok'} · canlı: {', '.join(canli) or '-'} · yeni sürüm: {yeni_surum}")

    derlemeler = istek('GET', f'/v1/builds?filter[app]={ASC_APP_ID}&sort=-uploadedDate&limit=50')['data']
    numaralar = [int(b['attributes']['version']) for b in derlemeler if b['attributes']['version'].isdigit()]
    yeni_derleme = max(numaralar + [33]) + 1  # 33 Apple tarafından reddedildi, tekrar kullanılmaz
    bilgi(f'Yeni derleme numarası: {yeni_derleme}')

    # --- Paket kimliği
    bids = istek('GET', f'/v1/bundleIds?filter[identifier]={BUNDLE}&limit=20')['data']
    bid = next((b for b in bids if b['attributes']['identifier'] == BUNDLE), None)
    if not bid:
        hata('Apple geliştirici hesabında paket kimliği bulunamadı.')

    # --- Sertifika (bir kez oluştur, şifreli sakla)
    anahtar = base64.urlsafe_b64encode(hashlib.sha256(('saha-bizim|' + P8.strip()).encode()).digest())
    f = Fernet(anahtar)
    os.makedirs(SAKLI, exist_ok=True)
    blob_yol = os.path.join(SAKLI, 'dagitim.bin')
    sertifika_id, p12, p12_sifre = None, None, None
    if os.path.exists(blob_yol):
        try:
            veri = json.loads(f.decrypt(open(blob_yol, 'rb').read()))
            sertifika_id, p12, p12_sifre = veri['id'], base64.b64decode(veri['p12']), veri['sifre']
            istek('GET', f'/v1/certificates/{sertifika_id}')
            bilgi('Kayıtlı dağıtım sertifikası kullanılıyor.')
        except Exception as e:
            print('Kayıtlı sertifika kullanılamadı, yenisi oluşturulacak:', e)
            sertifika_id = None
    if not sertifika_id:
        ozel = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        csr = x509.CertificateSigningRequestBuilder().subject_name(x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, 'Saha Bizim Dagitim'),
            x509.NameAttribute(NameOID.COUNTRY_NAME, 'TR'),
        ])).sign(ozel, hashes.SHA256())
        csr_pem = csr.public_bytes(serialization.Encoding.PEM).decode()
        try:
            c = istek('POST', '/v1/certificates', json={'data': {'type': 'certificates', 'attributes': {'certificateType': 'DISTRIBUTION', 'csrContent': csr_pem}}})['data']
        except RuntimeError as e:
            mevcut = istek('GET', '/v1/certificates?limit=50')['data']
            liste = ', '.join(f"{x['attributes']['name']} ({x['attributes']['certificateType']}, {x['attributes'].get('expirationDate', '')[:10]})" for x in mevcut)
            hata(f'Yeni dağıtım sertifikası oluşturulamadı (Apple sınırı olabilir). Mevcut sertifikalar: {liste}. Ayrıntı: {e}')
        sertifika_id = c['id']
        cert = x509.load_der_x509_certificate(base64.b64decode(c['attributes']['certificateContent']))
        p12_sifre = secrets.token_urlsafe(18)
        sifreleme = (serialization.PrivateFormat.PKCS12.encryption_builder()
                     .kdf_rounds(50000)
                     .key_cert_algorithm(pkcs12.PBES.PBESv1SHA1And3KeyTripleDESCBC)
                     .hmac_hash(hashes.SHA1())
                     .build(p12_sifre.encode()))
        p12 = pkcs12.serialize_key_and_certificates(b'Saha Bizim Dagitim', ozel, cert, None, sifreleme)
        open(blob_yol, 'wb').write(f.encrypt(json.dumps({'id': sertifika_id, 'p12': base64.b64encode(p12).decode(), 'sifre': p12_sifre}).encode()))
        open(os.path.join(SAKLI, 'YENI'), 'w').write('1')
        bilgi('Yeni dağıtım sertifikası oluşturuldu ve şifreli olarak saklandı.')
    open(os.path.join(IMZA, 'dagitim.p12'), 'wb').write(p12)

    # --- İmza profili (her seferinde taze)
    eski = istek('GET', '/v1/profiles?filter[name]=Saha Bizim AppStore&limit=50')['data']
    for pr in eski:
        if pr['attributes']['name'].startswith('Saha Bizim AppStore'):
            try:
                istek('DELETE', f"/v1/profiles/{pr['id']}")
            except Exception as e:
                print('Eski profil silinemedi:', e)
    pr = istek('POST', '/v1/profiles', json={'data': {'type': 'profiles', 'attributes': {'name': f'Saha Bizim AppStore {int(time.time())}', 'profileType': 'IOS_APP_STORE'}, 'relationships': {'bundleId': {'data': {'type': 'bundleIds', 'id': bid['id']}}, 'certificates': {'data': [{'type': 'certificates', 'id': sertifika_id}]}}}})['data']
    open(os.path.join(IMZA, 'profil.mobileprovision'), 'wb').write(base64.b64decode(pr['attributes']['profileContent']))
    bilgi('App Store imza profili hazır.')

    # --- EAS dosyaları
    open(os.path.join(IMZA, 'asc.p8'), 'w').write(P8 + '\n')
    json.dump({'ios': {'provisioningProfilePath': 'imza/profil.mobileprovision', 'distributionCertificate': {'path': 'imza/dagitim.p12', 'password': p12_sifre}}}, open(os.path.join(KOK, 'credentials.json'), 'w'), indent=2)
    eas = json.load(open(os.path.join(KOK, 'eas.json')))
    eas['submit']['production']['ios'].update({'ascApiKeyPath': './imza/asc.p8', 'ascApiKeyIssuerId': ISSUER, 'ascApiKeyId': KEY_ID})
    json.dump(eas, open(os.path.join(KOK, 'eas.json'), 'w'), indent=2)
    a = json.load(open(os.path.join(KOK, 'app.json')))
    a['expo']['version'] = yeni_surum
    a['expo']['ios']['buildNumber'] = str(yeni_derleme)
    json.dump(a, open(os.path.join(KOK, 'app.json'), 'w'), ensure_ascii=False, indent=2)
    with open(os.environ.get('GITHUB_OUTPUT', '/dev/null'), 'a') as o:
        o.write(f'surum={yeni_surum}\nderleme={yeni_derleme}\n')


if __name__ == '__main__':
    main()
