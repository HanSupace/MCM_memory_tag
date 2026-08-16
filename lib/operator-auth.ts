import { NextRequest } from "next/server";
import { getUserBySessionToken, SESSION_COOKIE_NAME, type PublicUser } from "./auth";
import { getDb } from "./db";

export async function getExhibitionOperator(request: NextRequest): Promise<PublicUser | null> {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = sessionToken ? await getUserBySessionToken(sessionToken) : null;
  if (!user) return null;

  const result = await getDb().query<{ role: string }>(
    "SELECT role FROM app_users WHERE id = $1",
    [user.id],
  );
  return result.rows[0]?.role === "exhibition_operator" ? user : null;
}
