import type { AiErrorKind } from "./types";

// 사용자에게 보여 주는 쉬운 말. 원래 오류 문구(키가 들어갈 수 있음)는 그대로 내보내지 않는다.
export const ERROR_MESSAGE: Record<AiErrorKind, string> = {
  no_key: "AI 키가 설정되지 않았습니다. .env.local의 GEMINI_API_KEY를 확인하세요.",
  bad_key: "AI 키가 올바르지 않거나 사용 권한이 없습니다. .env.local의 키를 확인하세요.",
  quota: "AI 사용 한도를 넘었습니다. 잠시 뒤에 다시 시도하세요.",
  timeout: "AI 응답이 너무 오래 걸려 중단했습니다.",
  network: "AI 서버에 연결하지 못했습니다. 인터넷 연결을 확인하세요.",
  format: "AI 응답의 형식이 올바르지 않아 표시하지 않았습니다.",
  bad_request: "질문이나 범위 자료의 형식이 올바르지 않습니다.",
  server: "AI 호출 중 문제가 생겼습니다.",
};

export function failure(kind: AiErrorKind) {
  return { ok: false as const, error: { kind, message: ERROR_MESSAGE[kind] } };
}

// Gemini 호출에서 나온 오류를 종류로 나눈다
export function classifyError(err: unknown): AiErrorKind {
  const e = err as { name?: string; status?: number; code?: number | string; message?: string; cause?: { code?: string } } | null;
  const msg = String(e?.message ?? "");
  const status = typeof e?.status === "number" ? e.status : typeof e?.code === "number" ? e.code : undefined;
  if (e?.name === "AbortError" || e?.name === "TimeoutError" || /abort|timed? ?out/i.test(msg)) return "timeout";
  if (status === 429 || /RESOURCE_EXHAUSTED|quota|rate limit/i.test(msg)) return "quota";
  if (status === 401 || status === 403 || /API key|PERMISSION_DENIED|UNAUTHENTICATED/i.test(msg)) return "bad_key";
  if (/fetch failed|ENOTFOUND|ECONNRESET|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|network/i.test(msg) || e?.cause?.code === "ENOTFOUND") return "network";
  return "server";
}
