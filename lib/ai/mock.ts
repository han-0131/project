import type { AskPayload } from "./payload";
import type { AiAnswer } from "./types";

// AI_MOCK=1일 때 쓰는 모의 응답. 실제 AI 호출이 아니다. 전달된 자료의 기록을 그대로 옮겨 적는다.
export function mockAnswer(payload: AskPayload): AiAnswer {
  const q = payload.question;
  const month = payload.range.month;

  if (/준공|미수금|수금|청구|완료일/.test(q)) {
    const first = payload.records[0];
    return {
      summary:
        "실제 준공일과 미수금은 전달된 자료에 없습니다 (자료 없음). 자료의 contractEndDate는 계약상 준공일이며 실제 완료일이나 예측이 아닙니다. 누적기성액도 수금액이 아닙니다.",
      recordedSituations: [],
      plannedResponses: [],
      notInData: ["실제 준공일", "미수금·수금액"],
      citations: first ? [{ month: first.month, siteId: first.siteId, fields: ["contractEndDate"] }] : [],
    };
  }

  const mentioned = [...q.matchAll(/[A-L](?![A-Za-z])/g)].map((m) => m[0]).find((id) => payload.records.some((r) => r.siteId === id));

  if (!mentioned && /점검|순위|늦은|지연/.test(q)) {
    const worst = payload.computed.filter((c) => c.status === "점검").sort((a, b) => a.gap - b.gap || a.siteId.localeCompare(b.siteId));
    if (worst.length === 0) {
      return { summary: `${month} 범위에는 점검 상태(공정차이 −5.0pp 이하)인 현장이 없습니다.`, recordedSituations: [], plannedResponses: [], notInData: [], citations: [] };
    }
    const rows = worst.map((w) => payload.records.find((r) => r.siteId === w.siteId)!);
    return {
      summary: `${month} 점검 상태 현장은 ${worst.map((w) => w.siteId).join(" → ")} 순서입니다 (공정차이가 작은 순). 순서와 상태는 프로그램이 계산한 값입니다.`,
      recordedSituations: rows.map((r) => ({ siteId: r.siteId, month: r.month, text: r.issueSummary })),
      plannedResponses: rows.map((r) => ({ siteId: r.siteId, month: r.month, text: r.actionPlan })),
      notInData: [],
      citations: rows.map((r) => ({ month: r.month, siteId: r.siteId, fields: ["issueSummary", "actionPlan"] })),
    };
  }

  const target = payload.records.find((r) => r.siteId === mentioned) ?? payload.records[0];
  if (!target) {
    return { summary: "전달된 범위에 현장 자료가 없어 답할 수 없습니다 (자료 없음).", recordedSituations: [], plannedResponses: [], notInData: [], citations: [] };
  }
  return {
    summary: `${target.siteId} 현장의 ${target.month} 기록에 따르면 아래와 같은 상황이 기록되어 있고, 대응은 계획으로 기록되어 있습니다. 원인을 확정하거나 완료된 것으로 보지 않습니다.`,
    recordedSituations: [{ siteId: target.siteId, month: target.month, text: target.issueSummary }],
    plannedResponses: [{ siteId: target.siteId, month: target.month, text: target.actionPlan }],
    notInData: [],
    citations: [{ month: target.month, siteId: target.siteId, fields: ["issueSummary", "actionPlan"] }],
  };
}
