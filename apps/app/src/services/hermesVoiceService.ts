/**
 * HERMES VOICE & SLANG CLIENT SERVICE (EXPO REACT NATIVE & WEB)
 * Tích hợp nhận diện tiếng lóng Việt Nam, Web Speech STT/TTS & API Backend Cloudflare.
 */

export interface HermesChatResponse {
  success: boolean;
  agent: string;
  slang_processing: {
    original: string;
    normalized: string;
    detected_count: number;
    slangs: Array<{ slang: string; standard: string }>;
  };
  response: string;
  grounded_research: {
    fact_checked: boolean;
    citations_count: number;
    citations: Array<{ title: string; url: string; excerpt: string; confidence: number }>;
  };
  timestamp: string;
}

const API_BASE_URL = 'https://buoc-tiep-api.ppnh10092002.workers.dev';

/**
 * Gửi yêu cầu câu hỏi / khảo sát tiếng Việt tới Hermes API Engine
 */
export async function sendHermesPrompt(
  prompt: string,
  userId?: string,
  enableFactCheck: boolean = true
): Promise<HermesChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/hermes/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt,
      user_id: userId || 'app_volunteer_user',
      enable_fact_check: enableFactCheck,
    }),
  });

  if (!response.ok) {
    throw new Error(`Hermes API error: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Phát âm thanh phản hồi (Streaming Speech Synthesis 0.9x speed cho người già / yếu thế)
 */
export function speakHermesResponse(text: string, onEnd?: () => void): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Stop any ongoing speech (Barge-in handling)
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 0.9; // Tốc độ ấm áp, vừa phải cho thanh niên & người già

    if (onEnd) {
      utterance.onend = onEnd;
    }

    window.speechSynthesis.speak(utterance);
  } else {
    console.log('[Hermes Voice Synthesis Fallback]:', text);
    if (onEnd) onEnd();
  }
}

/**
 * Dừng phát âm thanh ngay lập tức (Barge-in Action)
 */
export function stopHermesSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
