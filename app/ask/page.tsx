"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Bot, Loader2, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/AppState";
import EmptyData from "@/components/EmptyData";
import StatusBadge, { gapColor } from "@/components/StatusBadge";
import { askServer } from "@/lib/ai/client";
import { buildAskPayload, MAX_QUESTION_LENGTH } from "@/lib/ai/payload";
import { resolveCitations } from "@/lib/ai/resolve";
import type { AiAnswer } from "@/lib/ai/types";
import { fmtPercent, fmtPp } from "@/lib/format";
import { ALL } from "@/lib/types";

// 질문 예시: PRD 질문 7번의 답(점검 이유와 기록된 대응 설명)과 정답 숫자 확인용 질문
const EXAMPLES = ["D가 늦어진 원인과 대응은?", "점검 현장은 어디인가요?", "실제 준공일·미수금은?"];

export default function AskPage() {
  const { rows, filter, dashboard, ai, startAsk, finishAsk } = useApp();
  const [text, setText] = useState("");

  const loading = ai.status === "loading";
  const tooLong = text.length > MAX_QUESTION_LENGTH;

  async function submit(question: string) {
    const q = question.trim();
    if (!rows || !q || q.length > MAX_QUESTION_LENGTH || loading) return;
    setText("");
    const { id, rangeKey } = startAsk(q);
    const outcome = await askServer(buildAskPayload(q, rows, filter));
    finishAsk(id, rangeKey, q, outcome);
  }

  if (!rows || !dashboard) return <EmptyData feature="AI에게 묻기" />;

  const part = (v: string, unit: string) => (v === ALL ? `전체 ${unit}` : v);
  const siteLabel = filter.siteId === ALL ? `전체 ${dashboard.scoped.length}개 현장` : `현장 ${filter.siteId}`;

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-lg border border-line bg-header px-5 py-4 text-white" aria-label="지금 범위">
        <p className="text-[12px] text-slate-300">AI가 볼 수 있는 범위 (범위는 현황 요약·현장별 비교표에서 바꿉니다)</p>
        <p className="num mt-1 text-[20px] font-bold" data-testid="ask-range">
          기준 월 {filter.month} 마감 | {part(filter.region, "지역")} | {part(filter.projectType, "유형")} | {siteLabel}
        </p>
        <p className="mt-1 text-[12px] text-slate-300">원칙: 계산은 프로그램이 하고, AI는 기록된 텍스트와 프로그램이 계산한 숫자를 연결해 설명합니다.</p>
      </section>

      <section aria-label="예시 질문">
        <p className="mb-1.5 text-[12px] font-medium text-ink-3">예시 질문 (누르면 바로 질문합니다)</p>
        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((q) => (
            <button
              key={q}
              type="button"
              disabled={loading}
              onClick={() => void submit(q)}
              className="rounded border border-line-strong bg-white px-3 py-2 text-[13px] font-medium text-ink hover:border-action hover:bg-action-soft disabled:cursor-not-allowed disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>
      </section>

      <section aria-label="답변" className="min-h-[200px]" aria-live="polite">
        {ai.status === "idle" ? (
          <div className="rounded-lg border border-dashed border-line-strong bg-card px-6 py-12 text-center text-[14px] text-ink-3">
            질문을 하면 이곳에 답변과 근거(기준 월·현장·근거 숫자·참고한 기록 필드)가 나옵니다.
          </div>
        ) : null}

        {ai.status !== "idle" ? <Bubble question={ai.question} /> : null}

        {ai.status === "loading" ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-line bg-card px-5 py-6 text-[14px] text-ink-2" role="status">
            <Loader2 size={18} className="animate-spin" /> 답변을 기다리는 중입니다. 다른 화면은 계속 쓸 수 있습니다.
          </div>
        ) : null}

        {ai.status === "error" ? (
          <div className="mt-3 rounded-lg border border-alert-line bg-alert-bg p-5" role="alert">
            <p className="flex items-center gap-2 text-[15px] font-semibold text-alert-text">
              <AlertTriangle size={18} /> AI 연결에 실패했습니다
            </p>
            <p className="mt-1 text-[14px] text-alert-text">{ai.message}</p>
            <p className="mt-1 text-[13px] text-ink-2">대시보드와 CSV 내보내기는 계속 사용할 수 있습니다.</p>
            <button
              type="button"
              onClick={() => void submit(ai.question)}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded border border-alert-line bg-white px-3 text-[13px] font-medium text-alert-text hover:bg-alert-bg"
            >
              <RefreshCw size={14} /> 다시 시도
            </button>
          </div>
        ) : null}

        {ai.status === "done" ? <AnswerCard answer={ai.result.answer} mock={ai.result.mock} /> : null}
      </section>

      <section className="rounded-lg border border-line bg-card p-4" aria-label="질문 입력">
        <label htmlFor="ask-input" className="mb-2 block text-[13px] font-semibold">
          현장 데이터에 직접 질문 <span className="font-normal text-ink-3">· 범위: {filter.month} · {siteLabel}</span>
        </label>
        <div className="flex gap-2">
          <textarea
            id="ask-input"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                void submit(text);
              }
            }}
            placeholder="예: D 현장은 왜 늦어졌나요?"
            className="min-h-[56px] flex-1 resize-none rounded border border-line-strong px-3 py-2 text-[14px] outline-none focus:outline-2 focus:outline-action"
          />
          <button
            type="button"
            onClick={() => void submit(text)}
            disabled={loading || text.trim() === "" || tooLong}
            className="flex h-14 items-center gap-2 rounded bg-header px-5 text-[14px] font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={16} /> 질문 전송
          </button>
        </div>
        <div className="mt-1 flex justify-between text-[12px] text-ink-3">
          <span>Enter 전송 · Shift+Enter 줄바꿈</span>
          <span className={tooLong ? "font-semibold text-alert-text" : ""}>
            {tooLong ? `${MAX_QUESTION_LENGTH}자 이내로 입력해 주세요 · ` : ""}
            {text.length}/{MAX_QUESTION_LENGTH}
          </span>
        </div>
      </section>
    </div>
  );
}

