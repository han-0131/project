"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TrendPoint } from "@/lib/calc";
import { fmtMoney, fmtPercent, fmtPp, NA, roundHalfUp } from "@/lib/format";

const shortMonth = (m: string) => (m ? `${m.slice(2, 4)}.${m.slice(5)}` : m);

// 마우스를 올렸을 때 나오는 설명 (recharts가 넘겨 주는 값을 그대로 받음)
interface TipProps {
  active?: boolean;
  label?: string | number;
}

function TrendTooltip({ active, label, points }: TipProps & { points: TrendPoint[] }) {
  if (!active) return null;
  const p = points.find((x) => x.month === label);
  if (!p) return null;
  return (
    <div className="num rounded border border-line-strong bg-white px-3 py-2 text-[12px] shadow">
      <div className="mb-1 font-semibold">{p.month}</div>
      <div>계획 공정률 {fmtPercent(p.planned)}</div>
      <div>실제 공정률 {fmtPercent(p.actual)}</div>
      <div>공정차이 {fmtPp(p.gap)}</div>
    </div>
  );
}

// 선택 월까지의 계획·실제 공정률 추이
export function TrendChart({ points }: { points: TrendPoint[] }) {
  const data = points.map((p) => ({
    month: p.month,
    계획: p.planned == null ? null : roundHalfUp(p.planned),
    실제: p.actual == null ? null : roundHalfUp(p.actual),
  }));
  const last = points[points.length - 1];
  return (
    <section className="rounded-lg border border-line bg-card p-4" aria-label="계획·실제 공정률 추이">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-semibold">누적 공정률 추이 (계획 vs 실제)</h2>
        <span className="num text-[12px] text-ink-3">
          {points[0]?.month} ~ {last?.month} ({points.length}개 월)
        </span>
      </div>
      <p className="mb-2 text-[12px] text-ink-3">선택한 지역·유형·현장으로 매월 따로 집계한 값입니다.</p>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="month" tickFormatter={shortMonth} tick={{ fontSize: 12, fill: "#64748b" }} />
            <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 12, fill: "#64748b" }} width={44} />
            <Tooltip content={<TrendTooltip points={points} />} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="계획" stroke="#64748b" strokeDasharray="5 4" strokeWidth={2} dot={{ r: 2.5 }} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="실제" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {last ? (
        <p className="num mt-1 text-[12px] text-ink-3">
          {last.month} 마감: 계획 {fmtPercent(last.planned)} · 실제 {fmtPercent(last.actual)} · 공정차이 {fmtPp(last.gap)}
        </p>
      ) : null}
    </section>
  );
}

function BarTooltip({ active, label, points }: TipProps & { points: TrendPoint[] }) {
  if (!active) return null;
  const p = points.find((x) => x.month === label);
  if (!p) return null;
  return (
    <div className="num rounded border border-line-strong bg-white px-3 py-2 text-[12px] shadow">
      <div className="mb-1 font-semibold">{p.month}</div>
      <div>
        당월기성액 {fmtMoney(p.monthlyEarned)}
        {p.monthlyEarned == null ? "" : " 백만원"}
      </div>
      <div className="text-ink-3">누적기성액 {fmtMoney(p.cumulative)}</div>
    </div>
  );
}

interface TickProps {
  x?: number;
  y?: number;
  payload?: { value: string };
}

// 월별 당월기성액 막대 (당월 누적 − 전월 누적). 전월이 없는 달은 "계산 불가"
export function MonthlyBars({ points, selectedMonth }: { points: TrendPoint[]; selectedMonth: string }) {
  const naMonths = points.filter((p) => p.monthlyEarned == null).map((p) => p.month);
  const data = points.map((p) => ({ month: p.month, value: p.monthlyEarned == null ? null : roundHalfUp(p.monthlyEarned) }));
  const Tick = ({ x = 0, y = 0, payload }: TickProps) => {
    const m = payload?.value ?? "";
    const na = naMonths.includes(m);
    return (
      <g transform={`translate(${x},${y})`}>
        <text y={14} textAnchor="middle" fontSize={12} fill="#64748b">
          {shortMonth(m)}
        </text>
        {na ? (
          <text y={28} textAnchor="middle" fontSize={10} fill="#475569" fontWeight={600}>
            {NA}
          </text>
        ) : null}
      </g>
    );
  };
  return (
    <section className="rounded-lg border border-line bg-card p-4" aria-label="월별 당월기성액">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[16px] font-semibold">월별 당월기성액</h2>
        <span className="text-[12px] text-ink-3">단위: 백만원 (당월 누적기성액 − 전월 누적기성액)</span>
      </div>
      <p className="mb-2 text-[12px] text-ink-3">누적기성액을 월별로 더하지 않고, 달마다 새로 계산한 값입니다.</p>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
          <BarChart data={data} margin={{ top: 8, right: 16, bottom: 14, left: 0 }}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" tick={<Tick />} interval={0} height={40} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} tickFormatter={(v: number) => v.toLocaleString("en-US")} width={56} />
            <Tooltip content={<BarTooltip points={points} />} cursor={{ fill: "#f1f5f9" }} />
            <Bar dataKey="value" isAnimationActive={false} radius={[3, 3, 0, 0]}>
              {data.map((d) => (
                <Cell key={d.month} fill={d.month === selectedMonth ? "#2563eb" : "#bfdbfe"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {naMonths.length > 0 ? (
        <p className="mt-1 rounded bg-na-bg px-2 py-1 text-[12px] text-na-text">
          {naMonths.join(", ")}: 전월 자료가 없어 당월기성액을 계산하지 않았습니다 ({NA}). 그 달의 누적기성액을 당월액으로 대신하지 않습니다.
        </p>
      ) : null}
    </section>
  );
}
