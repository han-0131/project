import { afterEach, describe, expect, it, vi } from "vitest";
import { classifyError, ERROR_MESSAGE } from "@/lib/ai/errors";
import { mockAnswer } from "@/lib/ai/mock";
import { buildAskPayload, isTrendQuestion } from "@/lib/ai/payload";
import { buildUserPrompt, parseAiAnswer, SYSTEM_INSTRUCTION } from "@/lib/ai/prompt";
import { shouldAcceptResponse } from "@/lib/ai/range";
import { resolveCitations } from "@/lib/ai/resolve";
import { ALL, type Filter } from "@/lib/types";
import { loadCsvRows } from "./helpers";

const rows = loadCsvRows();
const f = (over: Partial<Filter> = {}): Filter => ({ month: "2026-09", region: ALL, projectType: ALL, siteId: ALL, ...over });

describe("AI에 보내는 자료 만들기", () => {
  it("점검 현장 질문: 선택 월 12행 원문 + 계산값, 월별 요약은 보내지 않는다", () => {
    const p = buildAskPayload("9월 점검 현장은?", rows, f());
    expect(p.records).toHaveLength(12);
    expect(p.computed).toHaveLength(12);
    expect(p.monthlySummary).toBeUndefined();
    expect(p.siteHistory).toBeUndefined();
    expect(p.range.monthsCovered).toEqual(["2026-09"]);
    expect(p.summary.progressRate).toBe(67.2);
    expect(p.summary.counts).toEqual({ 정상: 6, 주의: 3, 점검: 3 });
    expect(p.computed.find((c) => c.siteId === "D")).toMatchObject({ gap: -10.7, status: "점검", progressRate: 69.4 });
  });

  it("추이 질문: 같은 필터의 시작 월~선택 월 월별 요약을 함께 보낸다", () => {
    const p = buildAskPayload("전체적으로 회복되고 있나요?", rows, f());
    expect(isTrendQuestion("회복 중인가?")).toBe(true);
    expect(p.monthlySummary).toHaveLength(12);
    expect(p.monthlySummary![0].monthlyEarned).toBeNull();
    expect(p.monthlySummary![11]).toMatchObject({ month: "2026-09", gap: -2.0, monthlyEarned: 28878.7 });
    expect(p.range.monthsCovered).toHaveLength(12);
  });

  it("D만 선택하고 추이를 물으면 D의 월별 기록(원문)도 보낸다: 8월 -11.2 → 9월 -10.7", () => {
    const p = buildAskPayload("D 회복 중인가?", rows, f({ siteId: "D" }));
    expect(p.records).toHaveLength(1);
    expect(p.siteHistory).toHaveLength(12);
    const aug = p.monthlySummary!.find((m) => m.month === "2026-08")!;
    const sep = p.monthlySummary!.find((m) => m.month === "2026-09")!;
    expect([aug.gap, sep.gap]).toEqual([-11.2, -10.7]);
  });

  it("J의 7월 질문: 7월 원문 기록이 함께 간다", () => {
    const p = buildAskPayload("7월 기성이 왜 늘지 않았나?", rows, f({ month: "2026-07", siteId: "J" }));
    const jul = p.siteHistory!.find((r) => r.month === "2026-07")!;
    expect(jul.issueSummary).toContain("기성");
    expect(p.computed[0].monthlyEarned).toBe(0);
  });

  it("범위 밖 월·현장 자료는 담지 않는다", () => {
    const p = buildAskPayload("현황?", rows, f({ month: "2026-07", siteId: "D" }));
    expect(p.records.map((r) => `${r.month}|${r.siteId}`)).toEqual(["2026-07|D"]);
    const t = buildAskPayload("추이는?", rows, f({ month: "2026-07", siteId: "D" }));
    expect(t.siteHistory!.every((r) => r.month <= "2026-07")).toBe(true);
    expect(t.monthlySummary).toHaveLength(10);
  });

  it("지시문과 프롬프트에서 원문 기록과 계산값이 서로 다른 구역이다", () => {
    const prompt = buildUserPrompt(buildAskPayload("D 원인은?", rows, f()));
    expect(prompt).toContain("[프로그램 계산값");
    expect(prompt).toContain("[원문 기록");
    expect(prompt.indexOf("[프로그램 계산값")).toBeLessThan(prompt.indexOf("[원문 기록"));
    // 계산값 구역에는 상태가, 원문 구역에는 issueSummary가 있다
    const calcPart = prompt.slice(prompt.indexOf("[프로그램 계산값"), prompt.indexOf("[원문 기록"));
    const rawPart = prompt.slice(prompt.indexOf("[원문 기록"));
    expect(calcPart).toContain('"status":"점검"');
    expect(calcPart).not.toContain("issueSummary");
    expect(rawPart).toContain("issueSummary");
    expect(rawPart).not.toContain('"status"');
  });

  it("지시문이 핵심 규칙을 담고 있다", () => {
    expect(SYSTEM_INSTRUCTION).toContain("계산하지 않는다");
    expect(SYSTEM_INSTRUCTION).toContain("기록된 상황");
    expect(SYSTEM_INSTRUCTION).toContain("계획된 대응");
    expect(SYSTEM_INSTRUCTION).toContain("자료 없음");
    expect(SYSTEM_INSTRUCTION).toContain("계약상 준공일");
  });

  it("보내는 자료에 키 값이 들어가지 않는다", () => {
    vi.stubEnv("GEMINI_API_KEY", "AIzaFAKE-KEY-FOR-TEST");
    const json = JSON.stringify(buildAskPayload("D 원인은?", rows, f())) + buildUserPrompt(buildAskPayload("x", rows, f()));
    expect(json).not.toContain("AIzaFAKE-KEY-FOR-TEST");
    expect(SYSTEM_INSTRUCTION).not.toContain("AIzaFAKE-KEY-FOR-TEST");
    vi.unstubAllEnvs();
  });
});

