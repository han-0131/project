"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { useApp } from "./AppState";
import { buildCsv, describeRange, exportFileName } from "@/lib/exportCsv";

// 모든 페이지 위쪽의 "CSV 내보내기": 지금 고른 월·지역·유형·현장과 같은 범위를 내려받는다.
export default function ExportButton() {
  const { rows, filter, dashboard } = useApp();
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(null), 6000);
    return () => clearTimeout(t);
  }, [message]);

  const count = dashboard?.metrics.length ?? 0;
  const disabled = !rows || count === 0;
  const reason = !rows ? "먼저 자료를 가져오세요" : count === 0 ? "내보낼 자료가 없습니다" : `${describeRange(filter)} 범위를 내려받습니다`;

  function onClick() {
    if (!dashboard || disabled) return;
    try {
      const csv = buildCsv(dashboard.metrics);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = exportFileName(filter);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage({ tone: "ok", text: `${count}행을 내보냈습니다 (범위: ${describeRange(filter)})` });
    } catch {
      setMessage({ tone: "error", text: "내보내지 못했습니다. 화면은 그대로입니다. 다시 시도해 주세요." });
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={reason}
        className="flex h-8 items-center gap-1.5 rounded bg-white px-3 text-[13px] font-semibold text-header hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download size={15} /> CSV 내보내기
      </button>
      {message ? (
        <div
          role="status"
          className={
            "absolute right-0 top-10 z-30 w-[360px] rounded border px-3 py-2 text-[13px] shadow " +
            (message.tone === "ok" ? "border-normal-line bg-normal-bg text-normal-text" : "border-alert-line bg-alert-bg text-alert-text")
          }
        >
          {message.text}
        </div>
      ) : null}
    </div>
  );
}
