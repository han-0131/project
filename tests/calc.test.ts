import { describe, expect, it } from "vitest";
import {
  buildDashboard,
  computeGap,
  indexRows,
  normalizeFilter,
  prevMonth,
  rankInspection,
  siteMetrics,
  siteOptions,
  statusOf,
} from "@/lib/calc";
import { ALL, type Filter } from "@/lib/types";
import { fmtContract, fmtMoney, fmtPercent, fmtPp, roundHalfUp } from "@/lib/format";
import { loadCsvRows } from "./helpers";

const rows = loadCsvRows();
const all = (month: string): Filter => ({ month, region: ALL, projectType: ALL, siteId: ALL });
const r1 = (n: number | null) => (n == null ? null : roundHalfUp(n, 1));

// data/검산표.md "월별 전체 현장"
const MONTHLY: [string, number, number, number, number, number, number, number | null, number, number, number][] = [
  // 월, 계약, 누적, 기성률, 계획, 실제, 차이, 당월, 정상, 주의, 점검
  ["2025-10", 630700, 105449.7, 16.7, 19.4, 19.6, 0.2, null, 10, 2, 0],
  ["2025-11", 630700, 125857.8, 20.0, 22.8, 23.2, 0.3, 20408.1, 10, 2, 0],
  ["2025-12", 630700, 148530.2, 23.6, 26.9, 27.0, 0.2, 22672.4, 9, 3, 0],
  ["2026-01", 630700, 173599.9, 27.5, 31.4, 31.3, -0.1, 25069.7, 9, 3, 0],
  ["2026-02", 630700, 202848.9, 32.2, 36.7, 36.2, -0.4, 29249.0, 8, 4, 0],
  ["2026-03", 630700, 233981.1, 37.1, 42.4, 41.6, -0.8, 31132.2, 8, 3, 1],
  ["2026-04", 630700, 266640.0, 42.3, 48.6, 47.1, -1.5, 32658.9, 8, 2, 2],
  ["2026-05", 630700, 300878.0, 47.7, 54.8, 52.9, -1.9, 34238.0, 8, 1, 3],
  ["2026-06", 630700, 335344.9, 53.2, 60.7, 58.3, -2.4, 34466.9, 7, 2, 3],
  ["2026-07", 630700, 364718.5, 57.8, 65.8, 63.2, -2.6, 29373.6, 6, 2, 4],
  ["2026-08", 630700, 395184.7, 62.7, 69.9, 67.6, -2.3, 30466.2, 6, 2, 4],
  ["2026-09", 630700, 424063.4, 67.2, 73.2, 71.2, -2.0, 28878.7, 6, 3, 3],
];

describe("월별 전체 현장 (검산표)", () => {
  it("자료는 144행이다", () => {
    expect(rows).toHaveLength(144);
  });

  it.each(MONTHLY)("%s 전체 숫자가 검산표와 같다", (month, contract, cum, rate, plan, act, gap, monthly, n, c, k) => {
    const { agg } = buildDashboard(rows, all(month));
    expect(agg.count).toBe(12);
    expect(agg.contract).toBe(contract);
    expect(r1(agg.cumulative)).toBe(cum);
    expect(r1(agg.progressRate)).toBe(rate);
    expect(r1(agg.planned)).toBe(plan);
    expect(r1(agg.actual)).toBe(act);
    expect(r1(agg.gap)).toBe(gap);
    expect(r1(agg.monthlyEarned)).toBe(monthly);
    expect(agg.counts).toEqual({ 정상: n, 주의: c, 점검: k });
  });

  it("화면 표시 형식: 67.2% · -2.0pp · 424,063.4", () => {
    const { agg } = buildDashboard(rows, all("2026-09"));
    expect(fmtPercent(agg.progressRate)).toBe("67.2%");
    expect(fmtPp(agg.gap)).toBe("-2.0pp");
    expect(fmtMoney(agg.cumulative)).toBe("424,063.4");
    expect(fmtMoney(agg.monthlyEarned)).toBe("28,878.7");
    expect(fmtContract(agg.contract)).toBe("630,700"); // 계약금액은 정수 그대로
  });
});

