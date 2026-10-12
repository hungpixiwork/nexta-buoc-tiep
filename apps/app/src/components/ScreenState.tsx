import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface ScreenStateProps {
  kind: 'loading' | 'error' | 'empty';
  /** Overrides the default message for the state. */
  message?: string;
  /** Shown as a "Thử lại" button on the error state. */
  onRetry?: () => void;
}

/** Loading / error / empty placeholder shared by screens that fetch from the API. */
export const ScreenState: React.FC<ScreenStateProps> = ({ kind, message, onRetry }) => {
  const { t } = useTranslation();

  if (kind === 'loading') {
    return (
      <View style={styles.box} accessibilityRole="progressbar">
        <ActivityIndicator size="small" color="#2F80ED" />
        <Text style={styles.text}>{message || t('common.loading')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.box} accessibilityRole={kind === 'error' ? 'alert' : undefined}>
      <Text style={[styles.text, kind === 'error' && styles.errorText]}>
        {message || (kind === 'error' ? t('common.loadError') : t('common.empty'))}
      </Text>
      {kind === 'error' && onRetry && (
        <TouchableOpacity style={styles.retryBtn} onPress={onRetry} activeOpacity={0.8} accessibilityRole="button">
          <Text style={styles.retryText}>{t('common.retry')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
    color: '#475569',
    textAlign: 'center',
  },
  errorText: {
    color: '#B91C1C',
    fontWeight: '600',
  },
  retryBtn: {
    minHeight: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    backgroundColor: '#2F80ED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
