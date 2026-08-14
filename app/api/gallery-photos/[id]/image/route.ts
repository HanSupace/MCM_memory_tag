import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../../../lib/auth";
import { ensureGallerySchema, getDb } from "../../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getUserBySessionToken(token) : null;
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { id } = await params;
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "잘못된 사진 ID입니다." }, { status: 400 });

  try {
    await ensureGallerySchema();
    const result = await getDb().query<{ image_data: Buffer; mime_type: string | null }>(
      `SELECT image_data, mime_type
       FROM gallery_photos
       WHERE id = $1 AND user_id = $2 AND image_data IS NOT NULL`,
      [id, user.id],
    );
    const photo = result.rows[0];
    if (!photo) return NextResponse.json({ error: "사진을 찾을 수 없습니다." }, { status: 404 });

    return new NextResponse(new Uint8Array(photo.image_data), {
      headers: {
        "Content-Type": photo.mime_type ?? "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("사진 파일 조회 실패", error);
    return NextResponse.json({ error: "사진을 불러오지 못했습니다." }, { status: 500 });
  }
}
