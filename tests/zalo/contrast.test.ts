import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

// Đọc token thật từ styles.css — đổi màu mà làm tụt tương phản thì test đỏ.
const css = readFileSync(new URL('../../apps/zalo/src/styles.css', import.meta.url), 'utf8');

type RGB = [number, number, number];

function token(name: string): { rgb: RGB; alpha: number } {
  const m = css.match(new RegExp(`--color-${name}:\\s*([^;]+);`));
  if (!m) throw new Error(`missing token ${name}`);
  const v = m[1].trim();
  const hex = v.match(/^#([0-9a-f]{6})$/i);
  if (hex) return { rgb: [0, 2, 4].map((i) => parseInt(hex[1].slice(i, i + 2), 16)) as RGB, alpha: 1 };
  const rgb = v.match(/^rgb\((\d+)\s+(\d+)\s+(\d+)\s*\/\s*([\d.]+)\)$/);
  if (rgb) return { rgb: [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])], alpha: Number(rgb[4]) };
  throw new Error(`unsupported token value ${name}: ${v}`);
}

/** Màu thật hiển thị: token trong suốt được phủ lên nền (mặc định trắng). */
function solid(name: string, over: RGB = [255, 255, 255]): RGB {
  const { rgb, alpha } = token(name);
  return rgb.map((c, i) => Math.round(c * alpha + over[i] * (1 - alpha))) as RGB;
}

const lum = (c: RGB) => {
  const [r, g, b] = c.map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: RGB, b: RGB) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};
const WHITE: RGB = [255, 255, 255];

describe('Token NEXTA — tương phản chữ đạt WCAG AAA (≥ 7:1)', () => {
  const pairs: Array<[string, string]> = [
    ['fg', 'surface'],
    ['fg', 'canvas'],
    ['fg', 'surface-soft'],
    ['fg-2', 'surface'],
    ['fg-2', 'canvas'],
    ['fg-2', 'surface-soft'],
    ['fg', 'primary-soft'],
    ['primary-ink', 'surface'],
    ['primary-ink', 'surface-soft'],
    ['primary-ink', 'primary-soft'],
    ['success-ink', 'success-soft'],
    ['accent-ink', 'accent-soft'],
    ['fg', 'success'],
    ['fg', 'accent'],
    ['danger', 'danger-soft'],
  ];
  it.each(pairs)('%s trên %s', (fg, bg) => {
    expect(ratio(solid(fg), solid(bg))).toBeGreaterThanOrEqual(7);
  });

  it('chữ trắng trên nút chính và nút nguy hiểm', () => {
    expect(ratio(WHITE, solid('primary-strong'))).toBeGreaterThanOrEqual(7);
    expect(ratio(WHITE, solid('danger'))).toBeGreaterThanOrEqual(7);
  });

  it('không có màu đen tuyệt đối', () => {
    expect(css).not.toMatch(/#000000\b|#000\b/i);
  });
});
