import React from 'react';

export type NextaQRVariant = 'default' | 'print' | 'thermal' | 'safeguarding';

export type NextaQRRenderMode = 'svg' | 'canvas';

export type NextaQRScope = 'basic_status' | 'safeguarding_emergency' | 'livelihood_support' | 'full_casework';

/**
 * Layer 1: Sanitized Share Token Model
 * Represents an opaque, privacy-preserving token with strict expiration and scope.
 */
export interface SafeShareToken {
  tokenId: string;
  cardId: string;
  scope: NextaQRScope;
  isMinor: boolean;
  expiresAt: string;
  payloadUrl: string;
}

/**
 * Layer 3: Visual QR Component Props
 * Strictly receives sanitized `value` string. Rejects raw Case/Beneficiary objects to prevent PII leakage.
 * Styling is driven exclusively by `variant` SSOT — arbitrary colors/patterns are forbidden.
 */
export interface NextaQRCodeProps {
  /** 
   * The privacy-sanitized payload or URL to encode. 
   * MUST NOT contain raw PII (names, phone, email, raw GPS). 
   */
  value: string;

  /** Visual variant matching the target medium and security tier */
  variant?: NextaQRVariant;

  /** Renderer engine: SVG for vector screen/print, Canvas for thermal bitmap */
  renderMode?: NextaQRRenderMode;

  /** 
   * Target display size in pixels for screen UI.
   * Note: In A4 print and Thermal POS-80mm mediums, physical dimensions (mm) are enforced via CSS.
   */
  size?: number;

  /** Whether to embed the NEXTA brand mark (strictly disabled on thermal variant) */
  showLogo?: boolean;

  /** Accessible label for WCAG AAA screen readers */
  ariaLabel?: string;

  /** Identifier for automated test harnesses */
  testId?: string;

  /** Optional short display code (e.g. "BT-8842" or "CHILD-2026-1102") */
  shortCode?: string;

  /** Optional human-readable assistance caption shown near the code */
  caption?: string;

  /** Optional CSS class */
  className?: string;

  /** Optional style override for outer container */
  style?: React.CSSProperties;

  /** Lifecycle hook invoked on successful render */
  onRender?: () => void;

  /** Lifecycle hook invoked if rendering encounters an error */
  onError?: (error: Error) => void;

  /** Fallback message if QR generation fails */
  fallbackLabel?: string;
}
