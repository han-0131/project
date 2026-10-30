import fs from "node:fs";
import path from "node:path";
import { parseCsv, parseJson } from "@/lib/parse";
import { validateFile } from "@/lib/validate";
import type { SiteMonthRow } from "@/lib/types";

const DATA = path.resolve(__dirname, "..", "data");

// data 폴더의 원본은 읽기만 한다
export function readData(...parts: string[]): string {
  return fs.readFileSync(path.join(DATA, ...parts), "utf8");
}

export function loadCsvRows(): SiteMonthRow[] {
  const res = validateFile(parseCsv(readData("현장공정기성.csv")));
  if (!res.ok) throw new Error("정상 CSV가 검사를 통과하지 못했습니다");
  return res.rows;
}

export function loadJsonRows(): SiteMonthRow[] {
  const res = validateFile(parseJson(readData("현장공정기성.json")));
  if (!res.ok) throw new Error("정상 JSON이 검사를 통과하지 못했습니다");
  return res.rows;
}
