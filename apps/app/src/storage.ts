import AsyncStorage from '@react-native-async-storage/async-storage';

export type DraftStatus = 'pending_sync' | 'syncing' | 'synced';
export type DraftType =
  | 'encounter'
  | 'checkin'
  | 'passport'
  | 'referral'
  | 'task'
  | 'mil_incident'
  | 'case'
  | 'voice_intake';

export interface OfflineDraftRecord {
  id: string;
  type: DraftType;
  idempotencyKey: string;
  payload: any;
  createdAt: string;
  status: DraftStatus;
  lastAttemptAt?: string;
  retryCount?: number;
  errorMessage?: string;
}

const STORAGE_KEY = '@buoc_tiep_offline_draft_queue_v1';
let memoryDraftQueue: OfflineDraftRecord[] = [];

/**
 * Load persistent queue with multi-tier fallback:
 * 1. AsyncStorage (@react-native-async-storage/async-storage)
 * 2. window.localStorage (Web platform fallback)
 * 3. In-memory array queue
 */
const loadPersistentQueue = async (): Promise<OfflineDraftRecord[]> => {
  try {
    const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
    if (jsonValue != null) {
      const parsed = JSON.parse(jsonValue) as OfflineDraftRecord[];
      memoryDraftQueue = parsed;
      return parsed;
    }
  } catch (e) {
    console.warn('[Storage] Error loading from AsyncStorage, checking localStorage:', e);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as OfflineDraftRecord[];
        memoryDraftQueue = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[Storage] Error loading from window.localStorage:', e);
  }

  return memoryDraftQueue;
};

/**
 * Save persistent queue with multi-tier fallback:
 * 1. Update memory state
 * 2. Write to AsyncStorage
 * 3. Write to window.localStorage
 */
const savePersistentQueue = async (queue: OfflineDraftRecord[]): Promise<void> => {
  memoryDraftQueue = queue;
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  } catch (e) {
    console.warn('[Storage] Error saving to AsyncStorage, trying localStorage:', e);
  }

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    }
  } catch (e) {
    console.warn('[Storage] Error saving to window.localStorage:', e);
  }
};

export const generateIdempotencyKey = (operation: string): string => {
  const uuid = Math.random().toString(36).substring(2, 11) + '-' + Date.now();
  return `${uuid}:${operation}:${Date.now()}`;
};

