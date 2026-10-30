import {
  FIELD_NAMES,
  NUMBER_FIELDS,
  PROJECT_TYPES,
  REGIONS,
  type FieldName,
  type ImportIssue,
  type SiteMonthRow,
} from "./types";
import type { RawFile } from "./parse";

export const MONTH_MIN = "2025-10";
export const MONTH_MAX = "2026-09";

export interface ValidationResult {
  ok: boolean;
  kind: "csv" | "json";
  lineLabel: "줄" | "번째 항목";
  totalRecords: number;
  rows: SiteMonthRow[];
  issues: ImportIssue[];
  warnings: string[];
  notes: string[];
}

const NUM_RE = /^-?\d+(\.\d+)?$/;
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

function asText(v: unknown): string {
  if (v == null) return "";
  return typeof v === "string" ? v.trim() : String(v);
}

function isValidDate(s: string): boolean {
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === mo - 1 && dt.getUTCDate() === d;
}

function monthEnd(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${month}-${String(last).padStart(2, "0")}`;
}

// 한 행 안에서 확인할 수 있는 검사. 문제가 없으면 정리된 행을 돌려준다.
function checkRow(rec: Record<string, unknown>, line: number): { row: SiteMonthRow | null; issues: ImportIssue[] } {
  const issues: ImportIssue[] = [];
  const add = (field: string, message: string, value: string) => issues.push({ line, field, message, value });
  const text: Record<string, string> = {};

  for (const f of FIELD_NAMES) {
    const t = asText(rec[f]);
    text[f] = t;
    if (t === "") add(f, "필수 값이 비어 있습니다", "(빈 값)");
  }

  const num: Partial<Record<FieldName, number>> = {};
  for (const f of NUMBER_FIELDS) {
    if (text[f] === "") continue;
    if (!NUM_RE.test(text[f]) || !Number.isFinite(Number(text[f]))) {
      add(f, "숫자가 아닙니다", text[f]);
    } else {
      num[f] = Number(text[f]);
    }
  }
  if (num.contractAmount != null && !(num.contractAmount > 0)) add("contractAmount", "0보다 커야 합니다", text.contractAmount);
  for (const f of ["plannedProgress", "actualProgress"] as const) {
    const v = num[f];
    if (v != null && (v < 0 || v > 100)) add(f, "0~100 범위를 벗어났습니다", text[f]);
  }
  if (num.cumulativeEarned != null) {
    if (num.cumulativeEarned < 0) add("cumulativeEarned", "0 이상이어야 합니다", text.cumulativeEarned);
    else if (num.contractAmount != null && num.cumulativeEarned > num.contractAmount)
      add("cumulativeEarned", "계약금액을 넘을 수 없습니다", text.cumulativeEarned);
  }

  if (text.month !== "") {
    if (!MONTH_RE.test(text.month)) add("month", "YYYY-MM 형식이 아닙니다", text.month);
    else if (text.month < MONTH_MIN || text.month > MONTH_MAX)
      add("month", `허용 기간(${MONTH_MIN}~${MONTH_MAX})을 벗어났습니다`, text.month);
  }
  if (text.siteId !== "" && !/^[A-L]$/.test(text.siteId)) add("siteId", "현장 ID는 A~L 중 하나여야 합니다", text.siteId);
  if (text.region !== "" && !(REGIONS as readonly string[]).includes(text.region))
    add("region", `지역은 ${REGIONS.join("·")} 중 하나여야 합니다`, text.region);
  if (text.projectType !== "" && !(PROJECT_TYPES as readonly string[]).includes(text.projectType))
    add("projectType", `공사 유형은 ${PROJECT_TYPES.join("·")} 중 하나여야 합니다`, text.projectType);

  let datesOk = true;
  for (const f of ["startDate", "contractEndDate"] as const) {
    if (text[f] !== "" && !isValidDate(text[f])) {
      add(f, "YYYY-MM-DD 형식의 올바른 날짜가 아닙니다", text[f]);
      datesOk = false;
    }
  }
  if (datesOk && text.startDate !== "" && text.contractEndDate !== "") {
    if (!(text.startDate < text.contractEndDate)) add("contractEndDate", "계약상 준공일이 착공일보다 늦어야 합니다", text.contractEndDate);
    if (MONTH_RE.test(text.month) && monthEnd(text.month) < text.startDate)
      add("month", "월말 기준일이 착공일보다 이릅니다", text.month);
  }

  if (issues.length > 0) return { row: null, issues };
  return {
    row: {
      month: text.month,
      siteId: text.siteId,
      siteName: text.siteName,
      contractAmount: num.contractAmount!,
      plannedProgress: num.plannedProgress!,
      actualProgress: num.actualProgress!,
      cumulativeEarned: num.cumulativeEarned!,
      region: text.region,
      projectType: text.projectType,
      startDate: text.startDate,
      contractEndDate: text.contractEndDate,
      currentWork: text.currentWork,
      issueCategory: text.issueCategory,
      issueSummary: text.issueSummary,
      actionPlan: text.actionPlan,
    },
    issues,
  };
}

export function validateFile(file: RawFile): ValidationResult {
  const kind = file.kind;
  const lineLabel = kind === "csv" ? "줄" : "번째 항목";
  const lineOf = (index: number) => (kind === "csv" ? index + 2 : index + 1);
  const issues: ImportIssue[] = [];
  const warnings: string[] = [];
  const notes: string[] = [];
  const result = (rows: SiteMonthRow[]): ValidationResult => ({
    ok: issues.length === 0,
    kind,
    lineLabel,
    totalRecords: file.records.length,
    rows: issues.length === 0 ? rows : [],
    issues,
    warnings,
    notes,
  });

  for (const e of file.parseErrors) issues.push({ line: null, field: "파일", message: e, value: "" });
  if (issues.length > 0) return result([]);

  // CSV: 열 이름 확인 (없으면 행 검사는 건너뜀)
  if (kind === "csv") {
    const missingCols = FIELD_NAMES.filter((f) => !file.headers.includes(f));
    if (missingCols.length > 0) {
      for (const f of missingCols) issues.push({ line: 1, field: f, message: "필수 열이 없습니다", value: "" });
      return result([]);
    }
  }

  if (file.records.length === 0) {
    issues.push({ line: null, field: "파일", message: "자료 행이 없습니다", value: "" });
    return result([]);
  }

  // 메타데이터
  if (kind === "json") {
    const md = file.metadata;
    if (!md) {
      warnings.push("JSON에 metadata가 없어 설명서의 단위(금액 백만원, 공정률 %)를 적용했습니다.");
    } else {
      if (md.schemaVersion !== "2.0") issues.push({ line: null, field: "metadata.schemaVersion", message: "2.0이어야 합니다", value: asText(md.schemaVersion) });
      if (md.moneyUnit !== "백만원") issues.push({ line: null, field: "metadata.moneyUnit", message: "금액 단위는 백만원이어야 합니다", value: asText(md.moneyUnit) });
      if (md.progressUnit !== "percent_0_100") issues.push({ line: null, field: "metadata.progressUnit", message: "공정률 단위는 percent_0_100(0~100%)이어야 합니다", value: asText(md.progressUnit) });
      const req = Array.isArray(md.requiredFields) ? (md.requiredFields as unknown[]).map(asText) : [];
      const missing = FIELD_NAMES.filter((f) => !req.includes(f));
      if (missing.length > 0) issues.push({ line: null, field: "metadata.requiredFields", message: `필수 필드 목록에 ${missing.join(", ")}이(가) 없습니다`, value: "" });
    }
  } else {
    notes.push("CSV에는 메타데이터가 없어 설명서의 단위(금액 백만원, 공정률 %)와 필드 기준을 적용했습니다.");
  }

  // 행별 검사
  const valid: { row: SiteMonthRow; line: number }[] = [];
  file.records.forEach((rec, i) => {
    const line = lineOf(i);
    const { row, issues: rowIssues } = checkRow(rec, line);
    issues.push(...rowIssues);
    if (row) valid.push({ row, line });
  });

  // 같은 월+현장 중복
  const seen = new Map<string, number>();
  const unique: { row: SiteMonthRow; line: number }[] = [];
  for (const item of valid) {
    const key = `${item.row.month}/${item.row.siteId}`;
    if (seen.has(key)) {
      issues.push({ line: item.line, field: "month+siteId", message: `${key}가 중복되었습니다`, value: key });
    } else {
      seen.set(key, item.line);
      unique.push(item);
    }
  }

  // 같은 현장의 고정 정보 일치
  const firstBySite = new Map<string, SiteMonthRow>();
  const FIXED = ["siteName", "region", "projectType", "contractAmount", "startDate", "contractEndDate"] as const;
  for (const { row, line } of unique) {
    const first = firstBySite.get(row.siteId);
    if (!first) {
      firstBySite.set(row.siteId, row);
      continue;
    }
    for (const f of FIXED) {
      if (first[f] !== row[f]) {
        issues.push({ line, field: f, message: `같은 현장(${row.siteId})의 ${f} 값이 다른 행과 다릅니다`, value: String(row[f]) });
      }
    }
  }

  // 누적값은 줄어들 수 없음
  const bySite = new Map<string, { row: SiteMonthRow; line: number }[]>();
  for (const item of unique) {
    const list = bySite.get(item.row.siteId) ?? [];
    list.push(item);
    bySite.set(item.row.siteId, list);
  }
  for (const list of bySite.values()) {
    list.sort((a, b) => a.row.month.localeCompare(b.row.month));
    for (let i = 1; i < list.length; i++) {
      const prev = list[i - 1].row;
      const cur = list[i].row;
      for (const f of ["plannedProgress", "actualProgress", "cumulativeEarned"] as const) {
        if (cur[f] < prev[f]) {
          issues.push({
            line: list[i].line,
            field: f,
            message: `이전 달(${prev.month})보다 줄었습니다 (누적값은 줄어들 수 없음)`,
            value: String(cur[f]),
          });
        }
      }
    }
  }

  // 월별 누락 경고
  if (issues.length === 0) {
    const allMonths = new Set(unique.map((u) => u.row.month));
    const lacking: string[] = [];
    for (const [siteId, list] of bySite) {
      if (list.length < allMonths.size) lacking.push(siteId);
    }
    if (lacking.length > 0) {
      warnings.push(`현장 ${lacking.sort().join("·")}에 월별 누락이 있습니다. 확인 가능한 행만 집계합니다.`);
    }
  }

  issues.sort((a, b) => (a.line ?? 0) - (b.line ?? 0));
  return result(unique.map((u) => u.row));
}

// 파일 글자 그대로를 검사하는 입구 (확장자는 화면에서 구분)
export function looksBroken(text: string): boolean {
  return text.includes("�");
}
