import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Linking } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from 'react-i18next';

export const EmergencySupportCard: React.FC = () => {
  const { t } = useTranslation();

  const handleCallEmergency = () => {
    Alert.alert(
      t('components.emergencyCard.alertTitle'),
      t('components.emergencyCard.alertBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('components.emergencyCard.alertCallBtn'),
          style: 'destructive',
          onPress: () => {
            Linking.openURL('tel:111').catch(() => {
              Alert.alert(
                t('components.emergencyCard.fallbackTitle'),
                t('components.emergencyCard.fallbackBody')
              );
            });
          },
        },
      ]
    );
  };

  return (
    <View style={styles.cardContainer}>
      <View style={styles.titleRow}>
        <View style={styles.iconCircle}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2}>
            <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </Svg>
        </View>
        <Text style={styles.cardTitle}>{t('components.emergencyCard.title')}</Text>
      </View>

      <Text style={styles.cardSubText}>
        {t('components.emergencyCard.subtitle')}
      </Text>

      <TouchableOpacity
        style={styles.callBtn}
        onPress={handleCallEmergency}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel={t('components.emergencyCard.callA11y')}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.4}>
          <Path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </Svg>
        <Text style={styles.callBtnText}>{t('components.emergencyCard.callBtn')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
    marginBottom: 30,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#991B1B',
  },
  cardSubText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  callBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 14,
    height: 56,
    minHeight: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  callBtnText: {
    color: '#FFFFFF',
    fontSize: 15.5,
    fontWeight: '700',
  },
});
