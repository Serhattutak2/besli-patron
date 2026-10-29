// ============================================
// SAHA BİZİM — scripts/metin-cikar.js
// Koddaki görünür Türkçe metinleri bulur ve i18n/kaynak.json'a yazar.
// Kullanım: node scripts/metin-cikar.js
// Şablonlar: ${...} ve {isim} yer tutucuları {0}, {1}... olur.
// JSX içinde metin + {ifade} karışımı tek şablon sayılır.
// ============================================
const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const KOK = path.join(__dirname, '..');
const KLASORLER = ['engine', 'components', 'context', 'services', 'constants', 'app'];
const dosyalar = [];
function gez(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) gez(p);
    else if (/\.(ts|tsx)$/.test(f) && !f.endsWith('.d.ts')) dosyalar.push(p);
  }
}
KLASORLER.forEach((k) => fs.existsSync(path.join(KOK, k)) && gez(path.join(KOK, k)));

const sonuc = new Map(); // anahtar -> örnek konum

function metinMi(s) {
  if (!s || !/[A-Za-zÇĞİÖŞÜçğıöşü]/.test(s)) return false;
  if (/^#[0-9a-fA-F]{3,8}$/.test(s)) return false;
  if (/^[a-z0-9_:.\-\/]+$/.test(s)) return false; // kimlikler, yollar
  if (/^[A-Za-z]+_[A-Za-z0-9_]+$/.test(s)) return false; // Nunito_800ExtraBold
  if (/^(rgba?|hsl)\(/.test(s)) return false;
  if (/^[a-z]+[A-Z][A-Za-z]*$/.test(s)) return false; // camelCase
  if (/^\.\/|^\.\.\//.test(s)) return false;
  if (/^[MmLlQqCcZz][\s{\d]/.test(s) && /\d/.test(s) && !/[a-zçğıöşü]{3}/.test(s)) return false; // SVG yolu
  if (/^misafir:/.test(s)) return false;
  if (/translate\(|rotate\(/.test(s)) return false;
  return true;
}

function yerTutucu(s, sayac) {
  // {cayci} gibi motor yer tutucuları
  return s.replace(/\{([a-zA-ZçğıöşüÇĞİÖŞÜ_]+)\}/g, () => `{${sayac.n++}}`);
}

function ekle(anahtar, dosya, node) {
  anahtar = anahtar.replace(/\s+/g, ' ').trim();
  if (!metinMi(anahtar.replace(/\{\d+\}/g, ''))) return;
  if (!sonuc.has(anahtar)) {
    const sf = node.getSourceFile();
    const { line } = sf.getLineAndCharacterOfPosition(node.getStart());
    sonuc.set(anahtar, `${path.relative(KOK, dosya)}:${line + 1}`);
  }
}

function atla(node) {
  const p = node.parent;
  if (!p) return false;
  if (ts.isImportDeclaration(p) || ts.isExportDeclaration(p)) return true;
  if (ts.isCallExpression(p) && p.expression.getText() === 'require') return true;
  if (ts.isPropertyAssignment(p) && p.name === node) return true;
  if (ts.isLiteralTypeNode(p)) return true;
  if (ts.isElementAccessExpression(p) && p.argumentExpression === node) return true;
  if (ts.isCaseClause(p)) return true;
  if (ts.isBinaryExpression(p) && ['===', '!==', '==', '!='].includes(p.operatorToken.getText())) return true;
  if (ts.isJsxAttribute(p)) {
    const ad = p.name.getText();
    return ['ikon', 'name', 'style', 'testID', 'key', 'fill', 'stroke', 'color', 'renk', 'tur', 'd', 'transform', 'fontWeight', 'textAnchor', 'points', 'id', 'href', 'resizeMode'].includes(ad);
  }
  return false;
}

// Babel'in JSX metin temizleme kuralı (React'ın çizdiği metinle birebir)
function jsxTemizle(ham) {
  const satirlar = ham.split(/\r\n|\n|\r/);
  let son = 0;
  satirlar.forEach((x, i) => { if (/[^ \t]/.test(x)) son = i; });
  let out = '';
  satirlar.forEach((x, i) => {
    const ilk = i === 0, sonSatir = i === satirlar.length - 1;
    let t = x.replace(/\t/g, ' ');
    if (!ilk) t = t.replace(/^[ ]+/, '');
    if (!sonSatir) t = t.replace(/[ ]+$/, '');
    if (t) { if (i !== son) t += ' '; out += t; }
  });
  return out;
}

function jsxCocuk(el, dosya) {
  const parcalar = [];
  let n = 0;
  let metinVar = false;
  for (const c of el.children) {
    if (ts.isJsxText(c)) {
      const t = jsxTemizle(c.text);
      if (t.trim()) metinVar = true;
      parcalar.push(t);
    } else if (ts.isJsxExpression(c)) {
      if (!c.expression) continue;
      parcalar.push(`{${n++}}`);
    } else {
      parcalar.push(null); // iç eleman: dizi bölünür
    }
  }
  if (!metinVar || n === 0) return; // tek metin zaten JsxText olarak eklenir
  if (parcalar.includes(null)) {
    // eleman araya girmişse parça parça ekle
    let grup = [];
    let m = 0;
    const bitir = () => {
      if (grup.some((g) => /[A-Za-zÇĞİÖŞÜçğıöşü]/.test(g.replace(/\{\d+\}/g, '')))) ekle(grup.join(''), dosya, el);
      grup = [];
    };
    for (const p of parcalar) {
      if (p === null) bitir();
      else grup.push(p.replace(/\{\d+\}/, () => `{${m++}}`));
    }
    bitir();
    return;
  }
  ekle(parcalar.join(''), dosya, el);
}

for (const dosya of dosyalar) {
  const kod = fs.readFileSync(dosya, 'utf8');
  const sf = ts.createSourceFile(dosya, kod, ts.ScriptTarget.Latest, true, dosya.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const ziyaret = (node) => {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && !atla(node)) {
      const sayac = { n: 0 };
      ekle(yerTutucu(node.text, sayac), dosya, node);
    } else if (ts.isTemplateExpression(node) && !atla(node)) {
      const sayac = { n: 0 };
      let s = yerTutucu(node.head.text, sayac);
      for (const sp of node.templateSpans) s += `{${sayac.n++}}` + yerTutucu(sp.literal.text, sayac);
      ekle(s, dosya, node);
    } else if (ts.isJsxText(node)) {
      const ebeveyn = node.parent;
      if (ebeveyn && ts.isJsxElement(ebeveyn) && ebeveyn.children.some((c) => ts.isJsxExpression(c) && c.expression)) {
        ts.forEachChild(node, ziyaret);
        return;
      }
      ekle(jsxTemizle(node.text), dosya, node);
    } else if (ts.isJsxElement(node)) {
      jsxCocuk(node, dosya);
    }
    ts.forEachChild(node, ziyaret);
  };
  ziyaret(sf);
}

const cikti = {};
for (const [k, v] of [...sonuc.entries()].sort((a, b) => a[1].localeCompare(b[1]))) cikti[k] = v;
fs.mkdirSync(path.join(KOK, 'i18n'), { recursive: true });
fs.writeFileSync(path.join(KOK, 'i18n', 'kaynak.json'), JSON.stringify(cikti, null, 1));
console.log('metin sayısı:', sonuc.size, ' toplam karakter:', [...sonuc.keys()].join('').length);
