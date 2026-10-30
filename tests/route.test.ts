import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/ask/route";
import { buildAskPayload } from "@/lib/ai/payload";
import { ALL } from "@/lib/types";
import { loadCsvRows } from "./helpers";

const rows = loadCsvRows();
const filter = { month: "2026-09", region: ALL, projectType: ALL, siteId: ALL };
const post = (body: unknown) =>
  POST(new Request("http://localhost/api/ask", { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) }));

afterEach(() => vi.unstubAllEnvs());

describe("POST /api/ask (서버 입구)", () => {
  it("키가 없으면 AI 연결 실패(no_key)로 답하고 서버는 멈추지 않는다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "");
    vi.stubEnv("AI_MOCK", "");
    const res = await post(buildAskPayload("D가 늦어진 원인과 대응은?", rows, filter));
    const data = await res.json();
    expect(data.ok).toBe(false);
    expect(data.error.kind).toBe("no_key");
    expect(data.error.message).toContain("GEMINI_API_KEY");
  });

  it("AI_MOCK=1이면 '모의 응답'으로 표시되는 답변을 준다", async () => {
    vi.stubEnv("AI_MOCK", "1");
    const res = await post(buildAskPayload("D가 늦어진 원인과 대응은?", rows, filter));
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.mock).toBe(true);
    expect(data.answer.plannedResponses[0].text).toContain("주간");
  });

  it("형식이 틀린 요청·너무 긴 질문은 거부한다", async () => {
    vi.stubEnv("AI_MOCK", "1");
    expect((await post("{not json")).status).toBe(400);
    expect((await post({ question: "x" })).status).toBe(400);
    const long = { ...buildAskPayload("x", rows, filter), question: "가".repeat(501) };
    const res = await post(long);
    expect(res.status).toBe(400);
    expect((await res.json()).error.kind).toBe("bad_request");
  });

  it("응답 어디에도 키 값이 나오지 않는다", async () => {
    vi.stubEnv("GEMINI_API_KEY", "AIzaFAKE-KEY-FOR-TEST");
    vi.stubEnv("AI_MOCK", "1");
    const res = await post(buildAskPayload("D 원인은?", rows, filter));
    expect(JSON.stringify(await res.json())).not.toContain("AIzaFAKE-KEY-FOR-TEST");
  });
});
