"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { CheckCircle2, FileUp, ShieldCheck, XCircle, AlertTriangle } from "lucide-react";
import { useApp } from "@/components/AppState";
import StatusBadge from "@/components/StatusBadge";
import { buildDashboard, defaultMonth, monthsOf } from "@/lib/calc";
import { fmtContract, fmtMoney, fmtPercent, fmtPp } from "@/lib/format";
import { parseCsv, parseJson } from "@/lib/parse";
import { looksBroken, validateFile, type ValidationResult } from "@/lib/validate";
import { ALL, FIELD_NAMES } from "@/lib/types";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_ISSUES_SHOWN = 20;

type Stage =
  | { name: "idle" }
  | { name: "checking"; fileName: string }
  | { name: "problem"; fileName: string; size: number; message: string } // 파일 자체를 읽지 못함
  | { name: "result"; fileName: string; size: number; result: ValidationResult }
  | { name: "done"; fileName: string; count: number }
  | { name: "cancelled" };

function sizeText(bytes: number): string {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ImportPage() {
  const { rows, loadRows } = useApp();
  const [stage, setStage] = useState<Stage>({ name: "idle" });
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setStage({ name: "checking", fileName: file.name });
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".csv") && !lower.endsWith(".json")) {
      setStage({ name: "problem", fileName: file.name, size: file.size, message: "CSV 또는 JSON 파일만 가져올 수 있습니다." });
      return;
    }
    if (file.size === 0) {
      setStage({ name: "problem", fileName: file.name, size: 0, message: "빈 파일입니다. 자료가 들어 있는 파일을 고르세요." });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStage({ name: "problem", fileName: file.name, size: file.size, message: "파일이 너무 큽니다(5MB 이하만 가져올 수 있습니다)." });
      return;
    }
    try {
      const text = await file.text();
      if (looksBroken(text)) {
        setStage({
          name: "problem",
          fileName: file.name,
          size: file.size,
          message: "글자가 깨져 읽혔습니다. 파일을 UTF-8로 저장했는지 확인하세요.",
        });
        return;
      }
      const raw = lower.endsWith(".json") ? parseJson(text) : parseCsv(text);
      setStage({ name: "result", fileName: file.name, size: file.size, result: validateFile(raw) });
    } catch {
      setStage({ name: "problem", fileName: file.name, size: file.size, message: "파일을 읽지 못했습니다. 지금 자료는 그대로입니다." });
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 동작하게
    if (file) void handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  function confirm() {
    if (stage.name !== "result" || !stage.result.ok) return;
    try {
      loadRows(stage.result.rows); // 지금 자료를 지우고 새 파일의 행만으로 전체 교체
      setStage({ name: "done", fileName: stage.fileName, count: stage.result.rows.length });
    } catch {
      setStage({ name: "problem", fileName: stage.fileName, size: stage.size, message: "반영하지 못했습니다. 지금 자료는 그대로입니다." });
    }
  }

  // 지금 자료가 있으면 그 기준 숫자를 안내문에 보여 준다
  const current = rows ? buildDashboard(rows, { month: defaultMonth(rows), region: ALL, projectType: ALL, siteId: ALL }) : null;
  const keepNote = rows && current
    ? `지금 자료는 그대로 유지됩니다 (${rows.length}행 · ${defaultMonth(rows)} 기성률 ${fmtPercent(current.agg.progressRate)} · 점검 ${current.agg.counts.점검}곳).`
    : "아직 가져온 자료가 없으므로 비어 있는 상태 그대로입니다.";

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-line bg-card p-5">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded bg-header text-white">
            <FileUp size={22} />
          </span>
          <div>
            <h1 className="text-[20px] font-bold">자료 가져오기 및 검사</h1>
            <p className="text-[13px] text-ink-3">CSV 또는 JSON 파일을 검사하고 미리 본 뒤 확정하면 지금 자료 전체가 바뀝니다. 오류가 있거나 취소하면 지금 자료는 그대로입니다.</p>
          </div>
        </div>
        <p className="num mt-3 rounded bg-subtle px-3 py-2 text-[13px] text-ink-2" data-testid="current-data">
          {rows ? (
            <>
              지금 자료: <b>{rows.length}행</b> · {monthsOf(rows)[0]} ~ {monthsOf(rows).at(-1)} · 현장 {new Set(rows.map((r) => r.siteId)).size}곳
            </>
          ) : (
            "지금 자료: 아직 가져온 자료가 없습니다"
          )}
        </p>
      </section>

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <section className="flex flex-col gap-4">
          <div className="rounded-lg border border-line bg-card p-4">
            <h2 className="mb-3 text-[16px] font-semibold">데이터 파일 등록</h2>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={
                "flex flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center " +
                (dragging ? "border-action bg-action-soft" : "border-blue-300 bg-white")
              }
            >
              <FileUp size={28} className="text-action" />
              <p className="text-[15px] font-semibold">CSV 또는 JSON 파일을 끌어다 놓으세요</p>
              <p className="text-[13px] text-ink-3">또는 내 컴퓨터에서 직접 선택하세요</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-2 h-9 rounded bg-header px-4 text-[14px] font-medium text-white hover:bg-slate-800"
              >
                파일 직접 선택
              </button>
              <input ref={inputRef} type="file" accept=".csv,.json,text/csv,application/json" className="hidden" onChange={onPick} data-testid="file-input" />
            </div>
            <ul className="mt-3 space-y-1 text-[12px] text-ink-2">
              <li className="flex gap-1.5"><CheckCircle2 size={14} className="mt-0.5 text-normal-dot" /> UTF-8 글자(한글 깨짐 확인)</li>
              <li className="flex gap-1.5"><CheckCircle2 size={14} className="mt-0.5 text-normal-dot" /> 15개 필수 열: {FIELD_NAMES.length}개 이름 확인</li>
              <li className="flex gap-1.5"><CheckCircle2 size={14} className="mt-0.5 text-normal-dot" /> 원본 144행(현장 12곳 × 12개월)이 정상 규격입니다</li>
            </ul>
          </div>
          <div className="rounded-lg border border-line bg-white p-4">
            <h2 className="mb-1 flex items-center gap-1.5 text-[15px] font-semibold">
              <ShieldCheck size={16} className="text-caution-dot" /> 잘못된 파일은 반영되지 않습니다
            </h2>
            <p className="text-[13px] text-ink-2">
              필수 열 누락, 빈 값, 범위를 벗어난 값, 같은 월·현장의 중복이 있으면 거부하고 어느 줄의 무엇이 문제인지 알려 드립니다. 그때 지금 자료는 바뀌지 않습니다.
            </p>
          </div>
        </section>

        <section className="min-w-0">
          {stage.name === "idle" ? (
            <div className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-16 text-center text-[14px] text-ink-3">
              파일을 고르면 이곳에 검사 결과와 미리보기가 나옵니다.
            </div>
          ) : null}

          {stage.name === "checking" ? (
            <div className="rounded-lg border border-line bg-card px-6 py-10 text-center text-[14px] text-ink-2" role="status">
              <b>{stage.fileName}</b> 검사 중입니다…
            </div>
          ) : null}

          {stage.name === "cancelled" ? (
            <div className="rounded-lg border border-line bg-card px-6 py-8 text-center" role="status">
              <p className="text-[15px] font-semibold">가져오기를 취소했습니다</p>
              <p className="mt-1 text-[13px] text-ink-2">{keepNote}</p>
            </div>
          ) : null}

          {stage.name === "problem" ? (
            <div className="rounded-lg border border-alert-line bg-alert-bg p-5" role="alert">
              <p className="flex items-center gap-2 text-[16px] font-semibold text-alert-text">
                <XCircle size={18} /> 가져오기 오류 — {stage.fileName}
              </p>
              <p className="mt-2 text-[14px] text-alert-text">{stage.message}</p>
              <p className="mt-2 text-[13px] text-ink-2">{keepNote}</p>
            </div>
          ) : null}

          {stage.name === "done" ? (
            <div className="rounded-lg border border-normal-line bg-normal-bg p-6" role="status">
              <p className="flex items-center gap-2 text-[17px] font-semibold text-normal-text">
                <CheckCircle2 size={20} /> 완료: {stage.count}행을 반영했습니다
              </p>
              <p className="mt-1 text-[13px] text-ink-2">{stage.fileName}의 자료로 전체를 바꿨습니다. 필터는 처음 상태(가장 늦은 월 · 전체)로 돌아갔습니다.</p>
              <Link href="/" className="mt-4 inline-flex h-9 items-center rounded bg-header px-4 text-[14px] font-medium text-white hover:bg-slate-800">
                현황 요약으로 이동
              </Link>
            </div>
          ) : null}

          {stage.name === "result" ? <ResultView stage={stage} keepNote={keepNote} onConfirm={confirm} onCancel={() => setStage({ name: "cancelled" })} /> : null}
        </section>
      </div>
    </div>
  );
}

