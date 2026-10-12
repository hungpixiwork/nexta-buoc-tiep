/**
 * Bản nháp "Gặp người mới" khi mất mạng. Lưu trên máy (nativeStorage), gắn với người dùng,
 * gửi lại khi có mạng. Giao diện chỉ được ghi "Đã lưu trên máy, sẽ gửi khi có mạng" — không ghi "Đã lưu".
 */
import type { Consent, LoopCase } from '@web/lib/types';
import { loopFetch } from './api';
import { storage } from './platform';

export interface NewPersonDraft {
  id: string;
  createdAt: string;
  alias: string;
  observation: string;
  keywords: string[];
  consent: Omit<Consent, 'recordedBy' | 'recordedAt'> | null;
}

const key = (userId: string) => `nexta_zalo_drafts_${userId}_v1`;

export function listDrafts(userId: string): NewPersonDraft[] {
  try {
    return JSON.parse(storage.get(key(userId)) ?? '[]') as NewPersonDraft[];
  } catch {
    return [];
  }
}

export function saveDraft(userId: string, draft: Omit<NewPersonDraft, 'id' | 'createdAt'>): NewPersonDraft {
  const full = { ...draft, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  storage.set(key(userId), JSON.stringify([...listDrafts(userId), full]));
  return full;
}

export function clearDrafts(userId: string) {
  storage.set(key(userId), null);
}

function removeDraft(userId: string, id: string) {
  const rest = listDrafts(userId).filter((d) => d.id !== id);
  storage.set(key(userId), rest.length ? JSON.stringify(rest) : null);
}

/** Tạo hành trình (và ghi sự đồng ý nếu có) trên server. Dùng cho cả gửi trực tiếp lẫn gửi lại bản nháp. */
export async function submitNewPerson(d: Omit<NewPersonDraft, 'id' | 'createdAt'>): Promise<LoopCase> {
  const captureModes: Array<'note' | 'keywords'> = [];
  if (d.observation.trim()) captureModes.push('note');
  if (d.keywords.length) captureModes.push('keywords');
  const { case: created } = await loopFetch<{ case: LoopCase }>('/cases', {
    method: 'POST',
    body: { alias: d.alias, observation: d.observation, keywords: d.keywords, captureModes: captureModes.length ? captureModes : ['note'] },
  });
  if (d.consent) await loopFetch(`/cases/${created.id}/consent`, { method: 'PUT', body: d.consent });
  return created;
}

/** Gửi lại mọi bản nháp. Lỗi mạng → giữ lại; lỗi dữ liệu (4xx) → giữ lại để người dùng xem. Trả số bản đã gửi. */
export async function syncDrafts(userId: string): Promise<number> {
  let sent = 0;
  for (const d of listDrafts(userId)) {
    try {
      await submitNewPerson(d);
      removeDraft(userId, d.id);
      sent += 1;
    } catch {
      break;
    }
  }
  return sent;
}
