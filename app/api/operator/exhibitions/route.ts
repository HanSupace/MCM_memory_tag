import { NextRequest, NextResponse } from "next/server";
import { getExhibitionOperator } from "../../../../lib/operator-auth";
import { getDb } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const operator = await getExhibitionOperator(request);
    if (!operator) return NextResponse.json({ error: "전시 운영자 권한이 필요합니다." }, { status: 403 });

    const result = await getDb().query<{ id: string; title: string; status: string }>(
      `SELECT id::text, title, status
       FROM exhibitions
       WHERE published = true
       ORDER BY
         CASE status WHEN 'ongoing' THEN 0 WHEN 'upcoming' THEN 1 ELSE 2 END,
         start_at DESC`,
    );

    return NextResponse.json({
      exhibitions: result.rows.map((row) => ({
        id: row.id,
        title: row.title,
        status: row.status,
      })),
    });
  } catch (error) {
    console.error("운영자 전시 목록 조회 실패", error);
    return NextResponse.json({ error: "운영자 전시 목록을 불러오지 못했습니다." }, { status: 500 });
  }
}
