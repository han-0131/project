"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { buildDashboard, defaultMonth, normalizeFilter, type Dashboard } from "@/lib/calc";
import { ALL, type Filter, type SiteMonthRow } from "@/lib/types";
import { shouldAcceptResponse } from "@/lib/ai/range";
import type { AskResult } from "@/lib/ai/types";

// AI 질문 한 건의 상태. rangeKey는 질문을 보낸 시점의 범위이다.
export type AiState =
  | { status: "idle" }
  | { status: "loading"; question: string; rangeKey: string }
  | { status: "done"; question: string; rangeKey: string; result: Extract<AskResult, { ok: true }> }
  | { status: "error"; question: string; rangeKey: string; message: string; kind: string };

interface AppValue {
  rows: SiteMonthRow[] | null;
  filter: Filter;
  dashboard: Dashboard | null;
  rangeKey: string;
  // 필터
  setMonth: (month: string) => void;
  setRegion: (region: string) => void;
  setProjectType: (type: string) => void;
  setSite: (siteId: string) => void;
  // 자료 교체 (전체 교체, 누적하지 않음)
  loadRows: (rows: SiteMonthRow[]) => void;
  // 점검 순위 → 비교표 이동 때 강조할 현장
  focusSite: string | null;
  setFocusSite: (siteId: string | null) => void;
  // AI
  ai: AiState; // 현재 범위에 해당하는 상태만 돌려준다 (범위가 바뀌면 idle)
  startAsk: (question: string) => { id: number; rangeKey: string };
  finishAsk: (id: number, rangeKey: string, question: string, outcome: AskResult) => void;
}

const EMPTY_FILTER: Filter = { month: "", region: ALL, projectType: ALL, siteId: ALL };

const Ctx = createContext<AppValue | null>(null);

export function useApp(): AppValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("AppProvider 안에서만 쓸 수 있습니다");
  return v;
}

export function rangeKeyOf(f: Filter): string {
  return [f.month, f.region, f.projectType, f.siteId].join("|");
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<SiteMonthRow[] | null>(null);
  const [filter, setFilter] = useState<Filter>(EMPTY_FILTER);
  const [focusSite, setFocusSite] = useState<string | null>(null);
  const [aiRaw, setAiRaw] = useState<AiState>({ status: "idle" });

  const rangeKey = rangeKeyOf(filter);
  const rangeKeyRef = useRef(rangeKey);
  rangeKeyRef.current = rangeKey;
  const requestIdRef = useRef(0); // 가장 최근에 보낸 질문의 번호

  const dashboard = useMemo(() => (rows && filter.month ? buildDashboard(rows, filter) : null), [rows, filter]);

  const update = useCallback(
    (patch: Partial<Filter>) => {
      if (!rows) return;
      setFilter((prev) => normalizeFilter(rows, { ...prev, ...patch }));
    },
    [rows],
  );

  const loadRows = useCallback((next: SiteMonthRow[]) => {
    setRows(next);
    setFilter({ month: defaultMonth(next), region: ALL, projectType: ALL, siteId: ALL });
    setFocusSite(null);
    setAiRaw({ status: "idle" });
  }, []);

  // 범위가 바뀌면 이전 답변은 보이지 않는다
  const ai: AiState = aiRaw.status !== "idle" && aiRaw.rangeKey === rangeKey ? aiRaw : { status: "idle" };

  const startAsk = useCallback((question: string) => {
    const key = rangeKeyRef.current;
    const id = ++requestIdRef.current;
    setAiRaw({ status: "loading", question, rangeKey: key });
    return { id, rangeKey: key };
  }, []);

  const finishAsk = useCallback((id: number, requestKey: string, question: string, outcome: AskResult) => {
    // 더 새로운 질문이 이미 시작됐다면 이 응답은 건드리지 않는다
    if (id !== requestIdRef.current) return;
    // 응답이 오는 사이 범위가 바뀌었으면 새 범위에 표시하지 않고 버린다. 대기 상태도 함께 푼다.
    if (!shouldAcceptResponse(rangeKeyRef.current, requestKey)) {
      setAiRaw({ status: "idle" });
      return;
    }
    if (outcome.ok) setAiRaw({ status: "done", question, rangeKey: requestKey, result: outcome });
    else setAiRaw({ status: "error", question, rangeKey: requestKey, message: outcome.error.message, kind: outcome.error.kind });
  }, []);

  const value: AppValue = {
    rows,
    filter,
    dashboard,
    rangeKey,
    setMonth: (month) => update({ month }),
    setRegion: (region) => update({ region }),
    setProjectType: (projectType) => update({ projectType }),
    setSite: (siteId) => update({ siteId }),
    loadRows,
    focusSite,
    setFocusSite,
    ai,
    startAsk,
    finishAsk,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
