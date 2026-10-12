import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import qrcode from 'qrcode-generator';

interface QrCodeProps {
  value: string;
  size?: number;
  color?: string;
}

/** Scannable QR code rendered with react-native-svg (works on web and native). */
export const QrCode: React.FC<QrCodeProps> = ({ value, size = 200, color = '#0F172A' }) => {
  const { path, count } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const moduleCount = qr.getModuleCount();
    let d = '';
    for (let row = 0; row < moduleCount; row++) {
      for (let col = 0; col < moduleCount; col++) {
        if (qr.isDark(row, col)) d += `M${col} ${row}h1v1h-1z`;
      }
    }
    return { path: d, count: moduleCount };
  }, [value]);

  const quietZone = 2;
  const viewSize = count + quietZone * 2;
  return (
    <Svg width={size} height={size} viewBox={`${-quietZone} ${-quietZone} ${viewSize} ${viewSize}`} accessibilityLabel="QR code">
      <Rect x={-quietZone} y={-quietZone} width={viewSize} height={viewSize} fill="#FFFFFF" />
      <Path d={path} fill={color} />
    </Svg>
  );
};
