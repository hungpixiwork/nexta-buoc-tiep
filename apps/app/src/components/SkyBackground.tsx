import React from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  RadialGradient,
  Stop,
  Rect,
  Path,
  Circle,
} from 'react-native-svg';

interface SkyBackgroundProps {
  variant?: 'home' | 'quote' | 'passport' | 'task' | 'mil';
  height?: DimensionValue;
  borderRadius?: number;
  children?: React.ReactNode;
}

export const SkyBackground: React.FC<SkyBackgroundProps> = ({
  variant = 'home',
  height,
  borderRadius = 24,
  children,
}) => {
  return (
    <View style={[styles.container, { borderRadius }, height !== undefined ? { height } : undefined]}>
      <Svg style={StyleSheet.absoluteFillObject} width="100%" height="100%" viewBox="0 0 360 240" preserveAspectRatio="none">
        <Defs>
          {/* Radial Sun Glow */}
          <RadialGradient id="sunGlow" cx="85%" cy="30%" r="60%" fx="85%" fy="30%">
            <Stop offset="0%" stopColor="#FFF7D6" stopOpacity={0.95} />
            <Stop offset="100%" stopColor="#FFF7D6" stopOpacity={0} />
          </RadialGradient>

          {/* Main Sky Gradient */}
          <SvgGradient id="skyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#BFE0FB" />
            <Stop offset="42%" stopColor="#E8F4FC" />
            <Stop offset="72%" stopColor="#EEF7E6" />
            <Stop offset="100%" stopColor="#D7EDC6" />
          </SvgGradient>

          {/* Hill Green Gradient 1 */}
          <SvgGradient id="hillGrad1" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#A9D38F" stopOpacity={0.4} />
            <Stop offset="100%" stopColor="#A9D38F" stopOpacity={1} />
          </SvgGradient>

          {/* Hill Green Gradient 2 */}
          <SvgGradient id="hillGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#CFE6B8" />
            <Stop offset="100%" stopColor="#8FC37A" />
          </SvgGradient>

          {/* Cloud White Gradient */}
          <SvgGradient id="cloudGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.9} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.3} />
          </SvgGradient>
        </Defs>

        {/* 1. Base Sky Gradient */}
        <Rect x="0" y="0" width="360" height="240" fill="url(#skyGrad)" />

        {/* 2. Sun Glow Circle */}
        <Rect x="0" y="0" width="360" height="240" fill="url(#sunGlow)" />

        {/* 3. Decorative Cloud Shapes (Giả lập mây lơ lửng) */}
        <Path
          d="M 20,40 Q 35,25 50,40 Q 65,25 80,40 Q 95,30 110,45 Q 120,60 100,65 L 10,65 Z"
          fill="url(#cloudGrad)"
          opacity={0.7}
        />
        <Path
          d="M 220,30 Q 240,15 260,30 Q 280,15 300,30 Q 315,20 330,35 Q 340,50 320,55 L 210,55 Z"
          fill="url(#cloudGrad)"
          opacity={0.8}
        />

        {/* 4. Sun Ray Beam (Tia nắng chiếu nghiêng) */}
        <Path
          d="M 280,0 L 360,0 L 220,240 L 160,240 Z"
          fill="#FFFFFF"
          opacity={0.25}
        />

        {/* 5. Hill 1 Background */}
        <Path
          d="M 0,130 Q 180,90 360,130 L 360,240 L 0,240 Z"
          fill="url(#hillGrad1)"
        />

        {/* 6. Hill 2 Foreground Right */}
        <Path
          d="M 140,150 Q 260,100 360,140 L 360,240 L 140,240 Z"
          fill="url(#hillGrad2)"
          opacity={0.85}
        />
      </Svg>

      {/* Content Container overlay */}
      <View style={styles.content}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    position: 'relative',
    zIndex: 2,
  },
});