function ResultView({
  stage,
  keepNote,
  onConfirm,
  onCancel,
}: {
  stage: Extract<Stage, { name: "result" }>;
  keepNote: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { result } = stage;

  if (!result.ok) {
    const shown = result.issues.slice(0, MAX_ISSUES_SHOWN);
    const rest = result.issues.length - shown.length;
    return (
      <div className="rounded-lg border border-alert-line bg-card" role="alert">
        <div className="border-b border-alert-line bg-alert-bg p-4">
          <p className="flex items-center gap-2 text-[16px] font-semibold text-alert-text">
            <XCircle size={18} /> 가져오기 오류 — {stage.fileName} (오류 {result.issues.length}건)
          </p>
          <p className="mt-1 text-[13px] text-ink-2">{keepNote}</p>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-line text-ink-3">
                <th className="py-1.5 pr-4 font-semibold">위치</th>
                <th className="py-1.5 pr-4 font-semibold">열</th>
                <th className="py-1.5 pr-4 font-semibold">문제</th>
                <th className="py-1.5 font-semibold">입력값</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((it, i) => (
                <tr key={i} className="border-b border-subtle align-top">
                  <td className="num py-1.5 pr-4 font-semibold">{it.line == null ? "파일 전체" : `${it.line}${result.lineLabel}`}</td>
                  <td className="num py-1.5 pr-4">{it.field}</td>
                  <td className="py-1.5 pr-4 text-alert-text">{it.message}</td>
                  <td className="num py-1.5 text-ink-2">{it.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rest > 0 ? <p className="mt-2 text-[12px] text-ink-3">외 {rest}건</p> : null}
        </div>
      </div>
    );
  }

  const month = defaultMonth(result.rows);
  const preview = buildDashboard(result.rows, { month, region: ALL, projectType: ALL, siteId: ALL });
  const sample = [...preview.metrics].sort((a, b) => a.row.siteId.localeCompare(b.row.siteId)).slice(0, 5);
  const siteCount = new Set(result.rows.map((r) => r.siteId)).size;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-line bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-[15px] font-semibold text-normal-text">
            <span className="inline-flex items-center gap-1 rounded border border-normal-line bg-normal-bg px-2 py-0.5 text-[13px]">
              <CheckCircle2 size={14} /> 검증 통과
            </span>
            <span className="num text-ink">{stage.fileName}</span>
            <span className="text-[12px] font-normal text-ink-3">({sizeText(stage.size)})</span>
          </p>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Card title="총 데이터 행" value={`${result.rows.length}`} unit="행" note={`현장 ${siteCount}곳 × ${new Set(result.rows.map((r) => r.month)).size}개월`} />
          <Card title="필수 열 검사" value={`${FIELD_NAMES.length} / ${FIELD_NAMES.length}`} unit="개" note="누락 없음" />
          <Card title="데이터 오류" value="0" unit="건" note="빈 값·범위·중복 없음" />
          <Card title="계산해서 추가할 열" value="+4" unit="개" note="기성률·공정차이·상태·당월기성액" />
        </div>
        {result.notes.map((n) => (
          <p key={n} className="mt-3 rounded bg-subtle px-3 py-2 text-[12px] text-ink-2">{n}</p>
        ))}
        {result.warnings.map((w) => (
          <p key={w} className="mt-2 flex items-start gap-1.5 rounded border border-caution-line bg-caution-bg px-3 py-2 text-[12px] text-caution-text">
            <AlertTriangle size={14} className="mt-0.5 shrink-0" /> 경고: {w}
          </p>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-card p-4">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-[16px] font-semibold">미리보기</h2>
          <span className="num text-[12px] text-ink-3">기준 {month} · 전체 {preview.metrics.length}개 현장 중 앞 5곳</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px]">
            <thead>
              <tr className="border-b border-line text-left text-ink-3">
                <th className="py-1.5 pr-3 font-semibold">현장</th>
                <th className="py-1.5 pr-3 font-semibold">지역 · 유형</th>
                <th className="py-1.5 pr-3 text-right font-semibold">계약금액</th>
                <th className="py-1.5 pr-3 text-right font-semibold">누적기성액</th>
                <th className="py-1.5 pr-3 text-right font-semibold">기성률</th>
                <th className="py-1.5 pr-3 text-right font-semibold">계획</th>
                <th className="py-1.5 pr-3 text-right font-semibold">실제</th>
                <th className="py-1.5 pr-3 text-right font-semibold">공정차이</th>
                <th className="py-1.5 font-semibold">상태</th>
              </tr>
            </thead>
            <tbody>
              {sample.map((m) => (
                <tr key={m.row.siteId} className="border-b border-subtle">
                  <td className="py-1.5 pr-3 font-medium">{m.row.siteId} {m.row.siteName}</td>
                  <td className="py-1.5 pr-3 text-ink-2">{m.row.region} · {m.row.projectType}</td>
                  <td className="num py-1.5 pr-3 text-right">{fmtContract(m.row.contractAmount)}</td>
                  <td className="num py-1.5 pr-3 text-right">{fmtMoney(m.row.cumulativeEarned)}</td>
                  <td className="num py-1.5 pr-3 text-right">{fmtPercent(m.progressRate)}</td>
                  <td className="num py-1.5 pr-3 text-right">{fmtPercent(m.row.plannedProgress)}</td>
                  <td className="num py-1.5 pr-3 text-right">{fmtPercent(m.row.actualProgress)}</td>
                  <td className="num py-1.5 pr-3 text-right">{fmtPp(m.gap)}</td>
                  <td className="py-1.5"><StatusBadge status={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-[12px] text-ink-3">확정하면 지금 자료 전체가 이 파일로 바뀝니다 (누적하지 않고 교체).</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-card p-4">
        <div>
          <p className="text-[15px] font-semibold">교체 대기 상태입니다</p>
          <p className="text-[13px] text-ink-2">모든 검사를 통과했습니다. 확정하기 전에는 지금 자료가 그대로 유지됩니다.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="h-9 rounded border border-line-strong bg-white px-4 text-[14px] font-medium text-ink-2 hover:bg-canvas">
            취소 (지금 자료 유지)
          </button>
          <button type="button" onClick={onConfirm} className="h-9 rounded bg-header px-4 text-[14px] font-medium text-white hover:bg-slate-800">
            자료 교체 확정
          </button>
        </div>
      </div>
    </div>
  );
}

function Card({ title, value, unit, note }: { title: string; value: string; unit: string; note: string }) {
  return (
    <div className="rounded border border-line bg-white px-3 py-2.5">
      <div className="text-[12px] text-ink-3">{title}</div>
      <div className="num text-[26px] font-bold leading-9">
        {value} <span className="text-[13px] font-medium text-ink-3">{unit}</span>
      </div>
      <div className="text-[12px] text-normal-text">{note}</div>
    </div>
  );
}