// data/검산표.md "2026-09 현장별"
const SITES_SEP: [string, number, number, number, number, number, number, string][] = [
  // ID, 계획, 실제, 차이, 누적기성액, 기성률, 당월, 상태
  ["A", 75.4, 77.1, 1.7, 63763.2, 73.8, 4665.6, "정상"],
  ["B", 80.3, 82.1, 1.8, 41395.2, 78.4, 3854.4, "정상"],
  ["C", 94.8, 96.2, 1.4, 41040.0, 95.0, 1166.4, "정상"],
  ["D", 86.5, 75.8, -10.7, 50384.4, 69.4, 3339.6, "점검"],
  ["E", 99.4, 99.7, 0.3, 18635.4, 98.6, 302.4, "정상"],
  ["F", 68.7, 65.3, -3.4, 22082.5, 60.5, 2117.0, "주의"],
  ["G", 52.8, 54.4, 1.6, 49448.7, 50.1, 3849.3, "정상"],
  ["H", 31.2, 29.4, -1.8, 11369.6, 27.2, 543.4, "주의"],
  ["I", 73.2, 65.6, -7.6, 34963.2, 60.7, 3052.8, "점검"],
  ["J", 95.8, 95.0, -0.8, 30034.8, 92.7, 1393.2, "주의"],
  ["K", 71.0, 65.6, -5.4, 39446.0, 60.5, 3586.0, "점검"],
  ["L", 88.1, 90.3, 2.2, 21500.4, 87.4, 1008.6, "정상"],
];

describe("2026-09 현장별 (검산표)", () => {
  const index = indexRows(rows);
  it.each(SITES_SEP)("%s 현장", (id, plan, act, gap, cum, rate, monthly, status) => {
    const row = rows.find((r) => r.month === "2026-09" && r.siteId === id)!;
    const m = siteMetrics(row, index);
    expect(row.plannedProgress).toBe(plan);
    expect(row.actualProgress).toBe(act);
    expect(r1(m.gap)).toBe(gap);
    expect(r1(row.cumulativeEarned)).toBe(cum);
    expect(r1(m.progressRate)).toBe(rate);
    expect(r1(m.monthlyEarned)).toBe(monthly);
    expect(m.status).toBe(status);
  });

  it("점검 순서는 D(-10.7) → I(-7.6) → K(-5.4)", () => {
    const { inspection } = buildDashboard(rows, all("2026-09"));
    expect(inspection.map((m) => m.row.siteId)).toEqual(["D", "I", "K"]);
    expect(inspection.map((m) => r1(m.gap))).toEqual([-10.7, -7.6, -5.4]);
  });

  it("공정차이가 같으면 현장 ID 순으로 정렬한다", () => {
    const make = (siteId: string, gap: number) => ({ row: { siteId } as never, gap, status: "점검" as const, progressRate: 0, monthlyEarned: 0 });
    const ranked = rankInspection([make("K", -6), make("B", -6), make("A", -9)]);
    expect(ranked.map((m) => m.row.siteId)).toEqual(["A", "B", "K"]);
  });
});

describe("상태 판정 경계", () => {
  it("계획 70 · 실제 70 / 65.1 / 65 → 정상 / 주의 / 점검", () => {
    expect(statusOf(computeGap(70, 70))).toBe("정상");
    expect(statusOf(computeGap(70, 65.1))).toBe("주의");
    expect(statusOf(computeGap(70, 65))).toBe("점검");
    expect(computeGap(70, 65.1)).toBe(-4.9);
    expect(computeGap(70, 65)).toBe(-5);
  });
  it("0pp는 정상, -0.1pp는 주의", () => {
    expect(statusOf(0)).toBe("정상");
    expect(statusOf(computeGap(10.2, 10.1))).toBe("주의");
  });
});

