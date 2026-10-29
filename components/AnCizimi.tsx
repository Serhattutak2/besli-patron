// ============================================
// SAHA BİZİM — components/AnCizimi.tsx
// Canlı anların küçük sahne çizimleri (her olay türü için bir illüstrasyon)
// ============================================
import React from 'react';
import Svg, { Rect, Circle, Path, Ellipse, G, Line, Text as SvgText, Defs, LinearGradient, Stop, Polygon } from 'react-native-svg';
import type { SahneTuru } from '../engine/anlar';

const W = 300;
const H = 120;

function Oyuncu({ x, y, renk = '#F59E0B', ten = '#E0AC69', olcek = 1, kol = 0, yatik = false }: { x: number; y: number; renk?: string; ten?: string; olcek?: number; kol?: number; yatik?: boolean }) {
  return (
    <G transform={`translate(${x} ${y}) scale(${olcek}) rotate(${yatik ? 80 : 0})`}>
      <Line x1="-4" y1="0" x2="-6" y2="14" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
      <Line x1="4" y1="0" x2="6" y2="14" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
      <Rect x="-8" y="-18" width="16" height="19" rx="4" fill={renk} />
      <Line x1="-8" y1="-14" x2={-15} y2={-14 - kol} stroke={ten} strokeWidth="3.5" strokeLinecap="round" />
      <Line x1="8" y1="-14" x2={15} y2={-14 - kol} stroke={ten} strokeWidth="3.5" strokeLinecap="round" />
      <Circle cx="0" cy="-25" r="7" fill={ten} />
      <Path d="M-7 -27 Q0 -36 7 -27 Q3 -31 0 -31 Q-3 -31 -7 -27 Z" fill="#2B1B10" />
    </G>
  );
}
const Top = ({ x, y, r = 6 }: { x: number; y: number; r?: number }) => (
  <G>
    <Circle cx={x} cy={y} r={r} fill="#FFFFFF" stroke="#111827" strokeWidth="1.2" />
    <Path d={`M${x - r * 0.35} ${y - r * 0.2} l${r * 0.35} ${-r * 0.25} l${r * 0.35} ${r * 0.25} l${-r * 0.12} ${r * 0.4} h${-r * 0.46} z`} fill="#111827" />
  </G>
);
const Yildizcik = ({ x, y, r = 5, renk = '#FCD34D' }: { x: number; y: number; r?: number; renk?: string }) => (
  <Path d={`M${x} ${y - r} L${x + r * 0.3} ${y - r * 0.3} L${x + r} ${y} L${x + r * 0.3} ${y + r * 0.3} L${x} ${y + r} L${x - r * 0.3} ${y + r * 0.3} L${x - r} ${y} L${x - r * 0.3} ${y - r * 0.3} Z`} fill={renk} />
);

function Zemin({ gece, renk }: { gece?: boolean; renk?: [string, string] }) {
  const [u, a] = renk ?? (gece ? ['#0B1030', '#2A1F5C'] : ['#7CC6F2', '#CDEBFA']);
  return (
    <G>
      <Defs>
        <LinearGradient id="anGok" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={u} />
          <Stop offset="1" stopColor={a} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={W} height={H} fill="url(#anGok)" />
      <Rect x="0" y="82" width={W} height="38" fill={gece ? '#1E5B2E' : '#2FA14A'} />
      <Rect x="0" y="82" width={W} height="3" fill="#FFFFFF" opacity={0.6} />
    </G>
  );
}

export default function AnCizimi({ sahne, genislik }: { sahne: SahneTuru; genislik: number }) {
  return (
    <Svg width={genislik} height={(genislik * H) / W} viewBox={`0 0 ${W} ${H}`}>
      {icerik(sahne)}
    </Svg>
  );
}

