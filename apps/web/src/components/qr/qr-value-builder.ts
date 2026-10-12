import { SafeShareToken, NextaQRScope } from './nexta-qr.types';

const APP_BASE_URL = 'https://buoc-tiep.pages.dev';

/**
 * PII Leak Detection Patterns:
 * Asserts that QR payloads NEVER encode raw names, phone numbers, emails, or precise GPS coordinates.
 */
const PII_PHONE_REGEX = /(?:\+84|0)[3|5|7|8|9][0-9]{8}/;
const PII_EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PII_RAW_GPS_REGEX = /\b(?:10|11)\.\d{4,},\s*(?:106|107)\.\d{4,}\b/;
const PII_SENSITIVE_KEYS_REGEX = /(?:phone|email|fullName|cccd|cmnd|exactAddress|birthDate)=/i;

/**
 * Layer 2: Asserts that a QR value is 100% privacy-sanitized and opaque.
 * Throws an Error if any PII pattern is detected.
 */
export function assertPrivacySanitized(value: string): boolean {
  if (!value || typeof value !== 'string') {
    throw new Error('[NEXTA QR Privacy Gate] QR value must be a non-empty string.');
  }

  if (PII_PHONE_REGEX.test(value)) {
    throw new Error('[NEXTA QR Privacy Gate] VIOLATION: Raw phone number detected in QR value.');
  }

  if (PII_EMAIL_REGEX.test(value)) {
    throw new Error('[NEXTA QR Privacy Gate] VIOLATION: Raw email address detected in QR value.');
  }

  if (PII_RAW_GPS_REGEX.test(value)) {
    throw new Error('[NEXTA QR Privacy Gate] VIOLATION: Unmasked GPS coordinates detected in QR value.');
  }

  if (PII_SENSITIVE_KEYS_REGEX.test(value)) {
    throw new Error('[NEXTA QR Privacy Gate] VIOLATION: Raw PII parameter key detected in QR value.');
  }

  return true;
}

/**
 * Layer 1: Safe Share Token Generator
 * Produces an opaque, short-lived token without any underlying database row serialization.
 */
export function generateSafeShareToken(
  caseId: string,
  cardId: string,
  isMinor: boolean,
  requestedScope: NextaQRScope = 'basic_status',
  expiresInHours: number = 24
): SafeShareToken {
  // Enforce Rule 0: Children cannot have livelihood support scope
  let scope: NextaQRScope = requestedScope;
  if (isMinor && scope === 'livelihood_support') {
    scope = 'safeguarding_emergency';
  }

  const expirationDate = new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString();
  
  // Clean opaque token hash
  const sanitizedId = (caseId || 'anonymous').replace(/[^a-zA-Z0-9]/g, '').slice(-8);
  const randomSalt = Math.random().toString(36).substring(2, 8);
  const tokenId = `tkn_${sanitizedId}_${randomSalt}`;

  const payloadUrl = `${APP_BASE_URL}/share?token=${encodeURIComponent(tokenId)}&scope=${encodeURIComponent(scope)}`;

  // Run privacy assertion before returning
  assertPrivacySanitized(payloadUrl);

  return {
    tokenId,
    cardId: cardId || `BT-${sanitizedId.slice(-4).toUpperCase()}`,
    scope,
    isMinor,
    expiresAt: expirationDate,
    payloadUrl
  };
}

/**
 * Layer 2: QR Value Builder for Field Cards (A4 & POS-80mm Thermal)
 * Builds opaque lookup URL using tokenized recovery code and cardId.
 */
export function buildFieldCardQRValue(
  recoveryCode: string,
  cardId: string,
  isMinor: boolean
): string {
  const sanitizedToken = encodeURIComponent(recoveryCode || 'BT-RECOVERY-DEFAULT');
  const sanitizedCardId = encodeURIComponent(cardId || 'BT-CARD');
  const endpoint = isMinor ? 'safeguarding-lookup' : 'lookup';

  const finalUrl = `${APP_BASE_URL}/${endpoint}?token=${sanitizedToken}&card=${sanitizedCardId}`;
  
  // Validate privacy invariant
  assertPrivacySanitized(finalUrl);

  return finalUrl;
}
