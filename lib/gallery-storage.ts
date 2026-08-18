export type GalleryPhoto = {
  id: string;
  exhibitionId: string;
  exhibitionTitle: string;
  imageUrl: string;
  createdAt: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const body = await response.json() as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? "요청을 처리하지 못했습니다.");
  return body;
}

export async function saveGalleryPhoto(exhibitionId: string, photo: Blob) {
  const formData = new FormData();
  formData.set("exhibitionId", exhibitionId);
  formData.set("photo", photo, "capture.jpg");
  const response = await fetch("/api/gallery-photos", { method: "POST", body: formData });
  return readJson<{ photo: GalleryPhoto }>(response);
}

export async function listGalleryPhotos(): Promise<GalleryPhoto[]> {
  const response = await fetch("/api/gallery-photos", { cache: "no-store" });
  const body = await readJson<{ photos: GalleryPhoto[] }>(response);
  return body.photos;
}
