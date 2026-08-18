import { NextRequest, NextResponse } from "next/server";
import {
  generateEntryToken,
  generateKeyringEntryToken,
  hashEntryToken,
  normalizeEntryToken,
} from "../../../../../lib/exhibition-access";
import { resolveExhibitionId } from "../../../../../lib/catalog-db";
import { getDb } from "../../../../../lib/db";
import { getExhibitionOperator } from "../../../../../lib/operator-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EntryTokenType = "keyring" | "venue_qr";

function isEntryTokenType(value: unknown): value is EntryTokenType {
  return value === "keyring" || value === "venue_qr";
}

async function resolvePublishedExhibition(reference: string) {
  const db = getDb();
  const exhibitionId = await resolveExhibitionId(db, reference);
  if (!exhibitionId) return null;

  const result = await db.query<{ id: string; title: string }>(
    `SELECT id::text, title
     FROM exhibitions
     WHERE id = $1 AND published = true`,
    [exhibitionId],
  );
  return result.rows[0] ?? null;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const operator = await getExhibitionOperator(request);
    if (!operator) return NextResponse.json({ error: "전시 운영자 권한이 필요합니다." }, { status: 403 });

    const { id } = await params;
    const exhibition = await resolvePublishedExhibition(id);
    if (!exhibition) return NextResponse.json({ error: "공개된 전시를 찾을 수 없습니다." }, { status: 404 });

    const result = await getDb().query<{
      id: string;
      token_type: EntryTokenType;
      active: boolean;
      created_at: string;
    }>(
      `SELECT id::text, token_type, active, created_at::text
       FROM exhibition_entry_tokens
       WHERE exhibition_id = $1
       ORDER BY created_at DESC`,
      [exhibition.id],
    );

    return NextResponse.json({
      exhibition: { id: exhibition.id, title: exhibition.title },
      tokens: result.rows.map((row) => ({
        id: row.id,
        type: row.token_type,
        active: row.active,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error("전시 입장 토큰 목록 조회 실패", error);
    return NextResponse.json({ error: "전시 입장 토큰을 불러오지 못했습니다." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const operator = await getExhibitionOperator(request);
    if (!operator) return NextResponse.json({ error: "전시 운영자 권한이 필요합니다." }, { status: 403 });

    const { id } = await params;
    const exhibition = await resolvePublishedExhibition(id);
    if (!exhibition) return NextResponse.json({ error: "공개된 전시를 찾을 수 없습니다." }, { status: 404 });

    const body = await request.json().catch(() => null) as { type?: unknown } | null;
    if (!isEntryTokenType(body?.type)) {
      return NextResponse.json({ error: "토큰 유형은 keyring 또는 venue_qr이어야 합니다." }, { status: 400 });
    }

    const db = getDb();
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const token = body.type === "keyring" ? generateKeyringEntryToken() : generateEntryToken();
      try {
        const result = await db.query<{ id: string; created_at: string }>(
          `INSERT INTO exhibition_entry_tokens (exhibition_id, token_hash, token_type)
           VALUES ($1, $2, $3)
           RETURNING id::text, created_at::text`,
          [exhibition.id, hashEntryToken(token), body.type],
        );
        const row = result.rows[0];
        return NextResponse.json({
          token: {
            id: row.id,
            type: body.type,
            value: token,
            url: new URL(`/visit/${token}`, request.nextUrl.origin).toString(),
            createdAt: row.created_at,
          },
          warning: "보안을 위해 원시 토큰은 지금만 반환됩니다. 키링 NFC 또는 전시장 QR에 이 URL을 기록해 주세요.",
        }, { status: 201 });
      } catch (error) {
        if ((error as { code?: string }).code !== "23505" || attempt === 2) throw error;
      }
    }

    return NextResponse.json({ error: "토큰을 발급하지 못했습니다." }, { status: 500 });
  } catch (error) {
    console.error("전시 입장 토큰 발급 실패", error);
    return NextResponse.json({ error: "전시 입장 토큰을 발급하지 못했습니다." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const operator = await getExhibitionOperator(request);
    if (!operator) return NextResponse.json({ error: "전시 운영자 권한이 필요합니다." }, { status: 403 });

    const { id } = await params;
    const exhibition = await resolvePublishedExhibition(id);
    if (!exhibition) return NextResponse.json({ error: "공개된 전시를 찾을 수 없습니다." }, { status: 404 });

    const body = await request.json().catch(() => null) as { token?: unknown; tokenId?: unknown } | null;
    const tokenId = typeof body?.tokenId === "string" && body.tokenId.trim() ? body.tokenId.trim() : null;
    const token = normalizeEntryToken(body?.token);
    if (!tokenId && !token) return NextResponse.json({ error: "비활성화할 토큰이 올바르지 않습니다." }, { status: 400 });

    const result = await getDb().query(
      `UPDATE exhibition_entry_tokens
       SET active = false
       WHERE exhibition_id = $1
         AND active = true
         AND (${tokenId ? "id = $2" : "token_hash = $2"})
       RETURNING id`,
      [exhibition.id, tokenId ?? hashEntryToken(token as string)],
    );
    if ((result.rowCount ?? 0) === 0) {
      return NextResponse.json({ error: "활성화된 해당 전시 토큰을 찾을 수 없습니다." }, { status: 404 });
    }

    return NextResponse.json({ deactivated: true });
  } catch (error) {
    console.error("전시 입장 토큰 비활성화 실패", error);
    return NextResponse.json({ error: "전시 입장 토큰을 비활성화하지 못했습니다." }, { status: 500 });
  }
}
