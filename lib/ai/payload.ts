import { buildDashboard, monthsOf } from "../calc";
import { roundHalfUp } from "../format";
import { ALL, type Filter, type SiteMonthRow } from "../types";

export const MAX_QUESTION_LENGTH = 500;

// 서버로 보내는 자료. 원문 기록(records·siteHistory)과 프로그램이 계산한 값(computed·summary·monthlySummary)을 따로 담는다.
export interface AskPayload {
  question: string;
  range: {
    month: string;
    region: string;
    projectType: string;
    siteId: string;
    siteCount: number;
    monthsCovered: string[]; // 전달한 월 범위 (시작 월 ~ 선택 월)
  };
  records: SiteMonthRow[]; // 원문: 선택 월의 현장 행
  computed: { siteId: string; month: string; progressRate: number; gap: number; status: string; monthlyEarned: number | null }[];
  summary: {
    progressRate: number | null;
    planned: number | null;
    actual: number | null;
    gap: number | null;
    monthlyEarned: number | null;
    counts: { 정상: number; 주의: number; 점검: number };
  };
  monthlySummary?: { month: string; planned: number | null; actual: number | null; gap: number | null; progressRate: number | null; monthlyEarned: number | null }[];
  siteHistory?: SiteMonthRow[]; // 원문: 한 현장을 골랐을 때 그 현장의 월별 기록
}

// 월 표기("9월")만으로는 추이 질문으로 보지 않는다. 변화를 묻는 말이 있어야 한다.
const TREND_WORDS = /추이|추세|변화|회복|악화|개선|월별|지난|이전|전월|최근|개월|줄어|늘어|늘지|증가|감소|좁혀|벌어|나아|따라잡/;

export function isTrendQuestion(question: string): boolean {
  return TREND_WORDS.test(question);
}

const r1 = (n: number | null): number | null => (n == null ? null : roundHalfUp(n, 1));

export function buildAskPayload(question: string, rows: SiteMonthRow[], filter: Filter): AskPayload {
  const d = buildDashboard(rows, filter);
  const trendNeeded = isTrendQuestion(question);
  const months = monthsOf(rows).filter((m) => m <= filter.month);

  const payload: AskPayload = {
    question: question.trim(),
    range: {
      month: filter.month,
      region: filter.region,
      projectType: filter.projectType,
      siteId: filter.siteId,
      siteCount: d.scoped.length,
      monthsCovered: trendNeeded ? months : [filter.month],
    },
    records: d.scoped,
    computed: d.metrics.map((m) => ({
      siteId: m.row.siteId,
      month: m.row.month,
      progressRate: roundHalfUp(m.progressRate, 1),
      gap: roundHalfUp(m.gap, 1),
      status: m.status,
      monthlyEarned: r1(m.monthlyEarned),
    })),
    summary: {
      progressRate: r1(d.agg.progressRate),
      planned: r1(d.agg.planned),
      actual: r1(d.agg.actual),
      gap: r1(d.agg.gap),
      monthlyEarned: r1(d.agg.monthlyEarned),
      counts: d.agg.counts,
    },
  };

  if (trendNeeded) {
    payload.monthlySummary = d.trend.map((p) => ({
      month: p.month,
      planned: r1(p.planned),
      actual: r1(p.actual),
      gap: r1(p.gap),
      progressRate: r1(p.progressRate),
      monthlyEarned: r1(p.monthlyEarned),
    }));
    // 한 현장을 골랐다면 그 현장의 월별 기록(원문)도 함께 보낸다
    if (filter.siteId !== ALL) {
      payload.siteHistory = rows.filter((r) => r.siteId === filter.siteId && r.month <= filter.month).sort((a, b) => a.month.localeCompare(b.month));
    }
  }
  return payload;
}

// 질문에 인용할 수 있는 (월, 현장) 목록: 서버가 AI의 인용을 걸러 낼 때 쓴다
export function allowedCitationKeys(payload: AskPayload): Set<string> {
  const keys = new Set<string>();
  for (const r of payload.records) keys.add(`${r.month}|${r.siteId}`);
  for (const r of payload.siteHistory ?? []) keys.add(`${r.month}|${r.siteId}`);
  for (const m of payload.range.monthsCovered) keys.add(`${m}|전체`);
  return keys;
}
