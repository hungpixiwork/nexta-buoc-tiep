/**
 * BƯỚC TIẾP — UNESCO Youth Hackathon 2026
 * AppCore v1.1: Reusable Architecture for Vanilla HTML / Lightweight Web Apps
 * 
 * Giải quyết 5 vấn đề cốt lõi:
 * 1. Tự động inject Header & Bottom Navigation (Responsive, 44px Touch target)
 * 2. apiFetch đóng gói kết nối Cloudflare Worker D1 + CORS Support
 * 3. Safe DOM Helpers & Sanitizer (Chống 100% XSS & Mask PII)
 * 4. Offline Draft Queue (Tự động lưu nháp khi rớt 3G/4G thực địa)
 * 5. Voice Recorder helper nạp nén Opus 32kbps siêu nhẹ cho Whisper STT
 */

window.AppCore = (function () {
  // Cấu hình API Backend (Cloudflare Worker)
  const API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:8787/api' 
    : 'https://buoc-tiep-api.workers.dev/api';

  // --- 1. AMIS & SECURITY HELPERS (CHỐNG XSS & ZERO PII) ---
  function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Che giấu dữ liệu cá nhân (Zero PII Safeguarding)
  function maskPII(text) {
    if (!text) return '';
    // Mask SĐT (VD: 0987654321 -> 098****321)
    let masked = text.replace(/(\d{3})\d{4}(\d{3})/g, '$1****$2');
    // Mask CCCD (VD: 038199001234 -> 038******234)
    masked = masked.replace(/(\d{3})\d{6}(\d{3})/g, '$1******$2');
    return masked;
  }

  // Sinh mã Alias ngẫu nhiên ẩn danh (VD: BT-7K2M-9Q4X)
  function generateAnonymousAlias() {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    const randSegment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `BT-${randSegment(4)}-${randSegment(4)}`;
  }

  function createSafeElement(tag, attrs = {}, children = []) {
    const el = document.createElement(tag);
    Object.keys(attrs).forEach((key) => {
      if (key === 'className') {
        el.className = attrs[key];
      } else if (key.startsWith('on') && typeof attrs[key] === 'function') {
        el.addEventListener(key.substring(2).toLowerCase(), attrs[key]);
      } else if (key === 'style' && typeof attrs[key] === 'object') {
        Object.assign(el.style, attrs[key]);
      } else {
        el.setAttribute(key, attrs[key]);
      }
    });

    if (typeof children === 'string' || typeof children === 'number') {
      el.textContent = String(children);
    } else if (Array.isArray(children)) {
      children.forEach((child) => {
        if (typeof child === 'string' || typeof child === 'number') {
          el.appendChild(document.createTextNode(String(child)));
        } else if (child instanceof HTMLElement) {
          el.appendChild(child);
        }
      });
    }
    return el;
  }

  function renderList(containerSelector, items, renderFn) {
    const container = typeof containerSelector === 'string' 
      ? document.querySelector(containerSelector) 
      : containerSelector;
    if (!container) return;
    
    container.innerHTML = '';
    if (!items || items.length === 0) {
      container.appendChild(
        createSafeElement('div', { className: 'p-6 text-center text-slate-500 font-medium' }, 'Không có dữ liệu hiển thị.')
      );
      return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item, index) => {
      const element = renderFn(item, index);
      if (element instanceof HTMLElement) {
        fragment.appendChild(element);
      }
    });
    container.appendChild(fragment);
  }

  // --- 2. OFFLINE DRAFT QUEUE (HÀNG CHỜ MẤT MẠNG THỰC ĐỊA) ---
  const OFFLINE_KEY = 'bt_offline_draft_cases';

  function saveOfflineDraft(caseData) {
    try {
      const drafts = getOfflineDrafts();
      const newDraft = {
        id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        created_at: new Date().toISOString(),
        ...caseData,
      };
      drafts.push(newDraft);
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(drafts));
      toast(`Đã lưu nháp ca thực địa offline (Tổng: ${drafts.length} ca)`, 'warning');
      return newDraft;
    } catch (e) {
      console.error('[AppCore Offline Save Error]', e);
    }
  }

  function getOfflineDrafts() {
    try {
      const raw = localStorage.getItem(OFFLINE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function clearOfflineDrafts() {
    localStorage.removeItem(OFFLINE_KEY);
  }

  async function syncOfflineDrafts() {
    const drafts = getOfflineDrafts();
    if (drafts.length === 0) return;

    toast(`Đang tự động đồng bộ ${drafts.length} ca offline...`, 'info');
    let successCount = 0;
    const remaining = [];

    for (const draft of drafts) {
      try {
        await apiFetch('/cases', { method: 'POST', body: draft });
        successCount++;
      } catch (err) {
        remaining.push(draft);
      }
    }

    if (remaining.length > 0) {
      localStorage.setItem(OFFLINE_KEY, JSON.stringify(remaining));
      toast(`Đã đồng bộ ${successCount} ca. Còn ${remaining.length} ca chờ mạng ổn định.`, 'warning');
    } else {
      clearOfflineDrafts();
      toast(`Đã đồng bộ thành công tất cả ${successCount} ca offline lên hệ thống!`, 'success');
    }
  }

  // Tự động lắng nghe sự kiện khôi phục Internet
  window.addEventListener('online', () => {
    toast('Đã kết nối lại Internet! Đang kiểm tra dữ liệu nháp...', 'info');
    syncOfflineDrafts();
  });

  // --- 3. API FETCH HELPER (HỖ TRỢ CORS & BACKEND CLOUDFLARE) ---
  async function apiFetch(endpoint, options = {}) {
    // Xử lý khi mất mạng hoàn toàn
    if (!navigator.onLine && options.method && options.method !== 'GET') {
      toast('Mất kết nối mạng. Đã tự động chuyển sang chế độ Lưu Nháp Offline.', 'warning');
      if (options.body) saveOfflineDraft(options.body);
      throw new Error('NETWORK_OFFLINE');
    }

    const token = localStorage.getItem('bt_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };

    const config = {
      method: options.method || 'GET',
      headers,
      ...(options.body ? { body: JSON.stringify(options.body) } : {}),
    };

    try {
      const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Lỗi máy chủ (${response.status})`);
      }
      return data;
    } catch (err) {
      if (err.message === 'NETWORK_OFFLINE') throw err;
      console.error(`[AppCore API Error] ${endpoint}:`, err);
      
      // Nếu là thao tác ghi dữ liệu mà lỗi kết nối, lưu nháp
      if (options.method && options.method !== 'GET' && options.body) {
        saveOfflineDraft(options.body);
      } else {
        toast(err.message || 'Không thể kết nối đến máy chủ', 'error');
      }
      throw err;
    }
  }

  // --- 4. VOICE MEDIA RECORDER (NÉN NẸP CHO WHISPER STT) ---
  function createVoiceRecorder(onDataAvailable) {
    let mediaRecorder = null;
    let chunks = [];

    return {
      async start() {
        chunks = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Chọn định dạng opus nén siêu nhẹ
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
          ? 'audio/webm;codecs=opus' 
          : 'audio/ogg;codecs=opus';

        mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 32000 });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType });
          if (onDataAvailable) onDataAvailable(blob);
          stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorder.start(500); // 500ms chunks
      },
      stop() {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      }
    };
  }

  // --- 5. TOAST NOTIFICATION (SÁNG MÀU, TƯƠNG PHẢN CAO) ---
  function toast(message, type = 'info') {
    let container = document.getElementById('bt-toast-container');
    if (!container) {
      container = createSafeElement('div', {
        id: 'bt-toast-container',
        className: 'fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full px-4',
      });
      document.body.appendChild(container);
    }

    const bgMap = {
      success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
      error: 'bg-rose-50 border-rose-300 text-rose-900',
      info: 'bg-blue-50 border-blue-300 text-blue-900',
      warning: 'bg-amber-50 border-amber-300 text-amber-900',
    };

    const iconMap = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠',
    };

    const toastEl = createSafeElement('div', {
      className: `flex items-center gap-3 p-4 rounded-xl border shadow-md font-medium text-sm transition-all duration-300 transform translate-y-0 opacity-100 ${bgMap[type] || bgMap.info}`,
    }, [
      createSafeElement('span', { className: 'font-bold text-base' }, iconMap[type] || 'ℹ'),
      createSafeElement('div', { className: 'flex-1' }, message)
    ]);

    container.appendChild(toastEl);
    setTimeout(() => {
      toastEl.classList.add('opacity-0', '-translate-y-2');
      setTimeout(() => toastEl.remove(), 300);
    }, 3500);
  }

  // --- 6. TỰ ĐỘNG INJECT HEADER & BOTTOM NAV ---
  function initLayout(config = {}) {
    const { title = 'BƯỚC TIẾP', activeNav = 'home' } = config;

    // Đảm bảo Viewport chuẩn Mobile Touch
    if (!document.querySelector('meta[name="viewport"]')) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }

    // Checking offline status on load
    const drafts = getOfflineDrafts();
    const offlineNotice = drafts.length > 0 
      ? `<span class="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-bold">Offline: ${drafts.length} ca</span>`
      : '';

    // Header Component
    const headerHtml = `
      <header class="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 py-3 shadow-xs">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              BT
            </div>
            <div>
              <h1 class="text-base font-bold text-slate-900 leading-tight">${escapeHTML(title)}</h1>
              <p class="text-xs text-slate-500 font-medium">UNESCO Youth Hackathon 2026</p>
            </div>
          </div>
          <div class="flex items-center gap-2" id="bt-user-badge">
            ${offlineNotice}
            <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              TNV Thực Địa
            </span>
          </div>
        </div>
      </header>
    `;

    // Bottom Navigation (Đảm bảo Touch Target tối thiểu 44px)
    const navItems = [
      { id: 'home', label: 'Tạo Ca', icon: '📝', href: 'index.html' },
      { id: 'cases', label: 'Danh Sách', icon: '📋', href: 'cases.html' },
      { id: 'lookup', label: 'Tra Mã QR', icon: '🔍', href: 'lookup.html' },
      { id: 'trips', label: 'Chuyến Đi', icon: '🗺️', href: 'trips.html' },
      { id: 'dashboard', label: 'Báo Cáo', icon: '📊', href: 'dashboard.html' },
    ];

    const navLinksHtml = navItems.map((item) => {
      const isActive = item.id === activeNav;
      const activeClass = isActive
        ? 'text-blue-600 font-bold bg-blue-50/80 border-t-2 border-blue-600'
        : 'text-slate-600 hover:text-slate-900 font-medium';
      return `
        <a href="${item.href}" class="flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 px-1 text-xs transition-colors ${activeClass}">
          <span class="text-lg mb-0.5">${item.icon}</span>
          <span>${escapeHTML(item.label)}</span>
        </a>
      `;
    }).join('');

    const bottomNavHtml = `
      <nav class="bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 shadow-lg">
        <div class="max-w-4xl mx-auto flex items-center justify-between">
          ${navLinksHtml}
        </div>
      </nav>
    `;

    const headerMount = document.getElementById('app-header');
    if (headerMount) headerMount.innerHTML = headerHtml;

    const navMount = document.getElementById('app-nav');
    if (navMount) navMount.innerHTML = bottomNavHtml;
  }

  return {
    escapeHTML,
    maskPII,
    generateAnonymousAlias,
    createSafeElement,
    renderList,
    apiFetch,
    saveOfflineDraft,
    getOfflineDrafts,
    clearOfflineDrafts,
    syncOfflineDrafts,
    createVoiceRecorder,
    toast,
    initLayout,
    qs: (sel) => document.querySelector(sel),
    qsa: (sel) => document.querySelectorAll(sel),
  };
})();
