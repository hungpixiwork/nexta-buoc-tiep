/**
 * BƯỚC TIẾP API client.
 * Reads throw on failure so screens can show a real error state. Writes that fail
 * because the network is down are queued offline (see storage.ts) and come back
 * as `{ offline: true }`; any HTTP error is thrown as an ApiError.
 */

import { saveOfflineDraft, syncOfflineDrafts, DraftType } from '../storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL =
  (process.env as Record<string, string | undefined>).EXPO_PUBLIC_API_URL ||
  'https://buoc-tiep-api.ppnh10092002.workers.dev';

const TOKEN_KEY = '@buoc_tiep_jwt_token';
const REQUEST_TIMEOUT_MS = 8000;

export interface ApiOptions {
  headers?: Record<string, string>;
  token?: string;
}

/** HTTP error returned by the API (status >= 400). */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Result of a write that could not reach the server and was queued. */
export interface OfflineQueued {
  success: true;
  offline: true;
  draftId: string;
}

export const isOfflineQueued = (result: unknown): result is OfflineQueued =>
  !!result && typeof result === 'object' && (result as OfflineQueued).offline === true;

class ApiService {
  private baseUrl: string;
  private unauthorizedHandler: (() => void) | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /** Called when the server rejects the session (401); App uses it to sign out. */
  onUnauthorized(handler: (() => void) | null) {
    this.unauthorizedHandler = handler;
  }

