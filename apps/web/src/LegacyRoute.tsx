/**
 * Pre-RE:ACT portal (Livelihood Passport, Form 07, QR, volunteers…).
 * Kept reachable at /legacy so nothing is lost, but it is not part of the core loop.
 */
import './legacy.css';
import { I18nProvider } from './i18n';
import LegacyApp from './LegacyApp';

export default function LegacyRoute() {
  return (
    <I18nProvider>
      <LegacyApp />
    </I18nProvider>
  );
}
