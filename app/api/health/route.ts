import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 데이터베이스나 외부 API를 전혀 건드리지 않는 초경량 상태 확인 엔드포인트.
// Render 무료 인스턴스의 슬립 방지 핑(.github/workflows/keep-awake.yml)과
// render.yaml의 배포 헬스체크가 이 경로를 사용한다.
export async function GET() {
  return NextResponse.json(
    { ok: true, timestamp: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
