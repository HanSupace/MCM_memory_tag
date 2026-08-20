import { NextRequest, NextResponse } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "../../../lib/auth";
import { resolveExhibitionId } from "../../../lib/catalog-db";
import { ensureGallerySchema, getDb } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS_PER_EXHIBITION = 50;

type PhotoRow = { id: string; exhibition_id: string; exhibition_title: string; created_at: string };

async function currentUser(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  return token ? getUserBySessionToken(token) : null;
}

function serialize(row: PhotoRow) {
  return {
    id: row.id,
    exhibitionId: row.exhibition_id,
    exhibitionTitle: row.exhibition_title,
    imageUrl: `/api/gallery-photos/${row.id}/image`,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    await ensureGallerySchema();
    const result = await getDb().query<PhotoRow>(
      `SELECT gp.id::text, e.id::text AS exhibition_id, e.title AS exhibition_title, gp.created_at
       FROM gallery_photos gp
       JOIN exhibitions e ON e.id = gp.exhibition_id
       WHERE gp.user_id = $1 AND gp.image_data IS NOT NULL
       ORDER BY gp.created_at DESC`,
      [user.id],
    );
    return NextResponse.json({ photos: result.rows.map(serialize) }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("사진첩 조회 실패", error);
    return NextResponse.json({ error: "사진첩을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await currentUser(request);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    await ensureGallerySchema();
    const formData = await request.formData();
    const reference = formData.get("exhibitionId");
    const photo = formData.get("photo");
    if (typeof reference !== "string" || !(photo instanceof File)) {
      return NextResponse.json({ error: "전시와 사진을 함께 선택해 주세요." }, { status: 400 });
    }
    if (!photo.type.startsWith("image/") || photo.size === 0 || photo.size > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: "5MB 이하의 이미지 파일만 저장할 수 있습니다." }, { status: 400 });
    }

    const db = getDb();
    const exhibitionId = await resolveExhibitionId(db, reference);
    if (!exhibitionId) {
      return NextResponse.json(
        { error: "DB에서 전시를 찾을 수 없습니다. 먼저 전시 시드 데이터를 반영해 주세요." },
        { status: 409 },
      );
    }
    const count = await db.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM gallery_photos WHERE user_id = $1 AND exhibition_id = $2",
      [user.id, exhibitionId],
    );
    if (Number(count.rows[0]?.count ?? "0") >= MAX_PHOTOS_PER_EXHIBITION) {
      return NextResponse.json({ error: "전시별 사진은 최대 50장까지 저장할 수 있습니다." }, { status: 409 });
    }

    const bytes = Buffer.from(await photo.arrayBuffer());
    const inserted = await db.query<{ id: string }>(
      `INSERT INTO gallery_photos (user_id, exhibition_id, file_ref, image_data, mime_type)
       VALUES ($1, $2, 'postgresql', $3, $4)
       RETURNING id::text`,
      [user.id, exhibitionId, bytes, photo.type],
    );
    const result = await db.query<PhotoRow>(
      `SELECT gp.id::text, e.id::text AS exhibition_id, e.title AS exhibition_title, gp.created_at
       FROM gallery_photos gp
       JOIN exhibitions e ON e.id = gp.exhibition_id
       WHERE gp.id = $1 AND gp.user_id = $2`,
      [inserted.rows[0].id, user.id],
    );
    return NextResponse.json({ photo: serialize(result.rows[0]) }, { status: 201 });
  } catch (error) {
    console.error("사진 저장 실패", error);
    return NextResponse.json({ error: "사진을 PostgreSQL에 저장하지 못했습니다." }, { status: 500 });
  }
}
