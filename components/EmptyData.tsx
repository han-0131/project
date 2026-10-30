import Link from "next/link";
import { FileUp } from "lucide-react";

// 자료 없음 상태: 처음 열었을 때, 새로고침한 뒤
export default function EmptyData({ feature }: { feature?: string }) {
  return (
    <section className="mx-auto mt-10 max-w-xl rounded-lg border border-line bg-card p-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-subtle text-ink-3">
        <FileUp size={24} />
      </div>
      <h1 className="text-[18px] font-semibold">아직 가져온 자료가 없습니다</h1>
      <p className="mt-2 text-[14px] text-ink-2">
        {feature ? `${feature}을(를) 쓰려면 ` : ""}먼저 CSV 또는 JSON 파일을 가져오세요. 새로고침하면 파일을 다시 가져와야 합니다.
      </p>
      <p className="num mt-4 text-[13px] text-ink-3">기성률 — · 계획 공정률 — · 실제 공정률 — · 공정차이 —</p>
      <Link
        href="/import"
        className="mt-6 inline-flex h-9 items-center rounded bg-header px-4 text-[14px] font-medium text-white hover:bg-slate-800"
      >
        자료 가져오기로 이동
      </Link>
    </section>
  );
}
