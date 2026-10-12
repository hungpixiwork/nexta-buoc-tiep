import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

interface ImageFadeMaskProps {
  /** Unique gradient id — SVG ids are global on web, so each usage needs its own. */
  id: string;
  color?: string;
  /** Fraction (0–1) of the width that stays fully opaque before fading out. */
  solidUntil?: number;
  /** Fraction (0–1) of the width where the mask becomes fully transparent. */
  fadeUntil?: number;
}

/**
 * Solid left-to-right fade laid over a background illustration so baked-in
 * mockup text never collides with live text at narrow widths. Plain gradient,
 * no blur (Humanitarian Light Theme forbids glassmorphism).
 */
export const ImageFadeMask: React.FC<ImageFadeMaskProps> = ({
  id,
  color = '#F4F9FF',
  solidUntil = 0.6,
  fadeUntil = 0.88,
}) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={color} stopOpacity={1} />
          <Stop offset={String(solidUntil)} stopColor={color} stopOpacity={0.96} />
          <Stop offset={String(fadeUntil)} stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </Svg>
  </View>
);
