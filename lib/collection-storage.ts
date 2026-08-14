export type CollectionItem = {
  id: string;
  exhibitionArtworkId: string;
  exhibitionId: string;
  exhibitionTitle: string;
  artworkId: string;
  artworkTitle: string;
  artistName: string | null;
  imageUrl: string | null;
  description: string | null;
  review: string;
  createdAt: string;
  updatedAt: string;
};

export const COLLECTION_UPDATED_EVENT = "mcm-collection-updated";

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "요청을 처리하지 못했습니다.");
  return body;
}

export async function listCollectionItems(): Promise<CollectionItem[]> {
  const response = await fetch("/api/collections", { cache: "no-store" });
  const body = await readJson<{ items: CollectionItem[] }>(response);
  return body.items;
}

export async function getCollectionItem(id: string): Promise<CollectionItem | null> {
  const items = await listCollectionItems();
  return items.find((item) => item.exhibitionArtworkId === id || item.id === id) ?? null;
}

export async function saveCollectionItem(input: { exhibitionArtworkId: string; review: string }) {
  const response = await fetch("/api/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const body = await readJson<{ item: CollectionItem }>(response);
  window.dispatchEvent(new Event(COLLECTION_UPDATED_EVENT));
  return body.item;
}
