import type { Aggregate } from "@/lib/calc";
import { fmtContract, fmtMoney, fmtPercent, fmtPp, NA } from "@/lib/format";
import { gapColor } from "./StatusBadge";

function Big({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: string }) {
  const na = value === NA;
  return (
    <div className="flex-1 px-5 py-4">
      <div className="text-[13px] font-medium text-ink-3">{label}</div>
      <div className={`num mt-1 text-[32px] font-bold leading-10 tracking-tight ${na ? "text-na-text !text-[22px]" : (tone ?? "text-ink")}`}>{value}</div>
      {sub ? <div className="text-[12px] text-ink-3">{sub}</div> : null}
    </div>
  );
}

function Small({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2">
      <span className="text-[12px] text-ink-3">{label}</span>
      <span className="num text-[15px] font-semibold">{value}</span>
      {value !== NA ? <span className="text-[11px] text-ink-3">백만원</span> : null}
      <span className="text-[11px] text-ink-3">{note}</span>
    </div>
  );
}

// 큰 숫자 4개 + 보조 숫자 3개. 누적기성액과 당월기성액은 서로 다른 값이다.
export default function KpiPanel({ agg }: { agg: Aggregate }) {
  return (
    <section aria-label="큰 숫자" className="rounded-lg border border-line bg-card">
      <div className="flex flex-col divide-y divide-line md:flex-row md:divide-x md:divide-y-0">
        <Big label="전체 기성률" value={fmtPercent(agg.progressRate)} sub="누적기성액 ÷ 계약금액" />
        <Big label="계획 공정률" value={fmtPercent(agg.planned)} sub="계약금액 가중평균" />
        <Big label="실제 공정률" value={fmtPercent(agg.actual)} sub="계약금액 가중평균" />
        <Big label="공정차이 (실제 − 계획)" value={fmtPp(agg.gap)} tone={gapColor(agg.gap)} sub="점검 −5.0pp 이하 · 주의 −5.0pp 초과 0 미만" />
      </div>
      <div className="grid gap-x-8 gap-y-1 border-t border-line bg-subtle px-5 py-2.5 md:grid-cols-3">
        <Small label="계약금액 합계" value={fmtContract(agg.contract)} note={agg.count > 0 ? `${agg.count}개 현장` : ""} />
        <Small label="누적기성액" value={fmtMoney(agg.cumulative)} note="월말 누적 · 수금액 아님" />
        <Small label="당월기성액" value={fmtMoney(agg.monthlyEarned)} note={agg.monthlyEarned == null ? "전월 자료가 없어 계산하지 않음" : "당월 누적 − 전월 누적"} />
      </div>
    </section>
  );
}
