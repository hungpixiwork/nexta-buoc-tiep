import React, { useEffect, useRef, useState } from 'react';
import QRCodeStyling from 'qr-code-styling';
import { NextaQRCodeProps } from './nexta-qr.types';
import { getNextaQrConfig } from './nexta-qr.config';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export const NextaQRCode: React.FC<NextaQRCodeProps> = ({
  value,
  variant = 'default',
  renderMode = 'svg',
  size = 180,
  showLogo = true,
  ariaLabel,
  testId = 'nexta-qr-code',
  shortCode,
  caption,
  className = '',
  style,
  onRender,
  onError,
  fallbackLabel = 'Không thể tạo mã QR an sinh'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const qrCodeInstanceRef = useRef<QRCodeStyling | null>(null);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    setHasError(false);
    setErrorMessage('');

    try {
      // Validate and generate config (throws error if PII detected)
      const config = getNextaQrConfig(value, variant, renderMode, size, showLogo);

      if (!qrCodeInstanceRef.current) {
        qrCodeInstanceRef.current = new QRCodeStyling(config);
      } else {
        qrCodeInstanceRef.current.update(config);
      }

      if (containerRef.current) {
        containerRef.current.innerHTML = '';
        qrCodeInstanceRef.current.append(containerRef.current);
        if (onRender && isMounted) {
          onRender();
        }
      }
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      console.error('[NextaQRCode] Error initializing QR:', errorObj.message);
      if (isMounted) {
        setHasError(true);
        setErrorMessage(errorObj.message);
        if (onError) {
          onError(errorObj);
        }
      }
    }

    return () => {
      isMounted = false;
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [value, variant, renderMode, size, showLogo, onRender, onError]);

  const handleRetry = () => {
    setHasError(false);
    try {
      const config = getNextaQrConfig(value, variant, renderMode, size, showLogo);
      if (qrCodeInstanceRef.current && containerRef.current) {
        containerRef.current.innerHTML = '';
        qrCodeInstanceRef.current.update(config);
        qrCodeInstanceRef.current.append(containerRef.current);
      }
    } catch (err: any) {
      const errorObj = err instanceof Error ? err : new Error(String(err));
      setHasError(true);
      setErrorMessage(errorObj.message);
      if (onError) {
        onError(errorObj);
      }
    }
  };

  if (hasError) {
    return (
      <div
        data-testid={`${testId}-error`}
        style={{
          width: size,
          height: size,
          backgroundColor: '#FEF2F2',
          border: '1px dashed #DC2626',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px',
          textAlign: 'center',
          boxSizing: 'border-box',
          ...style
        }}
      >
        <AlertTriangle size={20} color="#DC2626" />
        <span style={{ fontSize: '11px', color: '#DC2626', fontWeight: '700', marginTop: '4px' }}>
          {fallbackLabel}
        </span>
        {errorMessage && (
          <span style={{ fontSize: '9.5px', color: '#991B1B', marginTop: '2px', lineHeight: 1.2 }}>
            {errorMessage}
          </span>
        )}
        <button
          onClick={handleRetry}
          style={{
            marginTop: '6px',
            padding: '2px 8px',
            fontSize: '10.5px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #DC2626',
            borderRadius: '4px',
            color: '#DC2626',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px'
          }}
        >
          <RefreshCw size={10} /> Thử lại
        </button>
      </div>
    );
  }

  const defaultAria = shortCode
    ? `Mã QR tra cứu an sinh cho ${shortCode}`
    : 'Mã QR tra cứu dịch vụ an sinh NEXTA';

  return (
    <div
      data-testid={testId}
      className={`nexta-qr-container ${className}`}
      role="img"
      aria-label={ariaLabel || defaultAria}
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: variant === 'thermal' ? '2px' : '4px',
        borderRadius: variant === 'thermal' ? '0px' : '6px',
        boxSizing: 'border-box',
        ...style
      }}
    >
      {/* Quiet Zone QR Canvas */}
      <div
        ref={containerRef}
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}
      />

      {/* Accessible Short Code Display */}
      {shortCode && (
        <span
          style={{
            marginTop: '4px',
            fontSize: '11px',
            fontWeight: '800',
            fontFamily: 'monospace',
            letterSpacing: '0.5px',
            color: variant === 'safeguarding' ? '#DC2626' : '#16375D'
          }}
        >
          {shortCode}
        </span>
      )}

      {/* Optional User Assistance Caption */}
      {caption && (
        <span
          style={{
            marginTop: '2px',
            fontSize: '10px',
            color: '#64748B',
            textAlign: 'center',
            maxWidth: `${size + 20}px`,
            lineHeight: 1.2
          }}
        >
          {caption}
        </span>
      )}
    </div>
  );
};