function Bubble({ question }: { question: string }) {
  return (
    <div className="rounded-lg border border-line bg-card px-5 py-3">
      <p className="text-[12px] text-ink-3">본사 공무팀 질의</p>
      <p className="text-[16px] font-semibold">{question}</p>
    </div>
  );
}

function AnswerCard({ answer, mock }: { answer: AiAnswer; mock: boolean }) {
  const { rows, filter } = useApp();
  const { resolved, dropped } = useMemo(() => (rows ? resolveCitations(rows, filter, answer) : { resolved: [], dropped: 0 }), [rows, filter, answer]);

  return (
    <article className="mt-3 rounded-lg border border-line bg-card" data-testid="answer-card">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-5 py-3">
        <h2 className="flex items-center gap-2 text-[16px] font-semibold">
          <span className="flex h-8 w-8 items-center justify-center rounded bg-header text-white">
            <Bot size={18} />
          </span>
          답변
        </h2>
        {mock ? (
          <span className="rounded border border-caution-line bg-caution-bg px-2 py-0.5 text-[12px] font-semibold text-caution-text" data-testid="mock-badge">
            모의 응답 (실제 AI 호출이 아님)
          </span>
        ) : (
          <span className="rounded border border-normal-line bg-normal-bg px-2 py-0.5 text-[12px] font-semibold text-normal-text">Gemini 응답</span>
        )}
      </header>

      <div className="space-y-4 px-5 py-4">
        <p className="text-[15px] leading-7">{answer.summary}</p>

        {answer.recordedSituations.length > 0 || answer.plannedResponses.length > 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            <NoteList title="기록된 상황" field="issueSummary" tone="caution" notes={answer.recordedSituations} />
            <NoteList title="계획된 대응" field="actionPlan" tone="action" notes={answer.plannedResponses} />
          </div>
        ) : null}

        {answer.notInData.length > 0 ? (
          <div className="rounded border border-caution-line bg-caution-bg px-4 py-3 text-[13px] text-caution-text">
            <p className="font-semibold">자료 없음</p>
            <p className="mt-0.5">
              {answer.notInData.join(" · ")}은(는) 원본 자료에 포함되어 있지 않아 답할 수 없습니다. 계약상 준공일(contractEndDate)은 예정 일정이며 실제 완료일이 아닙니다.
            </p>
          </div>
        ) : null}

        <div className="rounded border border-line bg-canvas px-4 py-3" data-testid="evidence">
          <p className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
            <ShieldCheck size={15} className="text-normal-dot" /> 근거 (프로그램이 계산한 숫자)
          </p>
          {resolved.length === 0 ? (
            <p className="text-[13px] text-ink-3">이 답변에는 숫자 근거가 붙지 않았습니다.</p>
          ) : (
            <ul className="space-y-1.5">
              {resolved.map((c, i) => (
                <li key={i} className="num text-[13px] leading-6">
                  기준 {c.month} · <b>{c.label}</b>
                  {c.status ? (
                    <>
                      {" "}
                      <StatusBadge status={c.status} />
                    </>
                  ) : null}{" "}
                  · 계획 {fmtPercent(c.planned)} · 실제 {fmtPercent(c.actual)} ·{" "}
                  <span className={`font-semibold ${gapColor(c.gap)}`}>{fmtPp(c.gap)}</span> · 기성률 {fmtPercent(c.progressRate)}
                  {c.fields.length > 0 ? <span className="text-ink-3"> · 참고 필드: {c.fields.join(", ")}</span> : null}
                </li>
              ))}
            </ul>
          )}
          {dropped > 0 ? <p className="mt-1.5 text-[12px] text-caution-text">현재 범위에 없는 월·현장을 가리킨 근거 {dropped}건은 표시하지 않았습니다.</p> : null}
        </div>

        <p className="rounded bg-subtle px-4 py-2.5 text-[12px] leading-5 text-ink-2">
          이 답변은 등록된 월별 기록에 근거하며, 기록된 상황을 원인으로 확정하거나 계획된 대응을 완료된 사실로 보지 않습니다. 실제 준공일·청구액·수금액·미수금은 원본 자료에 없습니다.
        </p>
      </div>
    </article>
  );
}

function NoteList({
  title,
  field,
  tone,
  notes,
}: {
  title: string;
  field: string;
  tone: "caution" | "action";
  notes: AiAnswer["recordedSituations"];
}) {
  const box = tone === "caution" ? "border-caution-line bg-caution-bg/40" : "border-action/30 bg-action-soft/60";
  return (
    <div className={`rounded border p-3 ${box}`}>
      <h3 className="mb-1.5 flex items-center justify-between text-[13px] font-semibold">
        {title}
        <span className="num rounded bg-white px-1.5 py-0.5 text-[11px] font-normal text-ink-3">field: {field}</span>
      </h3>
      {notes.length === 0 ? (
        <p className="text-[13px] text-ink-3">해당 기록 없음</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((n, i) => (
            <li key={i} className="text-[13px] leading-5">
              <span className="num mr-1 rounded bg-white px-1.5 py-0.5 text-[11px] font-semibold">
                {n.siteId} · {n.month}
              </span>
              {n.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
