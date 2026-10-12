import { Options } from 'qr-code-styling';
import { NextaQRVariant, NextaQRRenderMode } from './nexta-qr.types';
import { assertPrivacySanitized } from './qr-value-builder';

// NEXTA SVG Brand Mark Data URL (Clean Navy Shield / BT Monogram)
export const NEXTA_BRAND_MARK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="%2316375D"/><text x="32" y="42" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="28" fill="%23FFFFFF" text-anchor="middle">BT</text></svg>`;

// Safeguarding 111 Safety Mark Data URL (Safety Red Badge)
export const NEXTA_SAFEGUARDING_MARK_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="14" fill="%23DC2626"/><text x="32" y="42" font-family="system-ui, -apple-system, sans-serif" font-weight="900" font-size="24" fill="%23FFFFFF" text-anchor="middle">111</text></svg>`;

/**
 * Returns tailored qr-code-styling configuration for each medium and security tier.
 * Enforces privacy check and variant SSOT.
 */
export function getNextaQrConfig(
  value: string,
  variant: NextaQRVariant = 'default',
  renderMode: NextaQRRenderMode = 'svg',
  size: number = 180,
  showLogo: boolean = true
): Options {
  // Assert privacy before configuring QR options
  assertPrivacySanitized(value);

  const isThermal = variant === 'thermal';
  const isSafeguarding = variant === 'safeguarding';

  // Thermal medium strictly uses canvas renderer, while screen/print uses SVG vector renderer
  const actualRenderType = isThermal ? 'canvas' : renderMode;

  // Base options
  const baseOptions: Options = {
    width: size,
    height: size,
    type: actualRenderType,
    data: value,
    margin: isThermal ? 4 : 6,
    qrOptions: {
      errorCorrectionLevel: showLogo && !isThermal ? 'H' : 'M'
    },
    backgroundOptions: {
      color: '#FFFFFF'
    }
  };

  // Logo setup (strictly <= 22% size for high scannability, disabled on thermal)
  if (showLogo && !isThermal) {
    baseOptions.image = isSafeguarding ? NEXTA_SAFEGUARDING_MARK_SVG : NEXTA_BRAND_MARK_SVG;
    baseOptions.imageOptions = {
      hideBackgroundDots: true,
      imageSize: 0.22,
      margin: 3,
      crossOrigin: 'anonymous'
    };
  }

  // Visual variant styling (SSOT)
  switch (variant) {
    case 'thermal':
      return {
        ...baseOptions,
        dotsOptions: {
          type: 'square',
          color: '#000000'
        },
        cornersSquareOptions: {
          type: 'square',
          color: '#000000'
        },
        cornersDotOptions: {
          type: 'square',
          color: '#000000'
        }
      };

    case 'safeguarding':
      return {
        ...baseOptions,
        dotsOptions: {
          type: 'extra-rounded',
          color: '#16375D'
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#DC2626'
        },
        cornersDotOptions: {
          type: 'dot',
          color: '#DC2626'
        }
      };

    case 'print':
      return {
        ...baseOptions,
        dotsOptions: {
          type: 'extra-rounded',
          color: '#0F172A'
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#1E293B'
        },
        cornersDotOptions: {
          type: 'dot',
          color: '#1E293B'
        }
      };

    case 'default':
    default:
      return {
        ...baseOptions,
        dotsOptions: {
          type: 'extra-rounded',
          color: '#0B4F9C'
        },
        cornersSquareOptions: {
          type: 'extra-rounded',
          color: '#123D73'
        },
        cornersDotOptions: {
          type: 'dot',
          color: '#123D73'
        }
      };
  }
}
