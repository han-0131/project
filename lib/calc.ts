import { ALL, type Filter, type SiteMonthRow, type Status } from "./types";

// ---------- 기본 ----------

const key = (month: string, siteId: string) => `${month}|${siteId}`;

export type RowIndex = Map<string, SiteMonthRow>;

export function indexRows(rows: SiteMonthRow[]): RowIndex {
  const map: RowIndex = new Map();
  for (const r of rows) map.set(key(r.month, r.siteId), r);
  return map;
}

export function prevMonth(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 2, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthsOf(rows: SiteMonthRow[]): string[] {
  return [...new Set(rows.map((r) => r.month))].sort();
}

// 가장 늦은 월. 자료에 2026-09가 있으면 그 월이 처음 화면의 기준 월이다.
export function defaultMonth(rows: SiteMonthRow[]): string {
  const months = monthsOf(rows);
  if (months.includes("2026-09")) return "2026-09";
  return months[months.length - 1] ?? "";
}

// ---------- 현장 단위 ----------

// 공정차이 = 실제 - 계획 (pp). 부동소수점 오차를 없애려고 아주 작은 자리에서 정리한다.
export function computeGap(planned: number, actual: number): number {
  return Math.round((actual - planned) * 1e9) / 1e9;
}

export function statusOf(gap: number): Status {
  if (gap >= 0) return "정상";
  if (gap > -5) return "주의";
  return "점검";
}

export interface SiteMetrics {
  row: SiteMonthRow;
  progressRate: number; // 누적기성액 / 계약금액 × 100
  gap: number; // pp
  status: Status;
  monthlyEarned: number | null; // 당월 누적 - 전월 누적. 전월 없으면 null
}

export function siteMetrics(row: SiteMonthRow, index: RowIndex): SiteMetrics {
  const prev = index.get(key(prevMonth(row.month), row.siteId));
  const gap = computeGap(row.plannedProgress, row.actualProgress);
  return {
    row,
    progressRate: (row.cumulativeEarned / row.contractAmount) * 100,
    gap,
    status: statusOf(gap),
    monthlyEarned: prev ? row.cumulativeEarned - prev.cumulativeEarned : null,
  };
}

// 공정차이가 작은 순, 같으면 현장 ID 순
export function compareByGap(a: SiteMetrics, b: SiteMetrics): number {
  if (a.gap !== b.gap) return a.gap - b.gap;
  return a.row.siteId.localeCompare(b.row.siteId);
}

export function sortByGap(list: SiteMetrics[]): SiteMetrics[] {
  return [...list].sort(compareByGap);
}

// 점검 상태인 현장만, 점검 순서대로
export function rankInspection(list: SiteMetrics[]): SiteMetrics[] {
  return sortByGap(list.filter((m) => m.status === "점검"));
}

export function statusCounts(list: SiteMetrics[]): Record<Status, number> {
  const counts: Record<Status, number> = { 정상: 0, 주의: 0, 점검: 0 };
  for (const m of list) counts[m.status] += 1;
  return counts;
}

// ---------- 범위(필터) ----------

type ScopeFilter = Pick<Filter, "region" | "projectType" | "siteId">;

export function inScope(row: SiteMonthRow, f: ScopeFilter): boolean {
  return (
    (f.region === ALL || row.region === f.region) &&
    (f.projectType === ALL || row.projectType === f.projectType) &&
    (f.siteId === ALL || row.siteId === f.siteId)
  );
}

export function rowsFor(rows: SiteMonthRow[], f: Filter): SiteMonthRow[] {
  return rows.filter((r) => r.month === f.month && inScope(r, f));
}

// 현장 목록: 지역·유형 범위에 드는 현장 (월과 무관)
export function siteOptions(rows: SiteMonthRow[], region: string, projectType: string) {
  const map = new Map<string, string>();
  for (const r of rows) {
    if (inScope(r, { region, projectType, siteId: ALL }) && !map.has(r.siteId)) map.set(r.siteId, r.siteName);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([siteId, siteName]) => ({ siteId, siteName }));
}

export function distinct(rows: SiteMonthRow[], field: "region" | "projectType", order: readonly string[]): string[] {
  const set = new Set(rows.map((r) => r[field]));
  const known = order.filter((o) => set.has(o));
  const extra = [...set].filter((s) => !order.includes(s)).sort();
  return [...known, ...extra];
}

// 지역·유형을 바꿔 고른 현장이 범위에서 빠지면 현장을 전체로 되돌린다
export function normalizeFilter(rows: SiteMonthRow[], f: Filter): Filter {
  if (f.siteId === ALL) return f;
  const options = siteOptions(rows, f.region, f.projectType);
  return options.some((o) => o.siteId === f.siteId) ? f : { ...f, siteId: ALL };
}

// 선택 월에 행이 없는 현장 (월별 누락)
export function missingSites(rows: SiteMonthRow[], f: Filter): string[] {
  const expected = siteOptions(rows, f.region, f.projectType)
    .map((o) => o.siteId)
    .filter((id) => f.siteId === ALL || id === f.siteId);
  const present = new Set(rowsFor(rows, f).map((r) => r.siteId));
  return expected.filter((id) => !present.has(id));
}

// ---------- 범위 전체 집계 ----------

export interface Aggregate {
  count: number;
  contract: number | null;
  cumulative: number | null;
  progressRate: number | null;
  planned: number | null; // 계약금액 가중평균
  actual: number | null;
  gap: number | null; // 반올림 전 가중 실제 - 반올림 전 가중 계획
  monthlyEarned: number | null; // 모든 현장에 전월 값이 있을 때만
  counts: Record<Status, number>;
}

const EMPTY: Aggregate = {
  count: 0,
  contract: null,
  cumulative: null,
  progressRate: null,
  planned: null,
  actual: null,
  gap: null,
  monthlyEarned: null,
  counts: { 정상: 0, 주의: 0, 점검: 0 },
};

export function aggregate(scoped: SiteMonthRow[], index: RowIndex): Aggregate {
  if (scoped.length === 0) return { ...EMPTY, counts: { ...EMPTY.counts } };
  const metrics = scoped.map((r) => siteMetrics(r, index));
  const contract = scoped.reduce((s, r) => s + r.contractAmount, 0);
  const cumulative = scoped.reduce((s, r) => s + r.cumulativeEarned, 0);
  const planned = scoped.reduce((s, r) => s + r.contractAmount * r.plannedProgress, 0) / contract;
  const actual = scoped.reduce((s, r) => s + r.contractAmount * r.actualProgress, 0) / contract;
  const hasAllPrev = metrics.every((m) => m.monthlyEarned !== null);
  return {
    count: scoped.length,
    contract,
    cumulative,
    progressRate: contract > 0 ? (cumulative / contract) * 100 : null,
    planned: contract > 0 ? planned : null,
    actual: contract > 0 ? actual : null,
    gap: contract > 0 ? actual - planned : null,
    monthlyEarned: hasAllPrev ? metrics.reduce((s, m) => s + (m.monthlyEarned as number), 0) : null,
    counts: statusCounts(metrics),
  };
}

export interface TrendPoint extends Aggregate {
  month: string;
}

// 시작 월 ~ 선택 월까지, 같은 지역·유형·현장 필터로 매월 따로 집계
export function trend(rows: SiteMonthRow[], index: RowIndex, f: Filter): TrendPoint[] {
  return monthsOf(rows)
    .filter((m) => m <= f.month)
    .map((month) => ({ month, ...aggregate(rowsFor(rows, { ...f, month }), index) }));
}

// ---------- 화면에서 한 번에 쓰는 묶음 ----------

export interface Dashboard {
  scoped: SiteMonthRow[];
  metrics: SiteMetrics[]; // 공정차이 순
  inspection: SiteMetrics[];
  agg: Aggregate;
  trend: TrendPoint[];
  missing: string[];
}

export function buildDashboard(rows: SiteMonthRow[], f: Filter): Dashboard {
  const index = indexRows(rows);
  const scoped = rowsFor(rows, f);
  const metrics = sortByGap(scoped.map((r) => siteMetrics(r, index)));
  return {
    scoped,
    metrics,
    inspection: rankInspection(metrics),
    agg: aggregate(scoped, index),
    trend: trend(rows, index, f),
    missing: missingSites(rows, f),
  };
}