describe("AI 답변 검사", () => {
  const payload = buildAskPayload("D가 늦어진 원인과 대응은?", rows, f());
  const good = {
    summary: "D의 기록은 공급 정상화 후에도 지연이 남아 있다고 되어 있습니다.",
    recordedSituations: [{ siteId: "D", month: "2026-09", text: "공급 정상화 후 작업면 추가 운영" }],
    plannedResponses: [{ siteId: "D", month: "2026-09", text: "주간 단위로 확인" }],
    notInData: [],
    citations: [{ month: "2026-09", siteId: "D", fields: ["issueSummary", "actionPlan", "아무거나"] }],
  };

  it("올바른 JSON은 받아들이고 알 수 없는 필드 이름은 뺀다", () => {
    const a = parseAiAnswer(JSON.stringify(good), payload)!;
    expect(a.summary).toContain("지연");
    expect(a.citations[0].fields).toEqual(["issueSummary", "actionPlan"]);
  });

  it("코드 블록으로 감싼 JSON도 읽는다", () => {
    expect(parseAiAnswer("```json\n" + JSON.stringify(good) + "\n```", payload)).not.toBeNull();
  });

  it("전달하지 않은 월·현장을 인용한 항목은 버린다", () => {
    const bad = {
      ...good,
      recordedSituations: [...good.recordedSituations, { siteId: "Z", month: "2026-09", text: "없는 현장" }, { siteId: "D", month: "2025-01", text: "없는 월" }],
      citations: [...good.citations, { month: "2026-09", siteId: "Q", fields: [] }, { month: "2024-01", siteId: "D", fields: [] }],
    };
    const a = parseAiAnswer(JSON.stringify(bad), payload)!;
    expect(a.recordedSituations).toHaveLength(1);
    expect(a.citations).toHaveLength(1);
  });

  it("형식이 틀리면 null이다", () => {
    expect(parseAiAnswer("안녕하세요", payload)).toBeNull();
    expect(parseAiAnswer(JSON.stringify({ summary: "" }), payload)).toBeNull();
    expect(parseAiAnswer("[]", payload)).toBeNull();
  });

  it("근거 숫자는 AI가 아니라 프로그램 계산값으로 채운다 (D: 86.5 · 75.8 · -10.7 · 69.4)", () => {
    const a = parseAiAnswer(JSON.stringify(good), payload)!;
    const { resolved, dropped } = resolveCitations(rows, f(), a);
    expect(dropped).toBe(0);
    expect(resolved[0]).toMatchObject({ month: "2026-09", siteId: "D", planned: 86.5, actual: 75.8, status: "점검" });
    expect(Math.round(resolved[0].gap! * 10) / 10).toBe(-10.7);
    expect(Math.round(resolved[0].progressRate! * 10) / 10).toBe(69.4);
  });

  it("현재 범위 밖의 근거는 표시하지 않고 센다", () => {
    const a = { summary: "x", recordedSituations: [], plannedResponses: [], notInData: [], citations: [{ month: "2026-09", siteId: "D", fields: [] }, { month: "2026-09", siteId: "A", fields: [] }] };
    const { resolved, dropped } = resolveCitations(rows, f({ month: "2026-09", siteId: "A" }), a);
    expect(resolved.map((r) => r.siteId)).toEqual(["A"]);
    expect(dropped).toBe(1);
    const later = resolveCitations(rows, f({ month: "2026-07" }), a);
    expect(later.resolved).toHaveLength(0);
    expect(later.dropped).toBe(2);
  });

  it("월별 요약을 인용하면(siteId 전체) 범위 전체 숫자가 붙는다", () => {
    const a = { summary: "x", recordedSituations: [], plannedResponses: [], notInData: [], citations: [{ month: "2026-08", siteId: "전체", fields: ["monthlySummary"] }] };
    const { resolved } = resolveCitations(rows, f(), a);
    expect(resolved[0].label).toContain("12개 현장");
    expect(Math.round(resolved[0].progressRate! * 10) / 10).toBe(62.7);
  });
});

