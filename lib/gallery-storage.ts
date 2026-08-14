export type LocalGalleryPhoto = {
  id: string;
  exhibitionId: string;
  exhibitionTitle: string;
  blob: Blob;
  createdAt: string;
};

const DATABASE_NAME = "mcm-memory-tag-gallery";
const STORE_NAME = "photos";
const DATABASE_VERSION = 1;

function openGalleryDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (database.objectStoreNames.contains(STORE_NAME)) return;

      const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
      store.createIndex("exhibitionId", "exhibitionId", { unique: false });
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("사진첩을 열지 못했습니다."));
  });
}

export async function saveGalleryPhoto(photo: LocalGalleryPhoto) {
  const database = await openGalleryDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(photo);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("사진을 저장하지 못했습니다."));
  });

  database.close();
}

export async function listGalleryPhotos(): Promise<LocalGalleryPhoto[]> {
  const database = await openGalleryDatabase();
  const photos = await new Promise<LocalGalleryPhoto[]>((resolve, reject) => {
    const request = database.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result as LocalGalleryPhoto[]);
    request.onerror = () => reject(request.error ?? new Error("사진을 불러오지 못했습니다."));
  });

  database.close();
  return photos.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
