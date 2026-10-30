"use client";

import { useMemo } from "react";
import { useApp } from "./AppState";
import { distinct, monthsOf, siteOptions } from "@/lib/calc";
import { ALL, PROJECT_TYPES, REGIONS } from "@/lib/types";

function Select({
  label,
  value,
  onChange,
  children,
  width = "w-[150px]",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  width?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
      <span className="whitespace-nowrap text-ink-3">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`num h-8 rounded border border-line-strong bg-white px-2 text-[13px] text-ink outline-none focus:outline-2 focus:outline-action ${width}`}
      >
        {children}
      </select>
    </label>
  );
}

// 월·지역·공사 유형·현장: 모든 화면이 같은 필터 한 벌을 쓴다
export default function FilterBar() {
  const { rows, filter, setMonth, setRegion, setProjectType, setSite } = useApp();

  const months = useMemo(() => (rows ? monthsOf(rows) : []), [rows]);
  const regions = useMemo(() => (rows ? distinct(rows, "region", REGIONS) : []), [rows]);
  const types = useMemo(() => (rows ? distinct(rows, "projectType", PROJECT_TYPES) : []), [rows]);
  const sites = useMemo(() => (rows ? siteOptions(rows, filter.region, filter.projectType) : []), [rows, filter.region, filter.projectType]);

  if (!rows) return null;

  return (
    <section aria-label="범위 선택" className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-lg border border-line bg-card px-4 py-3">
      <Select label="기준 월" value={filter.month} onChange={setMonth} width="w-[110px]">
        {months.map((m) => (
          <option key={m} value={m}>
            {m}
          </option>
        ))}
      </Select>
      <Select label="지역" value={filter.region} onChange={setRegion} width="w-[110px]">
        <option value={ALL}>{ALL}</option>
        {regions.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </Select>
      <Select label="공사 유형" value={filter.projectType} onChange={setProjectType} width="w-[120px]">
        <option value={ALL}>{ALL}</option>
        {types.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </Select>
      <Select label="현장" value={filter.siteId} onChange={setSite} width="w-[260px]">
        <option value={ALL}>{ALL} ({sites.length}개 현장)</option>
        {sites.map((s) => (
          <option key={s.siteId} value={s.siteId}>
            {s.siteId} · {s.siteName}
          </option>
        ))}
      </Select>
    </section>
  );
}
