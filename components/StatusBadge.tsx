import type { Status } from "@/lib/types";

const STYLE: Record<Status | "계산 불가", { box: string; dot: string }> = {
  정상: { box: "bg-normal-bg border-normal-line text-normal-text", dot: "bg-normal-dot" },
  주의: { box: "bg-caution-bg border-caution-line text-caution-text", dot: "bg-caution-dot" },
  점검: { box: "bg-alert-bg border-alert-line text-alert-text", dot: "bg-alert-dot" },
  "계산 불가": { box: "bg-na-bg border-na-line text-na-text", dot: "bg-na-dot" },
};

export default function StatusBadge({ status }: { status: Status | "계산 불가" }) {
  const s = STYLE[status];
  return (
    <span className={`inline-flex h-[22px] items-center gap-1.5 rounded border px-1.5 text-[11px] font-semibold ${s.box}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// 공정차이 숫자 색 (정상 초록 / 주의 주황 / 점검 빨강)
export function gapColor(gap: number | null | undefined): string {
  if (gap == null) return "text-na-text";
  if (gap >= 0) return "text-normal-text";
  if (gap > -5) return "text-caution-text";
  return "text-alert-text";
}
