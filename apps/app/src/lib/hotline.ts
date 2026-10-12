import { Linking, Platform } from 'react-native';

/** One tap, no confirmation: dials the National Child Protection Hotline 111. */
export function callHotline111(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = 'tel:111';
    return;
  }
  Linking.openURL('tel:111').catch((err) => console.warn('[hotline] Could not open dialer for 111:', err));
}
