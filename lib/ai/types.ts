export type AiErrorKind = "no_key" | "bad_key" | "quota" | "timeout" | "network" | "format" | "bad_request" | "server";

export interface AiCitation {
  month: string;
  siteId: string;
  fields: string[]; // 참고한 기록 필드 이름
}

export interface AiNote {
  siteId: string;
  month: string;
  text: string;
}

// AI가 돌려주는 답변. 숫자는 여기 담기지 않고 화면이 프로그램 계산값으로 채운다.
export interface AiAnswer {
  summary: string;
  recordedSituations: AiNote[]; // 기록된 상황 (issueSummary)
  plannedResponses: AiNote[]; // 계획된 대응 (actionPlan)
  notInData: string[]; // 자료에 없어 답할 수 없는 항목
  citations: AiCitation[];
}

export type AskResult =
  | { ok: true; mock: boolean; answer: AiAnswer }
  | { ok: false; error: { kind: AiErrorKind; message: string } };
