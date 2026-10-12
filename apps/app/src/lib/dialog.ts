import { Alert, AlertButton, Platform } from 'react-native';

/**
 * Drop-in replacement for Alert.alert that also works on web.
 * react-native-web ships Alert.alert as an empty function, so on web every
 * confirmation (and the action behind it) was silently skipped.
 */
export function showAlert(title: string, message?: string, buttons?: AlertButton[]): void {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const text = message ? `${title}\n\n${message}` : title;
  const actions = (buttons ?? []).filter((button) => button.style !== 'cancel');

  if (actions.length === 0) {
    window.alert(text);
    return;
  }

  // Web has no multi-button dialog: confirm runs the primary (last non-cancel) action.
  const primary = actions[actions.length - 1];
  const hasCancel = (buttons ?? []).some((button) => button.style === 'cancel');
  if (!hasCancel && actions.length === 1) {
    window.alert(text);
    primary.onPress?.();
    return;
  }
  if (window.confirm(text)) {
    primary.onPress?.();
  }
}
