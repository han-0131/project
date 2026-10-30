import { NextResponse } from "next/server";
import { askGemini } from "@/lib/ai/gemini";
import { failure } from "@/lib/ai/errors";
import { mockAnswer } from "@/lib/ai/mock";
import { MAX_QUESTION_LENGTH, type AskPayload } from "@/lib/ai/payload";
import type { AskResult } from "@/lib/ai/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BODY_CHARS = 300_000;

function isPayload(v: unknown): v is AskPayload {
  if (typeof v !== "object" || v === null) return false;
  const p = v as Partial<AskPayload>;
  return (
    typeof p.question === "string" &&
    p.question.trim().length > 0 &&
    p.question.length <= MAX_QUESTION_LENGTH &&
    typeof p.range === "object" &&
    p.range !== null &&
    typeof p.range.month === "string" &&
    Array.isArray(p.range.monthsCovered) &&
    Array.isArray(p.records) &&
    p.records.length <= 200 &&
    Array.isArray(p.computed) &&
    typeof p.summary === "object" &&
    p.summary !== null
  );
}

// 질문과 범위 자료를 받아 Gemini에 전달한다. 질문·자료 내용은 저장하거나 기록하지 않는다.
export async function POST(request: Request): Promise<NextResponse<AskResult>> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return NextResponse.json(failure("bad_request"), { status: 400 });
  }
  if (text.length > MAX_BODY_CHARS) return NextResponse.json(failure("bad_request"), { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json(failure("bad_request"), { status: 400 });
  }
  if (!isPayload(body)) return NextResponse.json(failure("bad_request"), { status: 400 });

  // 모의 응답: 실제 AI를 부르지 않는다 (키 없이 화면을 확인할 때)
  if (process.env.AI_MOCK === "1") {
    return NextResponse.json({ ok: true, mock: true, answer: mockAnswer(body) });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json(failure("no_key"));

  return NextResponse.json(await askGemini(body, apiKey));
}
