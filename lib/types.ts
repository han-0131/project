// 원본 자료의 한 행 = 한 현장의 한 달 월말 상태 (15개 열)
export interface SiteMonthRow {
  month: string; // YYYY-MM
  siteId: string; // A~L
  siteName: string;
  contractAmount: number; // 백만원
  plannedProgress: number; // 월말 누적 계획공정률 %
  actualProgress: number; // 월말 누적 실제공정률 %
  cumulativeEarned: number; // 월말 누적기성액 백만원
  region: string;
  projectType: string;
  startDate: string; // YYYY-MM-DD
  contractEndDate: string; // 계약상 준공일 (예정 일정)
  currentWork: string;
  issueCategory: string; // 현장 기록 분류 (상태 판정과 무관)
  issueSummary: string; // 기록된 상황
  actionPlan: string; // 기록된 대응 계획
}

export const FIELD_NAMES = [
  "month",
  "siteId",
  "siteName",
  "contractAmount",
  "plannedProgress",
  "actualProgress",
  "cumulativeEarned",
  "region",
  "projectType",
  "startDate",
  "contractEndDate",
  "currentWork",
  "issueCategory",
  "issueSummary",
  "actionPlan",
] as const;

export type FieldName = (typeof FIELD_NAMES)[number];

export const NUMBER_FIELDS: FieldName[] = [
  "contractAmount",
  "plannedProgress",
  "actualProgress",
  "cumulativeEarned",
];

export const REGIONS = ["인천", "경기", "충남", "충북", "세종", "강원", "대전"] as const;
export const PROJECT_TYPES = ["공동주택", "물류시설", "업무시설", "상업시설", "생산시설"] as const;

export const ALL = "전체";

export type Status = "정상" | "주의" | "점검";

export interface Filter {
  month: string;
  region: string; // ALL 또는 지역
  projectType: string; // ALL 또는 유형
  siteId: string; // ALL 또는 현장 ID
}

// 가져오기 검사에서 나온 문제 한 건
export interface ImportIssue {
  line: number | null; // 파일 줄 번호(CSV) 또는 항목 번호(JSON). 파일 전체 문제는 null
  field: string;
  message: string;
  value: string;
}
