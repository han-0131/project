"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, CalendarDays } from "lucide-react";
import { useApp } from "./AppState";
import ExportButton from "./ExportButton";

const MENU = [
  { href: "/", label: "현황 요약" },
  { href: "/compare", label: "현장별 비교표" },
  { href: "/import", label: "자료 가져오기" },
  { href: "/ask", label: "AI에게 묻기" },
];

export default function Header() {
  const pathname = usePathname();
  const { rows, filter } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-header text-white">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-6 gap-y-2 px-6 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded bg-white text-header">
            <Building2 size={20} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-bold">현장 공정·기성 대시보드</div>
            <div className="text-[11px] text-slate-300">교육용 가상 자료 · 실제 회사 자료가 아닙니다</div>
          </div>
        </div>

        <nav className="flex items-center gap-1" aria-label="주요 메뉴">
          {MENU.map((m) => {
            const active = pathname === m.href;
            return (
              <Link
                key={m.href}
                href={m.href}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded px-3 py-2 text-[14px] font-medium transition-colors " +
                  (active ? "bg-slate-700 text-white shadow-[inset_0_-2px_0_#2563eb]" : "text-slate-300 hover:bg-slate-800 hover:text-white")
                }
              >
                {m.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {rows && filter.month ? (
            <span className="num flex items-center gap-1.5 rounded border border-slate-600 px-2.5 py-1 text-[12px] text-slate-200">
              <CalendarDays size={14} /> 기준 월: {filter.month} 마감
            </span>
          ) : null}
          <ExportButton />
        </div>
      </div>
    </header>
  );
}
