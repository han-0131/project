import { aggregate, indexRows, inScope, rowsFor, siteMetrics } from "../calc";
import { ALL, type Filter, type SiteMonthRow, type Status } from "../types";
import type { AiAnswer } from "./types";

// 답변 아래에 붙는 "근거 숫자". AI의 글이 아니라 프로그램이 계산한 값이다.
export interface ResolvedCitation {
  month: string;
  siteId: string; // 현장 ID 또는 "전체"
  label: string;
  planned: number | null;
  actual: number | null;
  gap: number | null;
  progressRate: number | null;
  status: Status | null; // 현장 인용일 때만
  fields: string[];
}

// 현재 범위(선택 월까지)에 있는 월·현장만 근거로 인정한다. 그 밖의 인용은 버리고 개수를 센다.
export function resolveCitations(rows: SiteMonthRow[], filter: Filter, answer: AiAnswer): { resolved: ResolvedCitation[]; dropped: number } {
  const index = indexRows(rows);
  const resolved: ResolvedCitation[] = [];
  let dropped = 0;
  const seen = new Set<string>();

  for (const c of answer.citations) {
    const dedupe = `${c.month}|${c.siteId}|${c.fields.join(",")}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    if (c.month > filter.month) {
      dropped += 1;
      continue;
    }

    if (c.siteId === "전체") {
      const scoped = rowsFor(rows, { ...filter, month: c.month });
      if (scoped.length === 0) {
        dropped += 1;
        continue;
      }
      const agg = aggregate(scoped, index);
      resolved.push({
        month: c.month,
        siteId: "전체",
        label: `선택 범위 전체 (${scoped.length}개 현장)`,
        planned: agg.planned,
        actual: agg.actual,
        gap: agg.gap,
        progressRate: agg.progressRate,
        status: null,
        fields: c.fields,
      });
      continue;
    }

    const row = rows.find((r) => r.month === c.month && r.siteId === c.siteId);
    if (!row || !inScope(row, { region: filter.region, projectType: filter.projectType, siteId: filter.siteId === ALL ? ALL : filter.siteId })) {
      dropped += 1;
      continue;
    }
    const m = siteMetrics(row, index);
    resolved.push({
      month: row.month,
      siteId: row.siteId,
      label: `${row.siteId} ${row.siteName}`,
      planned: row.plannedProgress,
      actual: row.actualProgress,
      gap: m.gap,
      progressRate: m.progressRate,
      status: m.status,
      fields: c.fields,
    });
  }
  return { resolved, dropped };
}
