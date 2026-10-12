/**
 * Lớp bọc zmp-sdk. Trong Zalo thì gọi API native; khi chạy `vite` trên trình duyệt để dev
 * thì rơi về API web tương đương. Không bao giờ báo "đã gọi" nếu chưa mở được màn hình gọi.
 */
import { getAccessToken, nativeStorage, openPhone, openWebview } from 'zmp-sdk';

/** Đang chạy bên trong Zalo (có cầu nối native), không phải trình duyệt dev. */
export function inZalo(): boolean {
  if (typeof window === 'undefined') return false;
  const w = window as unknown as Record<string, unknown>;
  return Boolean(w.ZaloJavaScriptInterface || w.webkit || /Zalo/i.test(navigator.userAgent));
}

// ---------------------------------------------------------------------------
// Lưu trữ: nativeStorage (bền hơn localStorage trong WebView của Zalo), dự phòng localStorage.
// ---------------------------------------------------------------------------

export const storage = {
  get(key: string): string | null {
    try {
      const v = nativeStorage.getItem(key);
      if (v) return v;
    } catch {
      /* ngoài Zalo */
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) nativeStorage.removeItem(key);
      else nativeStorage.setItem(key, value);
    } catch {
      /* ngoài Zalo */
    }
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {
      /* bộ nhớ bị chặn — giá trị chỉ sống trong phiên này */
    }
  },
};

// ---------------------------------------------------------------------------
// Gọi điện, mở trang ngoài
// ---------------------------------------------------------------------------

/** Mở màn hình gọi. Trả true nếu đã mở được (Zalo hoặc tel:), false nếu thất bại. */
export async function callNumber(number: string): Promise<boolean> {
  const phoneNumber = number.replace(/\s+/g, '');
  try {
    await openPhone({ phoneNumber });
    return true;
  } catch {
    try {
      window.location.href = `tel:${phoneNumber}`;
      return true;
    } catch {
      return false;
    }
  }
}

/** Mở link ngoài trong webview của Zalo (Mini App không cho điều hướng thẳng ra ngoài). */
export async function openExternal(url: string): Promise<void> {
  try {
    await openWebview({ url, config: { style: 'normal', leftButton: 'back' } });
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

/** Access token Zalo của người đang dùng — server đổi sang Zalo ID. null khi chạy ngoài Zalo. */
export async function zaloAccessToken(): Promise<string | null> {
  try {
    const token = await getAccessToken();
    return token || null;
  } catch {
    return null;
  }
}
