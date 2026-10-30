import { GoogleGenAI } from "@google/genai";
import { classifyError, failure } from "./errors";
import { buildUserPrompt, parseAiAnswer, SYSTEM_INSTRUCTION } from "./prompt";
import type { AskPayload } from "./payload";
import type { AskResult } from "./types";

// 실습조건이 정한 모델. 서버에서만 호출한다.
export const DEFAULT_MODEL = "gemini-3.8-flash";
export const TIMEOUT_MS = 25_000; // 실제 호출이 15초 안팎 걸려 여유를 둠. 서버 최대 실행 시간(30초)보다 짧게

// Gemini를 호출해 답변을 받는다. 키 값은 이 함수 밖으로 나가지 않는다.
export async function askGemini(payload: AskPayload, apiKey: string): Promise<AskResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL,
      contents: buildUserPrompt(payload),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        temperature: 0.2,
        maxOutputTokens: 2000,
        abortSignal: controller.signal,
      },
    });
    const answer = parseAiAnswer(res.text ?? "", payload);
    if (!answer) return failure("format");
    return { ok: true, mock: false, answer };
  } catch (err) {
    return failure(classifyError(err));
  } finally {
    clearTimeout(timer);
  }
}
