import { failure } from "./errors";
import type { AskPayload } from "./payload";
import type { AskResult } from "./types";

// 브라우저에서 내 서버(/api/ask)에 질문을 보낸다. 실패해도 화면은 계속 쓸 수 있도록 예외를 던지지 않는다.
export async function askServer(payload: AskPayload, timeoutMs = 30_000): Promise<AskResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch("/api/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const data = (await res.json()) as AskResult;
    if (typeof data !== "object" || data === null || typeof data.ok !== "boolean") return failure("server");
    return data;
  } catch (err) {
    return failure((err as { name?: string })?.name === "AbortError" ? "timeout" : "network");
  } finally {
    clearTimeout(timer);
  }
}
