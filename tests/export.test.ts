import Papa from "papaparse";
import { describe, expect, it } from "vitest";
import { buildDashboard } from "@/lib/calc";
import { buildCsv, describeRange, EXPORT_HEADERS, exportFileName } from "@/lib/exportCsv";
import { ALL, FIELD_NAMES, type Filter } from "@/lib/types";
import { loadCsvRows } from "./helpers";

const rows = loadCsvRows();
const f = (over: Partial<Filter>): Filter => ({ month: "2026-09", region: ALL, projectType: ALL, siteId: ALL, ...over });
const csvFor = (filter: Filter) => buildCsv(buildDashboard(rows, filter).metrics);
const parse = (csv: string) => Papa.parse<Record<string, string>>(csv.replace(/^﻿/, ""), { header: true, skipEmptyLines: true });

describe("CSV 내보내기", () => {
  it("열은 원본 15개 + 계산 4개 = 19개이다", () => {
    expect(EXPORT_HEADERS).toHaveLength(19);
    expect(EXPORT_HEADERS.slice(0, 15)).toEqual([...FIELD_NAMES]);
    expect(EXPORT_HEADERS.slice(15)).toEqual(["기성률(%)", "공정차이(pp)", "상태", "당월기성액(백만원)"]);
  });

  it("맨 앞에 BOM이 있어 엑셀에서 한글이 깨지지 않는다", () => {
    const csv = csvFor(f({}));
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv).toContain("기성률(%)");
    expect(csv).toContain("청라 공동주택 신축");
  });

  it("9월 D만 내보내면 데이터 1행: 기성률 69.4 · 공정차이 -10.7 · 점검 · 당월 3339.6", () => {
    const res = parse(csvFor(f({ siteId: "D" })));
    expect(res.data).toHaveLength(1);
    expect(res.meta.fields).toHaveLength(19);
    expect(res.data[0]).toMatchObject({
      month: "2026-09",
      siteId: "D",
      "기성률(%)": "69.4",
      "공정차이(pp)": "-10.7",
      상태: "점검",
      "당월기성액(백만원)": "3339.6",
    });
  });

  it("9월 인천·공동주택은 데이터 2행(A·G)이다", () => {
    const res = parse(csvFor(f({ region: "인천", projectType: "공동주택" })));
    expect(res.data.map((r) => r.siteId)).toEqual(["A", "G"]);
  });

  it("9월 전체는 12행이다", () => {
    expect(parse(csvFor(f({}))).data).toHaveLength(12);
  });

  it("2025-10의 당월기성액은 0이 아니라 '계산 불가'이다", () => {
    const res = parse(csvFor(f({ month: "2025-10" })));
    expect(res.data).toHaveLength(12);
    for (const r of res.data) expect(r["당월기성액(백만원)"]).toBe("계산 불가");
  });

  it("J의 7월 당월기성액 0.0은 숫자로 내보낸다", () => {
    const res = parse(csvFor(f({ month: "2026-07", siteId: "J" })));
    expect(res.data[0]["당월기성액(백만원)"]).toBe("0.0");
  });

  it("원본 15개 열의 값은 쉼표·따옴표가 있어도 그대로 다시 읽힌다", () => {
    const res = parse(csvFor(f({})));
    for (const out of res.data) {
      const src = rows.find((r) => r.month === out.month && r.siteId === out.siteId)!;
      for (const key of FIELD_NAMES) expect(out[key]).toBe(String(src[key]));
    }
  });

  it("쉼표·따옴표·줄바꿈이 든 값은 따옴표로 감싼다", () => {
    const tricky = { ...rows[0], issueSummary: '쉼표, "따옴표"\n줄바꿈' };
    const [m] = buildDashboard([tricky], f({ month: tricky.month })).metrics;
    const res = parse(buildCsv([m]));
    expect(res.data[0].issueSummary).toBe('쉼표, "따옴표"\n줄바꿈');
  });

  it("범위 설명과 파일 이름", () => {
    expect(describeRange(f({ siteId: "D" }))).toBe("2026-09 · 전체 · 전체 · D");
    expect(exportFileName(f({ region: "인천", projectType: "공동주택" }))).toBe("현장공정기성_2026-09_인천_공동주택_전체.csv");
  });
});
