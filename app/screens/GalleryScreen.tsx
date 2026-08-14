import { useEffect, useState } from "react";
import Image from "next/image";
import { listGalleryPhotos, type LocalGalleryPhoto } from "../../lib/gallery-storage";

type GalleryPhotoView = LocalGalleryPhoto & { objectUrl: string };

export function GalleryScreen({ onOpenCamera }: { onOpenCamera: () => void }) {
  const [photos, setPhotos] = useState<GalleryPhotoView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    let objectUrls: string[] = [];

    async function loadPhotos() {
      try {
        const storedPhotos = await listGalleryPhotos();
        if (!active) return;
        objectUrls.forEach((url) => URL.revokeObjectURL(url));
        objectUrls = storedPhotos.map((photo) => URL.createObjectURL(photo.blob));
        setPhotos(storedPhotos.map((photo, index) => ({ ...photo, objectUrl: objectUrls[index] })));
        setError("");
      } catch {
        if (active) setError("사진첩을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadPhotos();
    window.addEventListener("mcm-gallery-updated", loadPhotos);

    return () => {
      active = false;
      window.removeEventListener("mcm-gallery-updated", loadPhotos);
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const groupedPhotos = photos.reduce<Array<{ exhibitionId: string; title: string; photos: GalleryPhotoView[] }>>(
    (groups, photo) => {
      const group = groups.find((item) => item.exhibitionId === photo.exhibitionId);
      if (group) group.photos.push(photo);
      else groups.push({ exhibitionId: photo.exhibitionId, title: photo.exhibitionTitle, photos: [photo] });
      return groups;
    },
    [],
  );

  return (
    <div className="home-content">
      <section className="gallery-screen">
        <header className="gallery-heading">
          <div>
            <span className="section-kicker">MY ARCHIVE</span>
            <h1>나만의 사진첩</h1>
            <p>전시에서 기록한 순간을 전시회별로 모아보세요.</p>
          </div>
          <button type="button" onClick={onOpenCamera}>사진 추가</button>
        </header>

        {loading && <p className="gallery-message">사진을 불러오는 중입니다…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && photos.length === 0 && (
          <div className="gallery-empty-state">
            <span className="gallery-empty-icon" aria-hidden="true" />
            <h2>아직 기록한 사진이 없어요</h2>
            <p>카메라 버튼으로 전시의 첫 순간을 남겨보세요.</p>
            <button type="button" onClick={onOpenCamera}>첫 사진 추가하기</button>
          </div>
        )}

        {groupedPhotos.map((group) => (
          <section className="gallery-exhibition-group" key={group.exhibitionId}>
            <div className="gallery-group-heading">
              <h2>{group.title}</h2>
              <span>{group.photos.length}장</span>
            </div>
            <div className="gallery-photo-grid">
              {group.photos.map((photo) => (
                <figure key={photo.id}>
                  <span className="gallery-photo-frame">
                    <Image
                      src={photo.objectUrl}
                      alt={`${photo.exhibitionTitle}에서 촬영한 사진`}
                      fill
                      unoptimized
                      sizes="(max-width: 640px) 50vw, 33vw"
                    />
                  </span>
                  <figcaption>{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(photo.createdAt))}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}
