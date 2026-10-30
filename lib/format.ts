export const NA = "계산 불가";

// 마지막 표시 단계에서만 반올림한다 (0.5는 올림, 음수는 0에서 멀어지는 쪽)
export function roundHalfUp(value: number, digits = 1): number {
  const f = 10 ** digits;
  const sign = value < 0 ? -1 : 1;
  const r = (Math.round(Math.abs(value) * f + 1e-9) / f) * sign;
  return r === 0 ? 0 : r; // -0.0 방지
}

function fixed(value: number, digits = 1): string {
  return roundHalfUp(value, digits).toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// 금액(백만원): 424,063.4
export function fmtMoney(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? NA : fixed(value);
}

// 계약금액(백만원): 원본이 정수라서 630,700처럼 소수점 없이 보여 준다 (정수가 아니면 소수 첫째 자리)
export function fmtContract(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NA;
  return Number.isInteger(value) ? value.toLocaleString("en-US") : fmtMoney(value);
}

// 비율(%): 67.2%
export function fmtPercent(value: number | null | undefined): string {
  return value == null || !Number.isFinite(value) ? NA : `${fixed(value)}%`;
}

// 공정차이(pp): -2.0pp, 양수는 +1.7pp
export function fmtPp(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NA;
  const r = roundHalfUp(value);
  return `${r > 0 ? "+" : ""}${fixed(value)}pp`;
}

// CSV용: 쉼표 없이 소수 첫째 자리까지의 숫자
export function csvNumber(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return NA;
  return roundHalfUp(value).toFixed(1);
}