export const saveOfflineDraft = async (
  type: OfflineDraftRecord['type'],
  payload: any
): Promise<OfflineDraftRecord> => {
  const currentQueue = await loadPersistentQueue();
  const draft: OfflineDraftRecord = {
    id: `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    idempotencyKey: generateIdempotencyKey(type),
    payload,
    createdAt: new Date().toISOString(),
    status: 'pending_sync',
    retryCount: 0,
  };

  currentQueue.push(draft);
  await savePersistentQueue(currentQueue);
  console.log(`[Storage] Saved offline draft (${type}):`, draft.id);
  return draft;
};

export const getOfflineDrafts = async (): Promise<OfflineDraftRecord[]> => {
  return loadPersistentQueue();
};

const updateDraftStatus = async (
  id: string,
  status: DraftStatus,
  options?: { errorMessage?: string }
): Promise<void> => {
  const queue = await loadPersistentQueue();
  const index = queue.findIndex((item) => item.id === id);
  if (index !== -1) {
    queue[index].status = status;
    queue[index].lastAttemptAt = new Date().toISOString();
    if (options?.errorMessage !== undefined) {
      queue[index].errorMessage = options.errorMessage;
    }
    if (status === 'syncing') {
      queue[index].retryCount = (queue[index].retryCount || 0) + 1;
    }
    await savePersistentQueue(queue);
  }
};

export const clearAllDrafts = async (): Promise<void> => {
  // Only remove drafts that have been successfully synced to prevent data loss
  const queue = (await loadPersistentQueue()).filter((item) => item.status !== 'synced');
  await savePersistentQueue(queue);
};

export interface SyncDraftsResult {
  successCount: number;
  failCount: number;
  totalProcessed: number;
  syncedDrafts: OfflineDraftRecord[];
  failedDrafts: OfflineDraftRecord[];
}

/**
 * Tự động quét hàng chờ nháp offline (status: 'pending_sync' | 'syncing')
 * và gửi lên Backend /api/cases hoặc /api/cases/:id/encounters kèm X-Idempotency-Key
 */
export const syncOfflineDrafts = async (apiService: any): Promise<SyncDraftsResult> => {
  const queue = await loadPersistentQueue();
  const pendingDrafts = queue.filter(
    (item) => item.status === 'pending_sync' || item.status === 'syncing'
  );

  const syncedDrafts: OfflineDraftRecord[] = [];
  const failedDrafts: OfflineDraftRecord[] = [];
  let successCount = 0;
  let failCount = 0;

  for (const draft of pendingDrafts) {
    // Chuyển trạng thái sang syncing
    await updateDraftStatus(draft.id, 'syncing');

    try {
      const options = {
        headers: {
          'X-Idempotency-Key': draft.idempotencyKey,
        },
      };

      let result: any;
      if (draft.type === 'case') {
        result = await apiService.createCase(draft.payload, options);
      } else if (draft.type === 'voice_intake') {
        result = await apiService.voiceIntakeSync(draft.payload, options);
      } else if (draft.type === 'passport') {
        result = await apiService.createPassport(draft.payload, options);
      } else if (draft.type === 'referral') {
        result = await apiService.createReferral(draft.payload, options);
      } else if (draft.type === 'mil_incident') {
        result = await apiService.reportMilIncident(draft.payload, options);
      } else if (draft.type === 'task') {
        result = await apiService.createTask(draft.payload, options);
      } else if (draft.type === 'checkin') {
        result = await apiService.createCheckIn(draft.payload, options);
      } else {
        // encounter: must belong to a real case
        const caseId = draft.payload?.caseId;
        if (!caseId) {
          throw new Error('Draft has no caseId');
        }
        result = await apiService.createEncounter(
          caseId,
          {
            summary: draft.payload?.summary || draft.payload?.notes || `Offline draft (${draft.type})`,
            clientGeneratedId: draft.id,
            ...draft.payload,
          },
          options
        );
      }

      if (result && result.offline) {
        throw new Error('Network offline during sync attempt');
      }
      if (result && result.success === false) {
        throw new Error(result.error || result.message || 'Server rejected payload');
      }

      // Cập nhật trạng thái thành synced
      await updateDraftStatus(draft.id, 'synced');
      syncedDrafts.push({ ...draft, status: 'synced' });
      successCount++;
    } catch (err: any) {
      console.warn(`[Storage] Sync offline draft ${draft.id} (${draft.type}) failed:`, err);
      await updateDraftStatus(draft.id, 'pending_sync', {
        errorMessage: err?.message || 'Sync error',
      });
      failedDrafts.push({ ...draft, status: 'pending_sync' });
      failCount++;
    }
  }

  return {
    successCount,
    failCount,
    totalProcessed: pendingDrafts.length,
    syncedDrafts,
    failedDrafts,
  };
};

/**
 * Tự động lắng nghe sự kiện khôi phục kết nối (online event) và chạy syncOfflineDrafts
 */
export const setupAutoSyncListener = (apiService: any, intervalMs: number = 30000) => {
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('online', () => {
      console.log('[OfflineSync] Network restored (online event). Triggering auto-sync...');
      syncOfflineDrafts(apiService).catch((e) => console.warn('[OfflineSync] Auto-sync error:', e));
    });
  }

  const timer = setInterval(() => {
    syncOfflineDrafts(apiService).catch(() => {});
  }, intervalMs);

  return () => clearInterval(timer);
};