function icerik(s: SahneTuru): React.ReactNode {
  switch (s) {
    case 'top':
      return (
        <G>
          <Zemin />
          <Rect x="170" y="40" width="130" height="45" fill="#7C5A3A" />
          {[180, 200, 220, 240, 260, 280].map((x, i) => (
            <G key={i}>
              <Line x1={x} y1="60" x2={x} y2="82" stroke="#166534" strokeWidth="2" />
              <Circle cx={x - 3} cy={65 + (i % 2) * 6} r="5" fill="#DC2626" />
            </G>
          ))}
          {Array.from({ length: 16 }).map((_, i) => (
            <Line key={i} x1={160} y1={20 + i * 4} x2={170} y2={20 + i * 4} stroke="#CBD5E1" strokeWidth="0.8" />
          ))}
          <Line x1="165" y1="20" x2="165" y2="85" stroke="#94A3B8" strokeWidth="2" />
          <Path d="M90 70 Q160 -10 225 55" stroke="#FFFFFF" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
          <Top x={225} y={56} r={7} />
          <Oyuncu x={80} y={88} kol={10} />
          <Path d="M250 18 h40 v20 h-40 z" fill="#E2E8F0" />
          <Circle cx="270" cy="28" r="6" fill="#F1C9A5" />
          <Path d="M262 23 Q270 15 278 23" stroke="#94A3B8" strokeWidth="3" fill="none" />
        </G>
      );
    case 'isik':
      return (
        <G>
          <Zemin gece />
          <Rect x="40" y="10" width="4" height="74" fill="#475569" />
          <Rect x="28" y="6" width="28" height="10" rx="2" fill="#334155" />
          <Path d="M36 16 l-4 6 M48 16 l4 6" stroke="#FCD34D" strokeWidth="1.5" />
          <Rect x="256" y="10" width="4" height="74" fill="#475569" />
          <Rect x="244" y="6" width="28" height="10" rx="2" fill="#334155" />
          <Rect x="0" y="0" width={W} height={H} fill="#000000" opacity={0.4} />
          {[110, 140, 170, 200].map((x, i) => (
            <G key={i}>
              <Circle cx={x} cy={70} r="2.5" fill="#FFFFFF" />
              <Circle cx={x + 5} cy={70} r="2.5" fill="#FFFFFF" />
            </G>
          ))}
          <Path d="M150 40 l6 -10 l-2 8 l8 -2 l-10 14 l2 -9 z" fill="#FCD34D" />
          <SvgText x="150" y="104" fontSize="12" fontWeight="bold" fill="#FCD34D" textAnchor="middle">
            ?!
          </SvgText>
        </G>
      );
    case 'kavga':
      return (
        <G>
          <Zemin />
          <Oyuncu x={125} y={88} renk="#EF4444" kol={14} />
          <Oyuncu x={175} y={88} renk="#3B82F6" kol={14} />
          <Path d="M150 40 l4 -12 l4 12 l12 -4 l-8 10 l12 6 l-14 0 l2 12 l-10 -8 l-10 8 l2 -12 l-14 0 l12 -6 l-8 -10 z" fill="#FCD34D" opacity={0.9} />
          <Yildizcik x={110} y={40} />
          <Yildizcik x={195} y={36} r={4} />
          <Top x={150} y={96} />
        </G>
      );
    case 'yagmur':
      return (
        <G>
          <Zemin renk={['#475569', '#94A3B8']} />
          {[40, 110, 190, 250].map((x, i) => (
            <G key={i}>
              <Ellipse cx={x} cy={18} rx="34" ry="12" fill="#64748B" />
              <Ellipse cx={x + 20} cy={12} rx="22" ry="10" fill="#71809A" />
            </G>
          ))}
          {Array.from({ length: 40 }).map((_, i) => (
            <Line key={i} x1={(i * 37) % W} y1={(i * 23) % 80 + 26} x2={(i * 37) % W - 4} y2={(i * 23) % 80 + 36} stroke="#BFDBFE" strokeWidth="1.3" />
          ))}
          <Ellipse cx="150" cy="98" rx="60" ry="6" fill="#93C5FD" opacity={0.6} />
          <Oyuncu x={150} y={86} renk="#F59E0B" kol={18} />
        </G>
      );
    case 'sakatlik':
      return (
        <G>
          <Zemin />
          <G transform="translate(150 92)">
            <Rect x="-24" y="-8" width="20" height="10" rx="3" fill="#F59E0B" />
            <Circle cx="-30" cy="-3" r="6" fill="#E0AC69" />
            <Line x1="-4" y1="-3" x2="18" y2="-6" stroke="#1F2937" strokeWidth="3" />
            <Line x1="-4" y1="0" x2="16" y2="4" stroke="#1F2937" strokeWidth="3" />
            <Rect x="12" y="-12" width="12" height="9" rx="2" fill="#BFDBFE" />
          </G>
          <Oyuncu x={190} y={88} renk="#3B82F6" kol={-4} />
          <Rect x="85" y="60" width="26" height="20" rx="3" fill="#FFFFFF" stroke="#DC2626" strokeWidth="2" />
          <Path d="M98 64 v12 M92 70 h12" stroke="#DC2626" strokeWidth="3" />
        </G>
      );
    case 'hirsiz':
      return (
        <G>
          <Zemin gece />
          {[60, 90, 120, 150].map((x, i) => (
            <Rect key={i} x={x} y="30" width="26" height="52" rx="2" fill="#475569" stroke="#1E293B" />
          ))}
          <Rect x="120" y="30" width="26" height="52" fill="#1E293B" />
          <G transform="translate(200 86)">
            <Rect x="-9" y="-20" width="18" height="21" rx="4" fill="#111827" />
            <Circle cx="0" cy="-27" r="7" fill="#111827" />
            <Rect x="-7" y="-29" width="14" height="4" fill="#E5E7EB" />
            <Line x1="-5" y1="0" x2="-8" y2="14" stroke="#111827" strokeWidth="3" />
            <Line x1="5" y1="0" x2="8" y2="14" stroke="#111827" strokeWidth="3" />
            <Rect x="10" y="-12" width="12" height="9" rx="2" fill="#78350F" />
          </G>
          <Path d="M260 20 L230 70 L290 70 Z" fill="#FEF3C7" opacity={0.25} />
          <Circle cx="260" cy="20" r="5" fill="#FEF3C7" />
        </G>
      );
    case 'komsu':
      return (
        <G>
          <Zemin gece />
          <Rect x="190" y="0" width="100" height="84" fill="#334155" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => <Rect key={`${r}${c}`} x={200 + c * 30} y={8 + r * 25} width="18" height="15" fill={r === 1 && c === 0 ? '#FCD34D' : '#1E293B'} />),
          )}
          <Circle cx="209" cy="44" r="5" fill="#F1C9A5" />
          <Path d="M180 40 q-10 -6 -22 -2 M178 48 q-12 0 -24 6" stroke="#F8FAFC" strokeWidth="2" fill="none" />
          <SvgText x="140" y="38" fontSize="16" fontWeight="bold" fill="#FCA5A5">
            Şşşt!
          </SvgText>
          <Oyuncu x={80} y={88} kol={16} />
          <Oyuncu x={110} y={88} renk="#3B82F6" kol={16} />
        </G>
      );
    case 'hakem':
      return (
        <G>
          <Zemin />
          <Oyuncu x={150} y={88} renk="#111827" kol={20} />
          <Rect x="164" y="40" width="10" height="14" rx="1.5" fill="#FBBF24" transform="rotate(10 169 47)" />
          <Oyuncu x={100} y={88} renk="#EF4444" kol={8} />
          <Oyuncu x={200} y={88} renk="#3B82F6" kol={8} />
          <Rect x="230" y="12" width="60" height="38" rx="4" fill="#0B1220" stroke="#64748B" />
          <SvgText x="260" y="36" fontSize="13" fontWeight="bold" fill="#FCD34D" textAnchor="middle">
            VAR
          </SvgText>
        </G>
      );
    case 'yildiz':
      return (
        <G>
          <Zemin renk={['#1E1B4B', '#7C3AED']} />
          {Array.from({ length: 12 }).map((_, i) => (
            <Yildizcik key={i} x={(i * 53) % W} y={(i * 29) % 70 + 8} r={3 + (i % 3)} />
          ))}
          <Oyuncu x={150} y={86} renk="#FCD34D" kol={22} olcek={1.25} />
          <Path d="M110 30 Q150 0 190 30" stroke="#FCD34D" strokeWidth="2" fill="none" strokeDasharray="3 4" />
          <Top x={196} y={34} />
        </G>
      );
    case 'pasta':
      return (
        <G>
          <Zemin />
          <Rect x="120" y="62" width="60" height="22" rx="4" fill="#F9A8D4" />
          <Rect x="128" y="48" width="44" height="16" rx="4" fill="#FBCFE8" />
          {[138, 150, 162].map((x, i) => (
            <G key={i}>
              <Rect x={x - 1.5} y="38" width="3" height="10" fill="#60A5FA" />
              <Path d={`M${x} 32 q3 4 0 6 q-3 -2 0 -6`} fill="#F59E0B" />
            </G>
          ))}
          <Oyuncu x={80} y={88} kol={20} />
          <Oyuncu x={220} y={88} renk="#3B82F6" kol={20} />
          {[40, 100, 200, 260].map((x, i) => (
            <Rect key={i} x={x} y={14 + (i % 2) * 10} width="5" height="5" fill={['#EF4444', '#22C55E', '#3B82F6', '#FCD34D'][i]} transform={`rotate(${i * 30} ${x} 20)`} />
          ))}
        </G>
      );
    case 'izci':
      return (
        <G>
          <Zemin />
          <Rect x="200" y="40" width="90" height="44" fill="#64748B" />
          <G transform="translate(245 62)">
            <Circle cx="0" cy="-10" r="8" fill="#E0AC69" />
            <Rect x="-10" y="0" width="20" height="18" rx="3" fill="#1F2937" />
            <Rect x="-12" y="-14" width="10" height="7" rx="2" fill="#111827" />
            <Rect x="2" y="-14" width="10" height="7" rx="2" fill="#111827" />
          </G>
          <Oyuncu x={110} y={88} kol={4} />
          <Top x={128} y={98} />
        </G>
      );
    case 'kedi':
      return (
        <G>
          <Zemin />
          <G transform="translate(150 92)">
            <Ellipse cx="0" cy="-6" rx="16" ry="9" fill="#F59E0B" />
            <Circle cx="-16" cy="-14" r="8" fill="#F59E0B" />
            <Path d="M-22 -20 l2 -8 l4 6 M-14 -21 l3 -7 l2 7" fill="#F59E0B" stroke="#F59E0B" strokeWidth="2" />
            <Circle cx="-18" cy="-15" r="1.3" fill="#111827" />
            <Circle cx="-13" cy="-15" r="1.3" fill="#111827" />
            <Path d="M16 -8 q12 -4 8 -18" stroke="#F59E0B" strokeWidth="4" fill="none" strokeLinecap="round" />
          </G>
          <Top x={186} y={96} />
          <Oyuncu x={70} y={88} kol={18} />
          <Oyuncu x={240} y={88} renk="#3B82F6" kol={18} />
        </G>
      );
    case 'muhtar':
      return (
        <G>
          <Zemin />
          <G transform="translate(150 86)">
            <Rect x="-12" y="-22" width="24" height="24" rx="4" fill="#334155" />
            <Circle cx="0" cy="-30" r="8" fill="#E3A878" />
            <Path d="M-8 -36 h16 v-3 h-16 z" fill="#1F2937" />
            <Path d="M-6 -26 q6 3 12 0" stroke="#E5E7EB" strokeWidth="2.5" fill="none" />
            <Line x1="-5" y1="2" x2="-6" y2="14" stroke="#1F2937" strokeWidth="3" />
            <Line x1="5" y1="2" x2="6" y2="14" stroke="#1F2937" strokeWidth="3" />
            <Line x1="14" y1="-10" x2="18" y2="14" stroke="#78350F" strokeWidth="2.5" />
          </G>
          <Rect x="200" y="58" width="22" height="16" rx="3" fill="#FEF3C7" />
          <Path d="M222 62 q6 2 0 8" stroke="#FEF3C7" strokeWidth="2" fill="none" />
          <Oyuncu x={70} y={88} kol={6} />
        </G>
      );
    case 'casus':
      return (
        <G>
          <Zemin gece />
          <G transform="translate(150 86)">
            <Path d="M-14 0 L-10 -26 L10 -26 L14 0 Z" fill="#1F2937" />
            <Circle cx="0" cy="-32" r="7" fill="#C68642" />
            <Path d="M-12 -36 h24 l-4 -6 h-16 z" fill="#111827" />
            <Rect x="-7" y="-34" width="14" height="3" fill="#111827" />
            <Line x1="-5" y1="0" x2="-6" y2="14" stroke="#111827" strokeWidth="3" />
            <Line x1="5" y1="0" x2="6" y2="14" stroke="#111827" strokeWidth="3" />
          </G>
          <SvgText x="200" y="50" fontSize="20" fill="#FCA5A5">
            ?
          </SvgText>
          <Oyuncu x={90} y={88} kol={4} />
        </G>
      );
    case 'su':
      return (
        <G>
          <Zemin />
          <Rect x="110" y="20" width="80" height="64" fill="#E2E8F0" />
          <Path d="M150 28 v10 h12" stroke="#64748B" strokeWidth="3" fill="none" />
          <Circle cx="162" cy="42" r="6" fill="#94A3B8" />
          {[0, 1, 2].map((i) => (
            <Circle key={i} cx={158 + i * 4} cy={52 + i * 2} r="1.5" fill="#60A5FA" opacity={0.6} />
          ))}
          <Oyuncu x={150} y={88} kol={18} />
          <SvgText x="210" y="40" fontSize="14" fontWeight="bold" fill="#EF4444">
            !
          </SvgText>
        </G>
      );
    case 'kamera':
      return (
        <G>
          <Zemin />
          <G transform="translate(90 70)">
            <Rect x="-18" y="-14" width="30" height="20" rx="3" fill="#111827" />
            <Circle cx="-10" cy="-20" r="7" fill="#111827" />
            <Circle cx="4" cy="-20" r="7" fill="#111827" />
            <Path d="M12 -8 l12 -6 v16 l-12 -6 z" fill="#374151" />
            <Line x1="-6" y1="6" x2="-14" y2="20" stroke="#4B5563" strokeWidth="2" />
            <Line x1="-6" y1="6" x2="2" y2="20" stroke="#4B5563" strokeWidth="2" />
          </G>
          <Rect x="125" y="20" width="22" height="16" fill="#111827" transform="rotate(-10 136 28)" />
          <Path d="M125 22 l22 -4" stroke="#F8FAFC" strokeWidth="2" strokeDasharray="3 3" />
          <Oyuncu x={200} y={88} renk="#DC2626" kol={20} />
          <Yildizcik x={222} y={40} />
          <Yildizcik x={180} y={34} r={4} />
        </G>
      );
    case 'para':
      return (
        <G>
          <Zemin renk={['#1F2937', '#78350F']} />
          <G transform="translate(150 70)">
            <Path d="M-24 18 Q-30 -10 -10 -16 L10 -16 Q30 -10 24 18 Z" fill="#B45309" />
            <Path d="M-10 -16 L-14 -24 L14 -24 L10 -16 Z" fill="#92400E" />
            <SvgText x="0" y="10" fontSize="20" fontWeight="bold" fill="#FCD34D" textAnchor="middle">
              ₺
            </SvgText>
          </G>
          {Array.from({ length: 9 }).map((_, i) => (
            <Circle key={i} cx={60 + i * 22} cy={30 + (i % 3) * 12} r="6" fill="#FBBF24" stroke="#92400E" strokeWidth="1" />
          ))}
        </G>
      );
    case 'kar':
      return (
        <G>
          <Zemin renk={['#94A3B8', '#E2E8F0']} />
          <Rect x="0" y="82" width={W} height="38" fill="#F8FAFC" />
          {Array.from({ length: 40 }).map((_, i) => (
            <Circle key={i} cx={(i * 41) % W} cy={(i * 17) % 80 + 4} r={1.5 + (i % 3) * 0.6} fill="#FFFFFF" />
          ))}
          <Oyuncu x={130} y={88} renk="#DC2626" kol={10} />
          <Rect x="122" y="56" width="16" height="4" fill="#3B82F6" />
          <Path d="M170 98 l30 -24" stroke="#78350F" strokeWidth="3" />
          <Rect x="196" y="70" width="14" height="10" fill="#64748B" transform="rotate(-38 203 75)" />
        </G>
      );
    case 'sicak':
      return (
        <G>
          <Zemin renk={['#F97316', '#FDE68A']} />
          <Circle cx="250" cy="28" r="20" fill="#FFF7D6" />
          {Array.from({ length: 10 }).map((_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return <Line key={i} x1={250 + Math.cos(a) * 26} y1={28 + Math.sin(a) * 26} x2={250 + Math.cos(a) * 34} y2={28 + Math.sin(a) * 34} stroke="#FFF7D6" strokeWidth="2.5" />;
          })}
          {[80, 140, 200].map((x, i) => (
            <Path key={i} d={`M${x} 78 q4 -6 0 -12 q-4 -6 0 -12`} stroke="#FEF3C7" strokeWidth="2" fill="none" opacity={0.7} />
          ))}
          <Oyuncu x={120} y={88} kol={-4} />
          <Path d="M110 50 q3 6 0 8" stroke="#60A5FA" strokeWidth="2" fill="none" />
        </G>
      );
    case 'kalabalik':
      return (
        <G>
          <Zemin />
          {Array.from({ length: 3 }).map((_, r) =>
            Array.from({ length: 14 }).map((_, c) => <Circle key={`${r}${c}`} cx={20 + c * 20 + (r % 2) * 10} cy={30 + r * 14} r="6" fill={['#F59E0B', '#EF4444', '#3B82F6', '#F1C27D', '#FFFFFF'][(r + c) % 5]} />),
          )}
          <Oyuncu x={110} y={92} kol={20} />
          <Oyuncu x={190} y={92} renk="#3B82F6" kol={20} />
        </G>
      );
    case 'dugun':
      return (
        <G>
          <Zemin renk={['#7C2D12', '#FBBF24']} />
          {Array.from({ length: 10 }).map((_, i) => (
            <Path key={i} d={`M${i * 32} 8 l16 12 l16 -12`} fill="none" stroke={['#EF4444', '#22C55E', '#3B82F6', '#FCD34D'][i % 4]} strokeWidth="2" />
          ))}
          <G transform="translate(90 70)">
            <Ellipse cx="0" cy="0" rx="16" ry="12" fill="#B91C1C" />
            <Ellipse cx="0" cy="0" rx="12" ry="9" fill="#FEF3C7" />
            <Line x1="-20" y1="-16" x2="-6" y2="-6" stroke="#78350F" strokeWidth="2.5" />
          </G>
          <Oyuncu x={170} y={88} renk="#111827" kol={18} />
          <Oyuncu x={210} y={88} renk="#F8FAFC" kol={18} />
          <Path d="M204 50 q6 -10 12 0" stroke="#F8FAFC" strokeWidth="3" fill="none" />
        </G>
      );
    case 'cocuk':
      return (
        <G>
          <Zemin />
          {Array.from({ length: 16 }).map((_, i) => (
            <Line key={i} x1={i * 20} y1="40" x2={i * 20} y2="84" stroke="#CBD5E1" strokeWidth="1" opacity={0.7} />
          ))}
          <Line x1="0" y1="40" x2={W} y2="40" stroke="#CBD5E1" strokeWidth="1.5" />
          <Oyuncu x={150} y={92} renk="#60A5FA" kol={12} olcek={0.75} />
          <Top x={164} y={74} r={5} />
          <Path d="M164 66 q-4 -10 0 -16" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          <Oyuncu x={80} y={88} kol={4} />
          <Yildizcik x={180} y={46} r={4} />
        </G>
      );
    case 'zabita':
      return (
        <G>
          <Zemin />
          <G transform="translate(150 86)">
            <Rect x="-11" y="-22" width="22" height="24" rx="4" fill="#1E3A8A" />
            <Circle cx="0" cy="-30" r="7.5" fill="#E0AC69" />
            <Path d="M-9 -34 h18 v-5 h-18 z" fill="#1E3A8A" />
            <Rect x="-8" y="-40" width="16" height="3" fill="#FCD34D" />
            <Rect x="10" y="-18" width="12" height="16" fill="#F8FAFC" stroke="#94A3B8" />
            <Line x1="13" y1="-13" x2="19" y2="-13" stroke="#94A3B8" />
            <Line x1="13" y1="-9" x2="19" y2="-9" stroke="#94A3B8" />
            <Line x1="-5" y1="2" x2="-6" y2="14" stroke="#1F2937" strokeWidth="3" />
            <Line x1="5" y1="2" x2="6" y2="14" stroke="#1F2937" strokeWidth="3" />
          </G>
          <Rect x="40" y="40" width="20" height="44" fill="#DC2626" />
          <Rect x="44" y="34" width="12" height="8" fill="#111827" />
        </G>
      );
    case 'gazeteci':
      return (
        <G>
          <Zemin />
          <G transform="translate(130 86)">
            <Rect x="-11" y="-22" width="22" height="24" rx="4" fill="#4B5563" />
            <Circle cx="0" cy="-30" r="7.5" fill="#E3A878" />
            <Rect x="-8" y="-35" width="16" height="4" fill="#111827" />
            <Line x1="12" y1="-16" x2="22" y2="-26" stroke="#111827" strokeWidth="3" />
            <Circle cx="24" cy="-28" r="4" fill="#111827" />
            <Line x1="-5" y1="2" x2="-6" y2="14" stroke="#1F2937" strokeWidth="3" />
            <Line x1="5" y1="2" x2="6" y2="14" stroke="#1F2937" strokeWidth="3" />
          </G>
          <Rect x="190" y="26" width="80" height="54" fill="#F8FAFC" stroke="#94A3B8" />
          <Rect x="196" y="32" width="68" height="10" fill="#111827" />
          {[48, 56, 64, 72].map((y) => (
            <Line key={y} x1="196" y1={y} x2="264" y2={y} stroke="#CBD5E1" strokeWidth="2" />
          ))}
        </G>
      );
    case 'deniz':
      return (
        <G>
          <Zemin renk={['#7DD3FC', '#E0F2FE']} />
          <Rect x="0" y="50" width={W} height="32" fill="#1D4ED8" />
          {[20, 70, 140, 210, 270].map((x, i) => (
            <Path key={i} d={`M${x} 60 q6 -4 12 0 t12 0`} stroke="#93C5FD" strokeWidth="1.5" fill="none" />
          ))}
          <G transform="translate(190 52)">
            <Path d="M-40 0 h80 l-10 12 h-60 z" fill="#F8FAFC" />
            <Rect x="-24" y="-12" width="44" height="12" fill="#F8FAFC" />
            <Rect x="-4" y="-22" width="8" height="10" fill="#DC2626" />
            {[-18, -6, 6].map((x) => (
              <Rect key={x} x={x} y="-9" width="6" height="5" fill="#1E3A8A" />
            ))}
          </G>
          <Oyuncu x={80} y={92} kol={20} />
        </G>
      );
    case 'altin':
      return (
        <G>
          <Zemin renk={['#78350F', '#FBBF24']} />
          {Array.from({ length: 18 }).map((_, i) => (
            <Yildizcik key={i} x={(i * 47) % W} y={(i * 31) % 76 + 6} r={3 + (i % 4)} renk="#FFF7D6" />
          ))}
          <Oyuncu x={150} y={88} renk="#FCD34D" kol={24} olcek={1.3} />
          <Circle cx="150" cy="40" r="36" fill="#FFF7D6" opacity={0.18} />
        </G>
      );
    case 'yemek':
      return (
        <G>
          <Zemin />
          <Rect x="90" y="50" width="120" height="34" rx="3" fill="#A16207" />
          <Path d="M84 52 L150 30 L216 52 Z" fill="#DC2626" />
          <Path d="M84 52 h132" stroke="#FFFFFF" strokeWidth="3" strokeDasharray="8 8" />
          {[110, 130, 150, 170, 190].map((x, i) => (
            <Ellipse key={i} cx={x} cy="60" rx="8" ry="4" fill={['#FDE68A', '#F59E0B', '#D97706', '#FDE68A', '#F59E0B'][i]} />
          ))}
          {[0, 1, 2].map((i) => (
            <Path key={i} d={`M${130 + i * 20} 26 q4 -6 0 -12`} stroke="#FFFFFF" strokeWidth="2" fill="none" opacity={0.6} />
          ))}
          <Oyuncu x={50} y={92} kol={14} />
          <Oyuncu x={250} y={92} renk="#3B82F6" kol={14} />
        </G>
      );
    case 'sis':
      return (
        <G>
          <Zemin renk={['#94A3B8', '#CBD5E1']} />
          <Oyuncu x={120} y={88} kol={4} />
          <Oyuncu x={190} y={88} renk="#3B82F6" kol={4} />
          {[20, 50, 80].map((y, i) => (
            <Rect key={i} x="0" y={y} width={W} height="22" fill="#E2E8F0" opacity={0.55} />
          ))}
          <Top x={160} y={96} />
        </G>
      );
    case 'muzik':
      return (
        <G>
          <Zemin gece />
          {[60, 110, 180, 240].map((x, i) => (
            <G key={i}>
              <Path d={`M${x} ${40 - (i % 2) * 10} v-16 l10 -3 v16`} stroke="#FCD34D" strokeWidth="2" fill="none" />
              <Circle cx={x - 2} cy={40 - (i % 2) * 10} r="3" fill="#FCD34D" />
              <Circle cx={x + 8} cy={37 - (i % 2) * 10} r="3" fill="#FCD34D" />
            </G>
          ))}
          {[100, 130, 160, 190].map((x, i) => (
            <Oyuncu key={i} x={x} y={90} renk={['#F59E0B', '#3B82F6', '#EF4444', '#22C55E'][i]} kol={22} />
          ))}
        </G>
      );
    default:
      return <Zemin />;
  }
}
