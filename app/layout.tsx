import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/components/AppState";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "현장 공정·기성 대시보드 (교육용)",
  description: "교육용 가상 자료로 현장별 공정·기성 현황을 보고 점검 현장을 찾는 대시보드",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-canvas text-ink antialiased">
        <AppProvider>
          <Header />
          <main className="mx-auto max-w-[1600px] px-6 py-5">{children}</main>
          <footer className="mx-auto max-w-[1600px] px-6 pb-8 pt-2 text-[12px] text-ink-3">
            교육용 가상 자료 · 단위: 금액 백만원, 비율 %, 공정차이 pp · 화면의 상태 판정과 가중 공정률은 교육용 규칙입니다.
          </footer>
        </AppProvider>
      </body>
    </html>
  );
}
