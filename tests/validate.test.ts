import { describe, expect, it } from "vitest";
import { parseCsv, parseJson } from "@/lib/parse";
import { validateFile } from "@/lib/validate";
import { buildDashboard } from "@/lib/calc";
import { fmtPercent } from "@/lib/format";
import { ALL } from "@/lib/types";
import { loadCsvRows, loadJsonRows, readData } from "./helpers";

const checkCsv = (...parts: string[]) => validateFile(parseCsv(readData(...parts)));

describe("정상 파일 가져오기", () => {
  it("정상 CSV: 144행 · 오류 0건 · 단위 안내", () => {
    const res = checkCsv("현장공정기성.csv");
    expect(res.ok).toBe(true);
    expect(res.rows).toHaveLength(144);
    expect(res.issues).toHaveLength(0);
    expect(res.notes.join(" ")).toContain("메타데이터가 없어");
  });

  it("정상 JSON: 144행 · 오류 0건", () => {
    const res = validateFile(parseJson(readData("현장공정기성.json")));
    expect(res.ok).toBe(true);
    expect(res.rows).toHaveLength(144);
  });

  it("CSV와 JSON은 같은 144행이다 (교체 후에도 288행이 되지 않음)", () => {
    const csv = loadCsvRows();
    const json = loadJsonRows();
    expect(json).toEqual(csv);
    // 가져오기는 전체 교체: 새 파일의 행이 곧 새 자료
    const replaced = [...json];
    expect(replaced).toHaveLength(144);
  });

  it("JSON 메타데이터의 단위가 다르면 거부한다", () => {
    const json = JSON.parse(readData("현장공정기성.json"));
    json.metadata.moneyUnit = "원";
    const res = validateFile(parseJson(JSON.stringify(json)));
    expect(res.ok).toBe(false);
    expect(res.issues[0].field).toBe("metadata.moneyUnit");
  });
});

describe("오류 파일 3종은 모두 거부한다", () => {
  it("오류_공정률101.csv: 134줄 actualProgress 범위 오류", () => {
    const res = checkCsv("검증용_오류데이터", "오류_공정률101.csv");
    expect(res.ok).toBe(false);
    expect(res.rows).toHaveLength(0);
    expect(res.issues).toHaveLength(1);
    expect(res.issues[0]).toMatchObject({ line: 134, field: "actualProgress", value: "101" });
    expect(res.issues[0].message).toContain("0~100");
  });

  it("오류_공정률빈값.csv: 134줄 actualProgress 필수 값 비어 있음 (0으로 바꾸지 않음)", () => {
    const res = checkCsv("검증용_오류데이터", "오류_공정률빈값.csv");
    expect(res.ok).toBe(false);
    expect(res.issues).toHaveLength(1);
    expect(res.issues[0]).toMatchObject({ line: 134, field: "actualProgress" });
    expect(res.issues[0].message).toContain("비어 있습니다");
  });

  it("오류_중복키.csv: 146줄 2026-09/D 중복", () => {
    const res = checkCsv("검증용_오류데이터", "오류_중복키.csv");
    expect(res.ok).toBe(false);
    expect(res.issues).toHaveLength(1);
    expect(res.issues[0]).toMatchObject({ line: 146, field: "month+siteId" });
    expect(res.issues[0].message).toContain("2026-09/D");
  });

  it("거부된 파일은 기존 자료에 영향을 주지 않는다 (9월 67.2% 유지)", () => {
    const current = loadCsvRows();
    const bad = checkCsv("검증용_오류데이터", "오류_중복키.csv");
    // 화면은 bad.ok가 false이면 교체하지 않는다
    const next = bad.ok ? bad.rows : current;
    const agg = buildDashboard(next, { month: "2026-09", region: ALL, projectType: ALL, siteId: ALL }).agg;
    expect(fmtPercent(agg.progressRate)).toBe("67.2%");
    expect(agg.counts.점검).toBe(3);
  });
});

describe("그 밖의 검사", () => {
  const lines = readData("현장공정기성.csv").split(/\r?\n/);

  it("필수 열이 없으면 거부한다", () => {
    const header = lines[0].split(",").filter((h) => h.replace("﻿", "") !== "region").join(",");
    const res = validateFile(parseCsv(header + "\n"));
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.field === "region" && i.message.includes("필수 열"))).toBe(true);
  });

  it("계약금액 0은 거부한다", () => {
    const cols = lines[1].split(",");
    const idx = lines[0].replace("﻿", "").split(",").indexOf("contractAmount");
    cols[idx] = "0";
    const res = validateFile(parseCsv([lines[0], cols.join(",")].join("\n")));
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.field === "contractAmount")).toBe(true);
  });

  it("누적 공정률이 줄어들면 거부한다", () => {
    const head = lines[0].replace("﻿", "").split(",");
    const a = lines[1].split(","); // 2025-10 A
    const b = lines[13].split(","); // 2025-11 A
    const iActual = head.indexOf("actualProgress");
    b[iActual] = "1.0";
    const res = validateFile(parseCsv([lines[0], a.join(","), b.join(",")].join("\n")));
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.field === "actualProgress" && i.message.includes("줄어"))).toBe(true);
  });

  it("월별 누락은 오류가 아니라 경고이다", () => {
    const without = lines.filter((l, i) => i === 0 || !l.startsWith("2026-09,A,"));
    const res = validateFile(parseCsv(without.join("\n")));
    expect(res.ok).toBe(true);
    expect(res.rows).toHaveLength(143);
    expect(res.warnings.join(" ")).toContain("월별 누락");
  });

  it("빈 파일·깨진 JSON은 거부한다", () => {
    expect(validateFile(parseCsv("")).ok).toBe(false);
    expect(validateFile(parseJson("{ not json")).ok).toBe(false);
  });
});
