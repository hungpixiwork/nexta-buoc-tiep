import { Env } from '../bindings';
import { normalizeVietnameseSlang } from './vietnameseSlangMap';
import { evaluateSafeguardingRisk } from '@buoc-tiep/shared';

/**
 * WEB CRYPTO AES-GCM-256 PII ENCRYPTION HELPERS
 * Mã hóa / Giải mã thông tin PII cá nhân (Họ tên, SĐT) bảo vệ dữ liệu nhạy cảm.
 */
export async function encryptPII(plainText: string, secretKey: string): Promise<string> {
  if (!plainText) return '';
  const enc = new TextEncoder();
  const keyData = enc.encode(secretKey.padEnd(32, '0').slice(0, 32));
  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, enc.encode(plainText));

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

export async function decryptPII(encryptedBase64: string, secretKey: string): Promise<string> {
  if (!encryptedBase64) return '';
  try {
    const combinedString = atob(encryptedBase64);
    const combined = new Uint8Array(combinedString.length);
    for (let i = 0; i < combinedString.length; i++) {
      combined[i] = combinedString.charCodeAt(i);
    }
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const enc = new TextEncoder();
    const keyData = enc.encode(secretKey.padEnd(32, '0').slice(0, 32));
    const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['decrypt']);
    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, data);

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    return encryptedBase64;
  }
}

export interface IntakeInput {
  audioBuffer?: ArrayBuffer | Uint8Array;
  transcript?: string;
  age?: number | null;
  birthYear?: number | null;
  isMinor?: boolean;
  fullName?: string;
  phone?: string;
  idempotencyKey?: string;
  organizationId?: string;
  volunteerId?: string;
  notes?: string;
  category?: string;
  locationText?: string;
}

export interface RoutingResult {
  levelExecuted: 0 | 1 | 2 | 3;
  processedBy: string;
  isDuplicate: boolean;
  cachedResponse?: any;

  // Beneficiary / Case Metadata
  aliasName: string;
  isMinor: boolean;
  encryptedFullName?: string;
  encryptedPhone?: string;

  // Extracted Data (Zod Schema equivalent)
  rawTranscript: string;
  normalizedTranscript: string;
  category: string;
  urgency: 'low' | 'medium' | 'high' | 'urgent';
  extractedNeeds: string[];
  confidenceScore: number;
  summary: string;
  milScamDetected: boolean;
  scamRiskLevel: 'low' | 'medium' | 'high' | 'critical';

  // SLA & Safeguarding
  nextActionAt: string; // ISO timestamp (+48h SLA)
  safeguardingFlagRequired: boolean;
  safeguardingReason?: string;
  humanReviewRequired: boolean;
  coordinatorNotification?: {
    recipientRole: 'safeguarding_coordinator';
    title: string;
    message: string;
    actionRequired: string;
  };
}

/**
 * 4-LEVEL AI MODEL ROUTING STRATEGY PIPELINE
 * Level 0: Rule Engine (Deterministic) - Hard Deny trẻ em, Check SLA 48h, Trùng lặp Idempotency D1.
 * Level 1: Default Intake - Whisper-v3 STT + Qwen3-30B Workers AI LLM Normalizer.
 * Level 2: Escalation - Google Gemini 2.5 Flash khi confidence < 0.75 hoặc bài toán phức tạp.
 * Level 3: Human Review - Cảnh báo Safeguarding cho Coordinator (TUYỆT ĐỐI KHÔNG tự động gọi/webhook 111).
 */
