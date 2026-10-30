import type { SiteMetrics } from "./calc";
import { csvNumber, NA } from "./format";
import { ALL, FIELD_NAMES, type Filter } from "./types";

// 원본 15개 열 + 계산 4개 열 = 19개 열
export const EXTRA_HEADERS = ["기성률(%)", "공정차이(pp)", "상태", "당월기성액(백만원)"] as const;
export const EXPORT_HEADERS: string[] = [...FIELD_NAMES, ...EXTRA_HEADERS];

function escapeCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

// 지금 고른 범위의 행을 CSV 글자로 만든다. 맨 앞에 BOM을 붙여 엑셀에서 한글이 깨지지 않게 한다.
export function buildCsv(metrics: SiteMetrics[]): string {
  const sorted = [...metrics].sort((a, b) => a.row.siteId.localeCompare(b.row.siteId));
  const lines = [EXPORT_HEADERS.map(escapeCell).join(",")];
  for (const m of sorted) {
    const r = m.row;
    const original = FIELD_NAMES.map((f) => String(r[f]));
    const extra = [csvNumber(m.progressRate), csvNumber(m.gap), m.status, m.monthlyEarned == null ? NA : csvNumber(m.monthlyEarned)];
    lines.push([...original, ...extra].map(escapeCell).join(","));
  }
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export function describeRange(f: Filter): string {
  const part = (v: string) => (v === ALL ? "전체" : v);
  return `${f.month} · ${part(f.region)} · ${part(f.projectType)} · ${part(f.siteId)}`;
}

export function exportFileName(f: Filter): string {
  const part = (v: string) => (v === ALL ? "전체" : v);
  return `현장공정기성_${f.month}_${part(f.region)}_${part(f.projectType)}_${part(f.siteId)}.csv`;
}
