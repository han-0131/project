"use client";

import { Fragment, useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import { useApp } from "@/components/AppState";
import EmptyData from "@/components/EmptyData";
import FilterBar from "@/components/FilterBar";
import { StatusChips } from "@/components/InspectionPanel";
import StatusBadge, { gapColor } from "@/components/StatusBadge";
import type { SiteMetrics } from "@/lib/calc";
import { fmtContract, fmtMoney, fmtPercent, fmtPp } from "@/lib/format";

const COLS = 11;

// 현장별 비교표: 공정차이가 작은 순. 줄을 누르면 같은 페이지 안에서 기록이 펼쳐진다.
export default function ComparePage() {
  const { rows, dashboard, filter, focusSite } = useApp();
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(focusSite ? [focusSite] : []));

  // 점검 순위에서 넘어온 현장은 줄을 펼치고 화면에 보이게 한다
  useEffect(() => {
    if (!focusSite || !dashboard) return;
    if (!dashboard.metrics.some((m) => m.row.siteId === focusSite)) return;
    setExpanded((prev) => (prev.has(focusSite) ? prev : new Set(prev).add(focusSite)));
    const t = setTimeout(() => document.getElementById(`site-row-${focusSite}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 50);
    return () => clearTimeout(t);
  }, [focusSite, dashboard]);

  if (!rows || !dashboard) return <EmptyData feature="현장별 비교표" />;
  const { metrics, agg, missing } = dashboard;

  function toggle(siteId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId);
      else next.add(siteId);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <FilterBar />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-[18px] font-semibold">
          현장별 비교표 <span className="num text-[13px] font-normal text-ink-3">{filter.month} 기준 · {metrics.length}개 현장</span>
        </h1>
        {metrics.length > 0 ? <StatusChips counts={agg.counts} /> : null}
      </div>

      {missing.length > 0 && metrics.length > 0 ? (
        <div role="alert" className="flex items-start gap-2 rounded border border-caution-line bg-caution-bg px-3 py-2 text-[13px] text-caution-text">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>현장 {missing.join("·")}의 {filter.month} 자료가 없어 확인 가능한 행만 보여 줍니다.</span>
        </div>
      ) : null}

      {metrics.length === 0 ? (
        <div className="rounded-lg border border-line bg-card px-6 py-12 text-center text-[14px] text-na-text">선택한 범위에 자료가 없습니다 (자료 없음 · 계산 불가)</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-card">
          <table className="w-full min-w-[1120px] text-[13px]">
            <thead>
              <tr className="border-b-2 border-line bg-canvas text-left text-[12px] text-ink-2">
                <th className="h-9 w-8 px-2" aria-label="펼침" />
                <th className="px-2 font-semibold">현장 ID · 이름</th>
                <th className="px-2 font-semibold">지역</th>
                <th className="px-2 font-semibold">공사 유형</th>
                <th className="px-2 font-semibold">당월 주요 공종</th>
                <th className="px-2 text-right font-semibold">계약금액 <span className="font-normal text-ink-3">(백만원)</span></th>
                <th className="px-2 text-right font-semibold">누적기성액 <span className="font-normal text-ink-3">(백만원)</span></th>
                <th className="px-2 text-right font-semibold">기성률</th>
                <th className="px-2 text-right font-semibold">계획 공정률</th>
                <th className="px-2 text-right font-semibold">실제 공정률</th>
                <th className="px-2 text-right font-semibold">공정차이</th>
                <th className="px-2 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map((m) => (
                <SiteRow key={m.row.siteId} m={m} open={expanded.has(m.row.siteId)} highlighted={focusSite === m.row.siteId} onToggle={() => toggle(m.row.siteId)} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-line bg-canvas text-[13px]">
                <td colSpan={5} className="px-3 py-2 font-semibold">
                  총 {metrics.length}개 현장 집계
                </td>
                <td className="num px-2 py-2 text-right font-semibold">{fmtContract(agg.contract)}</td>
                <td className="num px-2 py-2 text-right font-semibold">{fmtMoney(agg.cumulative)}</td>
                <td className="num px-2 py-2 text-right font-semibold">{fmtPercent(agg.progressRate)}</td>
                <td className="num px-2 py-2 text-right">{fmtPercent(agg.planned)}</td>
                <td className="num px-2 py-2 text-right">{fmtPercent(agg.actual)}</td>
                <td className={`num px-2 py-2 text-right font-semibold ${gapColor(agg.gap)}`}>{fmtPp(agg.gap)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="text-[12px] text-ink-3">공정차이 = 실제 − 계획 (pp). 상태는 공정차이로만 정하며, 기록 분류(특이사항)와는 별개입니다.</p>
    </div>
  );
}

function SiteRow({ m, open, highlighted, onToggle }: { m: SiteMetrics; open: boolean; highlighted: boolean; onToggle: () => void }) {
  const r = m.row;
  return (
    <Fragment>
      <tr
        id={`site-row-${r.siteId}`}
        onClick={onToggle}
        aria-expanded={open}
        data-highlighted={highlighted ? "true" : undefined}
        className={
          "h-10 cursor-pointer border-b border-subtle hover:bg-canvas " +
          (highlighted ? "bg-action-soft shadow-[inset_3px_0_0_#2563eb]" : open ? "bg-canvas" : "")
        }
      >
        <td className="px-2 text-ink-3">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</td>
        <td className="px-2 font-medium">
          <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded bg-header text-[11px] font-bold text-white">{r.siteId}</span>
          {r.siteName}
        </td>
        <td className="px-2">{r.region}</td>
        <td className="px-2">{r.projectType}</td>
        <td className="px-2">{r.currentWork}</td>
        <td className="num px-2 text-right">{fmtContract(r.contractAmount)}</td>
        <td className="num px-2 text-right">{fmtMoney(r.cumulativeEarned)}</td>
        <td className="num px-2 text-right">{fmtPercent(m.progressRate)}</td>
        <td className="num px-2 text-right">{fmtPercent(r.plannedProgress)}</td>
        <td className="num px-2 text-right">{fmtPercent(r.actualProgress)}</td>
        <td className={`num px-2 text-right font-semibold ${gapColor(m.gap)}`}>{fmtPp(m.gap)}</td>
        <td className="px-2">
          <StatusBadge status={m.status} />
        </td>
      </tr>
      {open ? (
        <tr className="border-b border-line bg-canvas" data-testid={`detail-${r.siteId}`}>
          <td colSpan={COLS + 1} className="px-4 py-3">
            <div className="mb-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-ink-2">
              <span className="num">
                {r.month} 당월기성액{" "}
                <b className="text-[14px] text-ink">
                  {fmtMoney(m.monthlyEarned)}
                  {m.monthlyEarned == null ? "" : " 백만원"}
                </b>{" "}
                <span className="text-ink-3">{m.monthlyEarned == null ? "(전월 자료가 없어 계산하지 않음)" : "(당월 누적 − 전월 누적)"}</span>
              </span>
              <span className="num">
                누적기성액 <b className="text-[14px] text-ink">{fmtMoney(r.cumulativeEarned)}</b> 백만원 <span className="text-ink-3">(월말 누적, 수금액 아님)</span>
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded border border-line bg-white p-3">
                <h3 className="mb-1 text-[13px] font-semibold">공사기간</h3>
                <p className="num text-[13px]">
                  {r.startDate} ~ {r.contractEndDate}
                </p>
                <p className="mt-1 text-[12px] text-ink-3">착공일 ~ 계약상 준공일 (예정 일정이며 실제 완료일이 아닙니다)</p>
              </div>
              <div className="rounded border border-caution-line bg-caution-bg/40 p-3">
                <h3 className="mb-1 flex items-center gap-2 text-[13px] font-semibold">
                  기록된 상황
                  <span className="rounded bg-subtle px-1.5 py-0.5 text-[11px] font-normal text-ink-2">기록 분류: {r.issueCategory}</span>
                </h3>
                <p className="text-[13px] leading-5">{r.issueSummary || "기록 없음"}</p>
              </div>
              <div className="rounded border border-action/30 bg-action-soft/60 p-3">
                <h3 className="mb-1 text-[13px] font-semibold">계획된 대응</h3>
                <p className="text-[13px] leading-5">{r.actionPlan || "기록 없음"}</p>
                <p className="mt-1 text-[11px] text-ink-3">예정된 대응이며 완료나 효과를 보장하지 않습니다.</p>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </Fragment>
  );
}
