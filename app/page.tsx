"use client";

import { AlertTriangle } from "lucide-react";
import { useApp } from "@/components/AppState";
import EmptyData from "@/components/EmptyData";
import FilterBar from "@/components/FilterBar";
import KpiPanel from "@/components/KpiPanel";
import InspectionPanel from "@/components/InspectionPanel";
import { MonthlyBars, TrendChart } from "@/components/Charts";

// 현황 요약 (첫 화면)
export default function SummaryPage() {
  const { rows, dashboard, filter } = useApp();
  if (!rows || !dashboard) return <EmptyData feature="현황 요약" />;

  return (
    <div className="flex flex-col gap-4">
      <FilterBar />

      {dashboard.missing.length > 0 && dashboard.scoped.length > 0 ? (
        <div role="alert" className="flex items-start gap-2 rounded border border-caution-line bg-caution-bg px-3 py-2 text-[13px] text-caution-text">
          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
          <span>
            현장 {dashboard.missing.length}곳({dashboard.missing.join("·")})의 {filter.month} 자료가 없어 확인 가능한 행만 집계했습니다.
          </span>
        </div>
      ) : null}

      <KpiPanel agg={dashboard.agg} />
      <InspectionPanel dashboard={dashboard} />

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart points={dashboard.trend} />
        <MonthlyBars points={dashboard.trend} selectedMonth={filter.month} />
      </div>
    </div>
  );
}
