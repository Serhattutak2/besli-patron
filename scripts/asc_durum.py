"""App Store Connect durum özeti: son derlemeler ve sürüm sayfaları (yalnızca okur)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from apple_imza import istek, bilgi, ASC_APP_ID  # noqa: E402

bs = istek('GET', f'/v1/builds?filter[app]={ASC_APP_ID}&sort=-uploadedDate&limit=8&include=preReleaseVersion')
pre = {i['id']: i['attributes']['version'] for i in bs.get('included', []) if i['type'] == 'preReleaseVersions'}
for b in bs['data']:
    a = b['attributes']
    pv = (b.get('relationships', {}).get('preReleaseVersion', {}).get('data') or {}).get('id')
    bilgi(f"Derleme {a['version']} (sürüm {pre.get(pv, '?')}): {a['processingState']} · yüklendi {a['uploadedDate'][:16]} · süresi doldu: {a.get('expired')}")
for s in istek('GET', f'/v1/apps/{ASC_APP_ID}/appStoreVersions?filter[platform]=IOS&limit=10')['data']:
    bilgi(f"Sürüm sayfası {s['attributes']['versionString']}: {s['attributes']['appStoreState']}")
