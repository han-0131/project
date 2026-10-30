import Papa from "papaparse";

export interface RawFile {
  kind: "csv" | "json";
  headers: string[]; // CSV 헤더 (JSON은 첫 항목의 키)
  records: Record<string, unknown>[];
  metadata: Record<string, unknown> | null; // JSON만
  parseErrors: string[];
}

// 맨 앞 BOM 제거
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export function parseCsv(text: string): RawFile {
  const result = Papa.parse<Record<string, string>>(stripBom(text), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  return {
    kind: "csv",
    headers: result.meta.fields ?? [],
    records: result.data,
    metadata: null,
    parseErrors: result.errors
      .filter((e) => e.code !== "TooFewFields" && e.code !== "TooManyFields")
      .map((e) => `${e.row != null ? e.row + 2 : "?"}줄: ${e.message}`),
  };
}

export function parseJson(text: string): RawFile {
  let data: unknown;
  try {
    data = JSON.parse(stripBom(text));
  } catch {
    return { kind: "json", headers: [], records: [], metadata: null, parseErrors: ["JSON 형식이 올바르지 않습니다."] };
  }
  const obj = data as { metadata?: unknown; records?: unknown } | unknown[];
  const list = Array.isArray(obj) ? obj : (obj as { records?: unknown }).records;
  if (!Array.isArray(list)) {
    return {
      kind: "json",
      headers: [],
      records: [],
      metadata: null,
      parseErrors: ["JSON에서 records 목록을 찾지 못했습니다."],
    };
  }
  const records = list.filter((r): r is Record<string, unknown> => typeof r === "object" && r !== null);
  const metadata =
    !Array.isArray(obj) && typeof (obj as { metadata?: unknown }).metadata === "object"
      ? ((obj as { metadata?: Record<string, unknown> }).metadata ?? null)
      : null;
  return {
    kind: "json",
    headers: records[0] ? Object.keys(records[0]) : [],
    records,
    metadata,
    parseErrors: [],
  };
}