describe("모의 응답 (실제 AI 호출이 아님)", () => {
  it("'D가 늦어진 원인과 대응은?' → 기록대로 설명: 공급 정상화 후 남은 지연 · 주간 확인", () => {
    const a = mockAnswer(buildAskPayload("D가 늦어진 원인과 대응은?", rows, f()));
    const dRow = rows.find((r) => r.month === "2026-09" && r.siteId === "D")!;
    expect(a.recordedSituations[0]).toMatchObject({ siteId: "D", text: dRow.issueSummary });
    expect(a.recordedSituations[0].text).toContain("공급 정상화");
    expect(a.recordedSituations[0].text).toContain("지연이 남아 있음");
    expect(a.plannedResponses[0].text).toContain("주간");
    expect(a.summary).toContain("확정하거나 완료된 것으로 보지 않습니다");
  });

  it("'실제 준공일·미수금은?' → 자료 없음, 계약상 준공일과 실제 완료일 구분", () => {
    const a = mockAnswer(buildAskPayload("실제 준공일·미수금은?", rows, f()));
    expect(a.notInData.join(" ")).toContain("실제 준공일");
    expect(a.notInData.join(" ")).toContain("미수금");
    expect(a.summary).toContain("자료 없음");
    expect(a.summary).toContain("계약상 준공일");
    expect(a.recordedSituations).toHaveLength(0);
  });

  it("'점검 현장은?' → D → I → K", () => {
    const a = mockAnswer(buildAskPayload("점검 현장은 어디인가요?", rows, f()));
    expect(a.summary).toContain("D → I → K");
    expect(a.citations.map((c) => c.siteId)).toEqual(["D", "I", "K"]);
  });
});

describe("AI 실패와 오래된 응답", () => {
  it("오류 종류를 나눈다", () => {
    expect(classifyError({ name: "AbortError" })).toBe("timeout");
    expect(classifyError({ status: 429, message: "x" })).toBe("quota");
    expect(classifyError({ message: "RESOURCE_EXHAUSTED" })).toBe("quota");
    expect(classifyError({ status: 400, message: "API key not valid. Please pass a valid API key." })).toBe("bad_key");
    expect(classifyError({ status: 403 })).toBe("bad_key");
    expect(classifyError(new Error("fetch failed"))).toBe("network");
    expect(classifyError(new Error("???"))).toBe("server");
  });

  it("사용자에게 보이는 오류 문구에는 키 값이나 원래 오류 문구가 없다", () => {
    for (const msg of Object.values(ERROR_MESSAGE)) {
      expect(msg).not.toMatch(/AIza/);
      expect(msg.length).toBeGreaterThan(5);
    }
  });

  it("범위가 바뀐 뒤 도착한 응답은 받아들이지 않는다", () => {
    expect(shouldAcceptResponse("2026-09|전체|전체|전체", "2026-09|전체|전체|전체")).toBe(true);
    expect(shouldAcceptResponse("2026-08|전체|전체|전체", "2026-09|전체|전체|전체")).toBe(false);
  });
});

afterEach(() => vi.unstubAllEnvs());
