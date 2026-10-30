"use client";

import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { Dashboard } from "@/lib/calc";
import { fmtPercent, fmtPp } from "@/lib/format";
import { useApp } from "./AppState";
import StatusBadge, { gapColor } from "./StatusBadge";

export function StatusChips({ counts }: { counts: Dashboard["agg"]["counts"] }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="상태 건수">
      <span className="num rounded border border-normal-line bg-normal-bg px-2 py-0.5 text-[12px] font-medium text-normal-text">정상 {counts.정상}</span>
      <span className="num rounded border border-caution-line bg-caution-bg px-2 py-0.5 text-[12px] font-medium text-caution-text">주의 {counts.주의}</span>
      <span className="num rounded border border-alert-line bg-alert-bg px-2 py-0.5 text-[12px] font-medium text-alert-text">점검 {counts.점검}</span>
    </div>
  );
}

// 점검 필요 현장 순위: 공정차이가 작은 순, 같으면 현장 ID 순. 한 줄을 누르면 비교표로 이동한다.
export default function InspectionPanel({ dashboard }: { dashboard: Dashboard }) {
  const router = useRouter();
  const { setFocusSite } = useApp();
  const { inspection, agg, scoped } = dashboard;

  function open(siteId: string) {
    setFocusSite(siteId);
    router.push("/compare");
  }

  return (
    <section className="rounded-lg border border-line bg-card p-4" aria-label="점검 필요 현장 순위">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="h-6 w-1.5 rounded bg-alert-dot" />
          <h2 className="text-[18px] font-semibold">점검 필요 현장 순위</h2>
          <span className="text-[12px] text-ink-3">공정차이 −5.0pp 이하, 작은 순</span>
        </div>
        {scoped.length > 0 ? <StatusChips counts={agg.counts} /> : null}
      </div>

      {scoped.length === 0 ? (
        <div className="rounded bg-na-bg px-4 py-6 text-center text-[14px] text-na-text">선택한 범위에 자료가 없습니다 (자료 없음 · 계산 불가)</div>
      ) : inspection.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded bg-normal-bg px-4 py-8 text-center text-normal-text">
          <CheckCircle2 size={28} className="text-normal-dot" />
          <p className="text-[15px] font-semibold">선택한 범위에 점검이 필요한 현장이 없습니다</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-2">
          {inspection.map((m, i) => (
            <li key={m.row.siteId}>
              <button
                type="button"
                onClick={() => open(m.row.siteId)}
                className="flex w-full items-center gap-4 rounded border border-line bg-white px-3 py-3 text-left transition hover:border-line-strong hover:bg-canvas"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-alert-bg text-[15px] font-bold text-alert-text">{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-semibold">
                      {m.row.siteId} {m.row.siteName}
                    </span>
                    <StatusBadge status={m.status} />
                    <span className="text-[12px] text-ink-3">
                      {m.row.projectType} | {m.row.region}
                    </span>
                    <span className="rounded bg-subtle px-1.5 py-0.5 text-[11px] text-ink-2" title="현장 기록 분류 (상태 판정과 별개)">
                      기록: {m.row.issueCategory}
                    </span>
                  </span>
                  <span className="num mt-1 block text-[13px] text-ink-2">
                    계획 {fmtPercent(m.row.plannedProgress)} · 실제 {fmtPercent(m.row.actualProgress)} · 기성률 {fmtPercent(m.progressRate)}
                  </span>
                </span>
                <span className="text-right">
                  <span className="block text-[11px] text-ink-3">공정차이</span>
                  <span className={`num text-[22px] font-bold ${gapColor(m.gap)}`}>{fmtPp(m.gap)}</span>
                </span>
                <ChevronRight size={18} className="text-ink-3" />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
