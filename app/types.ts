export type AuthUser = {
  id: string;
  username: string;
  role: "visitor" | "exhibition_operator" | "content_operator";
  displayName?: string | null;
  profileImageUrl?: string | null;
};
