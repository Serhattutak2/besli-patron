// ============================================
// SAHA BİZİM — components/SvgYazi.tsx
// react-native-svg Text'in çevrilen hâli (sahnelerdeki yazılar için)
// ============================================
import React from 'react';
import { Text as SvgTextHam } from 'react-native-svg';
import { cevirCocuk, useDil } from '../i18n';

export default function SvgText(p: React.ComponentProps<typeof SvgTextHam>) {
  useDil();
  return <SvgTextHam {...p}>{cevirCocuk(p.children as React.ReactNode)}</SvgTextHam>;
}
