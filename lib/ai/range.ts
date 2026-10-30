// 질문을 보낸 때의 범위와 응답이 도착한 때의 범위가 같을 때만 응답을 받아들인다.
export function shouldAcceptResponse(currentRangeKey: string, requestRangeKey: string): boolean {
  return currentRangeKey === requestRangeKey;
}
