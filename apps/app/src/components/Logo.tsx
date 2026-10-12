import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

export const Logo: React.FC = () => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Svg width={48} height={36} viewBox="0 0 60 46">
        <Circle cx={19} cy={16} r={9.5} fill="#f9b233" />
        <G stroke="#f9b233" strokeWidth={2.6} strokeLinecap="round">
          <Line x1={19} y1={1.5} x2={19} y2={5} />
          <Line x1={6.5} y1={6.5} x2={9} y2={9} />
          <Line x1={3} y1={16} x2={6.5} y2={16} />
          <Line x1={31.5} y1={6.5} x2={29} y2={9} />
        </G>
        <Path
          d="M22 30c0-6.6 5.4-11 11.5-11 5 0 9.2 3.2 10.2 7.6 3.7.2 6.3 2.6 6.3 5.4H22z"
          fill="#d5e9fb"
          stroke="#2f80ed"
          strokeWidth={2.2}
          strokeLinejoin="round"
        />
        <Path
          d="M7 39 C14 34.5 21 34.5 21 39 C28 34.5 35 34.5 35 39 C42 34.5 49 34.5 49 39"
          stroke="#2f80ed"
          strokeWidth={2.6}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t('components.logo.title', 'BƯỚC TIẾP')}</Text>
        <Text style={styles.subtitle}>{t('components.logo.subtitle', 'Bầu trời ngày mai')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  textContainer: {
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2f6dbf',
    letterSpacing: 1.2,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 10.5,
    color: '#93a9bf',
    fontWeight: '500',
    marginTop: 2,
    letterSpacing: 0.2,
    lineHeight: 12,
  },
});