  private async request<T>(endpoint: string, options: Omit<RequestInit, 'headers'> & ApiOptions = {}): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...options.headers };

    let token = options.token;
    if (!token) {
      try {
        token = (await AsyncStorage.getItem(TOKEN_KEY)) || undefined;
      } catch {
        // storage unavailable: send the request without a token
      }
    }
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${this.baseUrl}${endpoint}`, { ...options, headers, signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const body = await response.json().catch(() => null);
      if (response.status === 401 && !endpoint.startsWith('/api/auth/login')) {
        this.unauthorizedHandler?.();
      }
      throw new ApiError(response.status, body?.error || body?.message || `HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  }

  /**
   * Runs a write; if the network is unreachable, queues it offline instead.
   * HTTP errors (validation, auth, 404…) are rethrown, never queued.
   * Replays from the sync queue carry X-Idempotency-Key and are never re-queued,
   * otherwise every failed retry would add a duplicate draft.
   */
  private async writeOrQueue<T>(
    draftType: DraftType,
    payload: unknown,
    options: ApiOptions | undefined,
    send: () => Promise<T>
  ): Promise<T | OfflineQueued> {
    try {
      return await send();
    } catch (error) {
      const isReplay = !!options?.headers?.['X-Idempotency-Key'];
      if (error instanceof ApiError || isReplay) throw error;
      const draft = await saveOfflineDraft(draftType, payload);
      return { success: true, offline: true, draftId: draft.id };
    }
  }

  private post<T>(endpoint: string, payload: unknown, options?: ApiOptions) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: options?.headers,
      token: options?.token,
    });
  }

  // 1. Auth
  login(email: string, password: string) {
    return this.post<{ success: boolean; token: string; user: any }>('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password: password.trim(),
    });
  }

  register(data: { full_name: string; phone?: string; email: string; password: string; role?: string }) {
    return this.post<{ success: boolean; token: string; user: any }>('/api/auth/register', {
      full_name: data.full_name.trim(),
      phone: data.phone,
      email: data.email.trim().toLowerCase(),
      password: data.password.trim(),
      role: data.role || 'volunteer',
    });
  }

  getProfile() {
    return this.request<{ success: boolean; user: any }>('/api/auth/me');
  }

  // 2. Journeys
  getTodayJourney() {
    return this.request<{ success: boolean; data: any }>('/api/journeys/today');
  }

  // 3. Cases
  getCases(priority?: string) {
    const query = priority ? `?priority=${encodeURIComponent(priority)}` : '';
    return this.request<{ success: boolean; data: any[] }>(`/api/cases${query}`);
  }

  createCase(caseData: any, options?: ApiOptions) {
    return this.writeOrQueue('case', caseData, options, () =>
      this.post<{ success: boolean; id: string; isMinor?: boolean; message: string }>('/api/cases', caseData, options)
    );
  }

  voiceIntakeSync(payload: any, options?: ApiOptions) {
    return this.writeOrQueue('voice_intake', payload, options, () =>
      this.post<{ success: boolean; id: string; message: string }>('/api/cases', { intakeType: 'voice', ...payload }, options)
    );
  }

  createEncounter(caseId: string, payload: any, options?: ApiOptions) {
    return this.writeOrQueue('encounter', { caseId, ...payload }, options, () =>
      this.post<{ success: boolean; id: string; message: string }>(`/api/cases/${caseId}/encounters`, payload, options)
    );
  }

  /** Signed, 24h QR credential for a case (the API refuses minors). */
  createQrCredential(caseId: string) {
    return this.post<{ success: boolean; verificationUrl: string; qrExpiresAt: string }>(
      `/api/cases/${caseId}/qr-credential`,
      {}
    );
  }

  recordQrScan(caseId: string, data: Record<string, unknown> = {}) {
    return this.post<{ success: boolean; scanId: string; timestamp: string; locationText: string }>(
      `/api/cases/${caseId}/qr-scan`,
      data
    );
  }

  getDocxExportUrl(caseId: string): string {
    return `${this.baseUrl}/api/cases/${caseId}/export-docx`;
  }

  // 4. Safeguarding
  getPendingSafeguardingFlags() {
    return this.request<{ success: boolean; data: any[] }>('/api/cases/safeguarding/pending');
  }

  reviewSafeguardingFlag(caseId: string, flagId: string, action: 'confirm' | 'reject', notes?: string) {
    return this.post<{ success: boolean; status: string; message: string }>(
      `/api/cases/${caseId}/safeguarding/${flagId}/review`,
      { action, notes }
    );
  }

  // 5. People, impact, resources
  getVolunteers() {
    return this.request<{ success: boolean; data: any[] }>('/api/volunteers');
  }

  getImpactSummary() {
    return this.request<{ success: boolean; data: any }>('/api/impact/summary');
  }

  getResources(category?: string) {
    const query = category ? `?category=${encodeURIComponent(category)}` : '';
    return this.request<{ success: boolean; data: any[] }>(`/api/resources${query}`);
  }

  // 6. Livelihood passport (keyed by case)
  getPassport(caseId: string) {
    return this.request<{ success: boolean; data: any | null }>(`/api/cases/${caseId}/passport`);
  }

  getPassportTimeline(passportId: string) {
    return this.request<{ success: boolean; data: any[] }>(`/api/passports/${passportId}/timeline`);
  }

  createPassport(payload: any, options?: ApiOptions) {
    return this.writeOrQueue('passport', payload, options, () =>
      this.post<{ success: boolean; id: string; message: string }>('/api/passports', payload, options)
    );
  }

  updatePassport(caseId: string, payload: any) {
    return this.post<{ success: boolean; data: any }>(`/api/cases/${caseId}/passport`, payload);
  }

  // 7. Referrals, tasks, MIL
  createReferral(payload: any, options?: ApiOptions) {
    return this.writeOrQueue('referral', payload, options, () =>
      this.post<{ success: boolean; id: string; message: string }>('/api/resources/referrals', payload, options)
    );
  }

  createTask(
    payload: { caseId: string; title: string; description?: string; assignedTo?: string; dueAt?: string; priority?: string },
    options?: ApiOptions
  ) {
    return this.writeOrQueue('task', payload, options, () =>
      this.post<{ success: boolean; taskId: string; message: string }>('/api/tasks', payload, options)
    );
  }

  /** Check-in / follow-up log for a case (POST /api/followups). */
  createCheckIn(
    payload: { caseId: string; notes: string; actionType?: 'call' | 'visit'; status?: 'pending' | 'in_progress' | 'completed' },
    options?: ApiOptions
  ) {
    return this.writeOrQueue('checkin', payload, options, () =>
      this.post<{ success: boolean; id: string; message: string }>('/api/followups', payload, options)
    );
  }

  reportMilIncident(payload: any, options?: ApiOptions) {
    return this.writeOrQueue('mil_incident', payload, options, () =>
      this.post<{ success: boolean; id: string; message: string }>('/api/mil/incidents', payload, options)
    );
  }

  syncOfflineDrafts() {
    return syncOfflineDrafts(this);
  }
}

export const apiService = new ApiService();