export async function processAIModelRouting(
  env: Env,
  input: IntakeInput
): Promise<RoutingResult> {
  const secretKey = env.PII_ENCRYPTION_KEY || env.JWT_SECRET || 'buoc_tiep_pii_secret_2026';
  const now = new Date();
  const next48h = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  // --------------------------------------------------------------------------
  // LEVEL 0: RULE ENGINE (DETERMINISTIC)
  // --------------------------------------------------------------------------
  
  // 0.1 Check Idempotency Key in D1 (idempotency_keys table or encounters table)
  if (input.idempotencyKey && env.DB) {
    try {
      const cachedKey = await env.DB.prepare(
        'SELECT * FROM idempotency_keys WHERE idempotency_key = ?'
      ).bind(input.idempotencyKey).first<any>();

      if (cachedKey && cachedKey.response_json) {
        const cachedResponse = JSON.parse(cachedKey.response_json);
        return {
          levelExecuted: 0,
          processedBy: 'Level 0: Deterministic Rule Engine (Idempotency Key Match)',
          isDuplicate: true,
          cachedResponse,
          aliasName: cachedResponse.aliasName || 'DUPLICATE',
          isMinor: cachedResponse.isMinor || false,
          rawTranscript: input.transcript || '',
          normalizedTranscript: input.transcript || '',
          category: cachedResponse.category || 'street_worker',
          urgency: cachedResponse.urgency || 'medium',
          extractedNeeds: cachedResponse.extractedNeeds || [],
          confidenceScore: 1.0,
          summary: 'Yêu cầu bị trùng lặp (Idempotency Key đã xử lý)',
          milScamDetected: false,
          scamRiskLevel: 'low',
          nextActionAt: next48h,
          safeguardingFlagRequired: false,
          humanReviewRequired: false
        };
      }
    } catch {
      // Table idempotency_keys might not exist yet, fallback gracefully
    }
  }

  // 0.2 Age & Minor Check (Hard Deny trẻ em & Gán alias CHILD-2026-XXXX)
  const currentYear = now.getFullYear();
  let calculatedAge: number | null = input.age ?? null;
  if (!calculatedAge && input.birthYear) {
    calculatedAge = currentYear - input.birthYear;
  }

  const safeguardingEval = evaluateSafeguardingRisk({
    isMinor: input.isMinor,
    birthYear: input.birthYear,
    estimatedAge: calculatedAge,
    vulnerabilityGroup: input.category,
    notes: input.notes
  });

  const isMinorDetected = safeguardingEval.isPotentialMinor || (calculatedAge !== null && calculatedAge < 18);
  const aliasName = isMinorDetected
    ? `CHILD-2026-${Math.floor(1000 + Math.random() * 9000)}`
    : `ADULT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

  const encryptedFullName = input.fullName ? await encryptPII(input.fullName, secretKey) : undefined;
  const encryptedPhone = input.phone ? await encryptPII(input.phone, secretKey) : undefined;

  // --------------------------------------------------------------------------
  // LEVEL 1: DEFAULT INTAKE (Cloudflare Workers AI - Whisper-v3 + Qwen3-30B)
  // --------------------------------------------------------------------------
  let rawTranscript = input.transcript || input.notes || '';
  let levelExecuted: 0 | 1 | 2 | 3 = 1;
  let processedBy = 'Level 1: Cloudflare Workers AI (@cf/openai/whisper-large-v3-turbo + @cf/qwen/qwen3-30b-a3b-fp8)';

  // 1.1 Whisper-v3 STT processing if audio provided ($0.0005/min)
  if (input.audioBuffer && env.AI) {
    try {
      const audioArrayBuffer = input.audioBuffer instanceof Uint8Array
        ? input.audioBuffer.buffer
        : input.audioBuffer;

      const sttResponse: any = await (env.AI as any).run('@cf/openai/whisper-large-v3-turbo', {
        audio: Array.from(new Uint8Array(audioArrayBuffer))
      });

      if (sttResponse && sttResponse.text) {
        rawTranscript = sttResponse.text;
      }
    } catch (err) {
      console.warn('[Level 1 STT Warning] Whisper-v3 failed, fallback to text transcript:', err);
    }
  }

  // 1.2 Slang Normalizer
  const slangResult = normalizeVietnameseSlang(rawTranscript);
  const normalizedTranscript = slangResult.normalizedText || rawTranscript;

  // 1.3 LLM Normalizer JSON Mode (@cf/qwen/qwen3-30b-a3b-fp8)
  let extractedCategory = input.category || 'street_worker';
  let extractedUrgency: 'low' | 'medium' | 'high' | 'urgent' = isMinorDetected ? 'urgent' : 'medium';
  let extractedNeeds: string[] = [];
  let confidenceScore = 0.82;
  let summary = normalizedTranscript ? `Tiếp nhận thông tin: "${normalizedTranscript.slice(0, 150)}..."` : 'Tiếp nhận ca đồng hành mới';
  let milScamDetected = false;
  let scamRiskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

  if (env.AI && normalizedTranscript) {
    try {
      const systemPrompt = `Bạn là Chuyên gia Đánh giá Nhu cầu An sinh Xã hội BƯỚC TIẾP (UNESCO Youth Hackathon 2026).
Phân tích văn bản tiếp nhận và trả về duy nhất 1 JSON object chuẩn Zod schema:
{
  "category": "health" | "legal_doc" | "shelter" | "job" | "training" | "emergency_food" | "street_worker" | "homeless",
  "urgency": "low" | "medium" | "high" | "urgent",
  "extracted_needs": ["chuỗi nhu cầu 1", "chuỗi nhu cầu 2"],
  "confidence_score": 0.85,
  "summary": "Tóm tắt ngắn 1-2 câu",
  "milScamDetected": boolean,
  "scamRiskLevel": "low" | "medium" | "high" | "critical",
  "isMinorMentioned": boolean
}`;

      const aiResponse: any = await (env.AI as any).run('@cf/qwen/qwen3-30b-a3b-fp8', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: normalizedTranscript }
        ],
        response_format: { type: 'json_object' }
      });

      if (aiResponse && aiResponse.response) {
        let parsed: any;
        try {
          parsed = typeof aiResponse.response === 'string' ? JSON.parse(aiResponse.response) : aiResponse.response;
        } catch {
          // If JSON parse fails
        }

        if (parsed) {
          if (parsed.category) extractedCategory = parsed.category;
          if (parsed.urgency && ['low', 'medium', 'high', 'urgent'].includes(parsed.urgency)) {
            extractedUrgency = parsed.urgency;
          }
          if (Array.isArray(parsed.extracted_needs)) extractedNeeds = parsed.extracted_needs;
          if (typeof parsed.confidence_score === 'number') confidenceScore = parsed.confidence_score;
          if (parsed.summary) summary = parsed.summary;
          if (typeof parsed.milScamDetected === 'boolean') milScamDetected = parsed.milScamDetected;
          if (parsed.scamRiskLevel && ['low', 'medium', 'high', 'critical'].includes(parsed.scamRiskLevel)) {
            scamRiskLevel = parsed.scamRiskLevel;
          }
        }
      }
    } catch (err) {
      console.warn('[Level 1 LLM Warning] Qwen3-30B failed, fallback to default extraction:', err);
    }
  }

  // Check if text indicates complex keywords
  const isComplexProblem = /lừa đảo|tội phạm|buôn người|bạo lực|bắt giam|giấy tờ giả|cưỡng bức/i.test(normalizedTranscript);

  // --------------------------------------------------------------------------
  // LEVEL 2: ESCALATION (Google Gemini 2.5 Flash API)
  // --------------------------------------------------------------------------
  if (confidenceScore < 0.75 || isComplexProblem || scamRiskLevel === 'high' || scamRiskLevel === 'critical') {
    levelExecuted = 2;
    processedBy = 'Level 2: Google Gemini 2.5 Flash API Escalation';

    const apiKey = env.GEMINI_API_KEY || env.GOOGLE_CLIENT_SECRET;
    if (apiKey) {
      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const prompt = `Phân tích hồ sơ phức tạp/độ tin cậy thấp và trả về JSON:
Văn bản: "${normalizedTranscript}"
Trả về JSON đúng cấu trúc:
{
  "category": "health | legal_doc | shelter | job | training | emergency_food | street_worker",
  "urgency": "low | medium | high | urgent",
  "extracted_needs": ["nhu cầu 1", "nhu cầu 2"],
  "confidence_score": 0.95,
  "summary": "Tóm tắt chuyên sâu",
  "milScamDetected": boolean,
  "scamRiskLevel": "low | medium | high | critical"
}`;

        const res = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (res.ok) {
          const resData: any = await res.json();
          const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              const geminiParsed = JSON.parse(jsonMatch[0]);
              if (geminiParsed.category) extractedCategory = geminiParsed.category;
              if (geminiParsed.urgency) extractedUrgency = geminiParsed.urgency;
              if (Array.isArray(geminiParsed.extracted_needs)) extractedNeeds = geminiParsed.extracted_needs;
              if (typeof geminiParsed.confidence_score === 'number') confidenceScore = geminiParsed.confidence_score;
              if (geminiParsed.summary) summary = geminiParsed.summary;
              if (typeof geminiParsed.milScamDetected === 'boolean') milScamDetected = geminiParsed.milScamDetected;
              if (geminiParsed.scamRiskLevel) scamRiskLevel = geminiParsed.scamRiskLevel;
            }
          }
        }
      } catch (err) {
        console.warn('[Level 2 Gemini Escalation Warning] Gemini API failed:', err);
      }
    } else {
      confidenceScore = Math.max(confidenceScore, 0.78);
    }
  }

  // Enforce Child Safeguarding Overrides
  if (isMinorDetected) {
    extractedUrgency = 'urgent';
    if (!extractedNeeds.includes('Bảo vệ trẻ em khẩn cấp')) {
      extractedNeeds.unshift('Bảo vệ trẻ em khẩn cấp');
    }
  }

  // --------------------------------------------------------------------------
  // LEVEL 3: HUMAN REVIEW (Coordinator Safeguarding Alert)
  // --------------------------------------------------------------------------
  const isHighRisk = isMinorDetected || extractedUrgency === 'urgent' || scamRiskLevel === 'critical' || scamRiskLevel === 'high';

  let humanReviewRequired = false;
  let coordinatorNotification: RoutingResult['coordinatorNotification'] = undefined;

  if (isHighRisk) {
    levelExecuted = 3;
    processedBy = 'Level 3: Human Safeguarding Coordinator Review (Safeguarding High Risk Triggered)';
    humanReviewRequired = true;

    coordinatorNotification = {
      recipientRole: 'safeguarding_coordinator',
      title: `[CẢNH BÁO SAFEGUARDING ML3] ${isMinorDetected ? 'Trẻ em vị thành niên (<18t)' : 'Trường hợp nguy cơ rủi ro cao'}`,
      message: `Hệ thống ghi nhận ca đồng hành ${aliasName} thuộc nhóm nguy cơ cao. Nhu cầu: ${extractedNeeds.join(', ')}. Đánh giá lừa đảo/bóc lột: ${scamRiskLevel.toUpperCase()}.`,
      actionRequired: 'Phân công Cán bộ Chuyên trách thẩm định và can thiệp trong 48h SLA. TUYỆT ĐỐI KHÔNG tự động chuyển tuyến 111.'
    };
  }

  return {
    levelExecuted,
    processedBy,
    isDuplicate: false,

    aliasName,
    isMinor: isMinorDetected,
    encryptedFullName,
    encryptedPhone,

    rawTranscript,
    normalizedTranscript,
    category: extractedCategory,
    urgency: extractedUrgency,
    extractedNeeds,
    confidenceScore,
    summary,
    milScamDetected,
    scamRiskLevel,

    nextActionAt: next48h,
    safeguardingFlagRequired: isMinorDetected || scamRiskLevel === 'critical',
    safeguardingReason: isMinorDetected
      ? 'Trẻ em vị thành niên (<18t) - Kích hoạt quy định Child Safeguarding UNESCO'
      : (scamRiskLevel === 'critical' ? 'Phát hiện nguy cơ lừa đảo / bóc lột nghiêm trọng' : undefined),
    humanReviewRequired,
    coordinatorNotification
  };
}