describe("당월기성액: 첫 달·0·전월", () => {
  it("전월 문자열 계산", () => {
    expect(prevMonth("2026-01")).toBe("2025-12");
    expect(prevMonth("2025-10")).toBe("2025-09");
  });

  it("2025-10 전체와 각 현장의 당월기성액은 null (0이나 누적값으로 대신하지 않음)", () => {
    const d = buildDashboard(rows, all("2025-10"));
    expect(d.agg.monthlyEarned).toBeNull();
    expect(d.agg.cumulative).not.toBeNull();
    for (const m of d.metrics) expect(m.monthlyEarned).toBeNull();
    expect(fmtMoney(d.agg.monthlyEarned)).toBe("계산 불가");
  });

  it("J의 7월 당월기성액 0.0은 계산된 값이다 (null이 아님)", () => {
    const d = buildDashboard(rows, { month: "2026-07", region: ALL, projectType: ALL, siteId: "J" });
    expect(d.metrics).toHaveLength(1);
    expect(d.metrics[0].monthlyEarned).toBe(0);
    expect(d.metrics[0].row.issueSummary).toContain("기성");
  });

  it("D의 8월 -11.2pp → 9월 -10.7pp (0.5pp 축소)", () => {
    const aug = buildDashboard(rows, { month: "2026-08", region: ALL, projectType: ALL, siteId: "D" });
    const sep = buildDashboard(rows, { month: "2026-09", region: ALL, projectType: ALL, siteId: "D" });
    expect(r1(aug.metrics[0].gap)).toBe(-11.2);
    expect(r1(sep.metrics[0].gap)).toBe(-10.7);
  });
});

describe("필터와 추이", () => {
  it("9월 전체: 비교표 12행, 추이 12개월 / 7월: 10개월 / 2025-10: 1개월", () => {
    expect(buildDashboard(rows, all("2026-09")).metrics).toHaveLength(12);
    expect(buildDashboard(rows, all("2026-09")).trend).toHaveLength(12);
    expect(buildDashboard(rows, all("2026-07")).trend).toHaveLength(10);
    expect(buildDashboard(rows, all("2025-10")).trend).toHaveLength(1);
  });

  it("추이의 첫 달 당월기성액은 null, 이후는 값이 있다", () => {
    const t = buildDashboard(rows, all("2026-09")).trend;
    expect(t[0].monthlyEarned).toBeNull();
    expect(r1(t[11].monthlyEarned)).toBe(28878.7);
    expect(r1(t[10].progressRate)).toBe(62.7);
  });

  it("인천 지역: 2곳, 기성률 61.2%", () => {
    const d = buildDashboard(rows, { ...all("2026-09"), region: "인천" });
    expect(d.agg.count).toBe(2);
    expect(d.agg.contract).toBe(185100);
    expect(r1(d.agg.cumulative)).toBe(113211.9);
    expect(r1(d.agg.progressRate)).toBe(61.2);
  });

  it("인천·공동주택: A·G 2곳", () => {
    const d = buildDashboard(rows, { ...all("2026-09"), region: "인천", projectType: "공동주택" });
    expect(d.metrics.map((m) => m.row.siteId).sort()).toEqual(["A", "G"]);
  });

  it("D만 선택하면 1행, 기성률 69.4%", () => {
    const d = buildDashboard(rows, { ...all("2026-09"), siteId: "D" });
    expect(d.metrics).toHaveLength(1);
    expect(r1(d.metrics[0].progressRate)).toBe(69.4);
  });

  it("지역을 바꿔 선택 현장이 범위에서 빠지면 현장을 전체로 되돌린다", () => {
    const f: Filter = { month: "2026-09", region: "인천", projectType: ALL, siteId: "D" };
    expect(normalizeFilter(rows, f).siteId).toBe(ALL);
    expect(normalizeFilter(rows, { ...f, siteId: "A" }).siteId).toBe("A");
  });

  it("현장 목록은 지역·유형 범위의 현장만 보인다", () => {
    expect(siteOptions(rows, "인천", ALL).map((o) => o.siteId)).toEqual(["A", "G"]);
    expect(siteOptions(rows, ALL, ALL)).toHaveLength(12);
  });

  it("선택 범위에 자료가 없으면 계산 불가이고 0%가 아니다", () => {
    const d = buildDashboard(rows, { month: "2026-09", region: "인천", projectType: "생산시설", siteId: ALL });
    expect(d.agg.count).toBe(0);
    expect(d.agg.progressRate).toBeNull();
    expect(fmtPercent(d.agg.progressRate)).toBe("계산 불가");
    expect(d.inspection).toHaveLength(0);
  });

  it("월별 누락은 확인 가능한 행만 집계하고 누락 현장을 알려 준다", () => {
    const partial = rows.filter((r) => !(r.month === "2026-09" && r.siteId === "A"));
    const d = buildDashboard(partial, all("2026-09"));
    expect(d.agg.count).toBe(11);
    expect(d.missing).toEqual(["A"]);
  });
});
