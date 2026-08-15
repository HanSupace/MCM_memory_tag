import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { listGalleryPhotos, type GalleryPhoto } from "../../lib/gallery-storage";

type ExhibitionOption = {
  id: string;
  title: string;
  venue: string;
};

type GalleryAlbum = ExhibitionOption & {
  photos: GalleryPhoto[];
};

export function GalleryScreen({
  onOpenCamera,
  initialExhibitionId = null,
  onSelectedExhibitionChange,
}: {
  onOpenCamera: () => void;
  initialExhibitionId?: string | null;
  onSelectedExhibitionChange: (exhibitionId: string | null) => void;
}) {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [exhibitions, setExhibitions] = useState<ExhibitionOption[]>([]);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState<string | null>(initialExhibitionId);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadGallery() {
      try {
        const [storedPhotos, exhibitionResponse] = await Promise.all([
          listGalleryPhotos(),
          fetch("/api/exhibitions", { cache: "no-store" }),
        ]);
        if (!exhibitionResponse.ok) throw new Error("failed");
        const data = await exhibitionResponse.json() as { exhibitions: ExhibitionOption[] };
        if (!active) return;
        setPhotos(storedPhotos);
        setExhibitions(data.exhibitions);
        setError("");
      } catch {
        if (active) setError("사진첩을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    }

    async function reloadPhotos() {
      try {
        const storedPhotos = await listGalleryPhotos();
        if (active) setPhotos(storedPhotos);
      } catch {
        if (active) setError("사진첩을 새로고침하지 못했습니다.");
      }
    }

    void loadGallery();
    window.addEventListener("mcm-gallery-updated", reloadPhotos);

    return () => {
      active = false;
      window.removeEventListener("mcm-gallery-updated", reloadPhotos);
    };
  }, []);

  const albums = useMemo<GalleryAlbum[]>(() => {
    const knownAlbums = exhibitions
      .map((exhibition) => ({
        ...exhibition,
        photos: photos.filter((photo) => photo.exhibitionId === exhibition.id),
      }))
      .filter((album) => album.photos.length > 0);
    const knownIds = new Set(exhibitions.map((exhibition) => exhibition.id));
    const photoOnlyAlbums = photos.reduce<GalleryAlbum[]>((groups, photo) => {
      if (knownIds.has(photo.exhibitionId)) return groups;
      const existing = groups.find((group) => group.id === photo.exhibitionId);
      if (existing) existing.photos.push(photo);
      else groups.push({ id: photo.exhibitionId, title: photo.exhibitionTitle, venue: "", photos: [photo] });
      return groups;
    }, []);
    return [...knownAlbums, ...photoOnlyAlbums];
  }, [exhibitions, photos]);

  const selectedAlbum = albums.find((album) => album.id === selectedExhibitionId) ?? null;

  function selectAlbum(exhibitionId: string) {
    setSelectedExhibitionId(exhibitionId);
    onSelectedExhibitionChange(exhibitionId);
  }

  function closeAlbum() {
    setSelectedExhibitionId(null);
    onSelectedExhibitionChange(null);
  }

  return (
    <div className="home-content">
      <section className="gallery-screen">
        <header className="gallery-heading">
          {selectedAlbum ? (
            <>
              <div className="gallery-selected-heading">
                <button type="button" className="round-back-button" onClick={closeAlbum} aria-label="전시별 사진첩으로 돌아가기">←</button>
                <div>
                  <span className="section-kicker">EXHIBITION ALBUM</span>
                  <h1>{selectedAlbum.title}</h1>
                  <p>{selectedAlbum.venue || "전시에서 기록한 순간"} · 사진 {selectedAlbum.photos.length}장</p>
                </div>
              </div>
              <button type="button" onClick={onOpenCamera}>사진 추가</button>
            </>
          ) : (
            <div>
              <span className="section-kicker">MY ARCHIVE</span>
              <h1>나만의 사진첩</h1>
              <p>전시를 선택하면 그곳에서 기록한 사진을 볼 수 있어요.</p>
            </div>
          )}
        </header>

        {loading && <p className="gallery-message">사진첩을 불러오는 중입니다…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && !selectedAlbum && albums.length === 0 && (
          <div className="gallery-empty-state">
            <span className="gallery-empty-icon" aria-hidden="true" />
            <h2>아직 기록한 사진이 없어요</h2>
            <p>전시 화면에서 전시를 선택하고 카메라 버튼으로 첫 순간을 남겨보세요.</p>
          </div>
        )}

        {!loading && !error && !selectedAlbum && albums.length > 0 && (
          <div className="gallery-album-grid">
            {albums.map((album, index) => (
              <button type="button" className="gallery-album-button" key={album.id} onClick={() => selectAlbum(album.id)}>
                <span className="gallery-album-number">{String(index + 1).padStart(2, "0")}</span>
                <span className="gallery-album-symbol" aria-hidden="true" />
                <span className="gallery-album-copy">
                  <strong>{album.title}</strong>
                  <small>{album.venue || "전시 기록"}</small>
                </span>
                <span className="gallery-album-count">사진 {album.photos.length}장 <b>→</b></span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && selectedAlbum && selectedAlbum.photos.length === 0 && (
          <div className="gallery-empty-state">
            <span className="gallery-empty-icon" aria-hidden="true" />
            <h2>아직 기록한 사진이 없어요</h2>
            <p>화면 오른쪽 아래 카메라 버튼으로 첫 순간을 남겨보세요.</p>
            <button type="button" onClick={onOpenCamera}>첫 사진 추가하기</button>
          </div>
        )}

        {!loading && !error && selectedAlbum && selectedAlbum.photos.length > 0 && (
          <div className="gallery-photo-grid gallery-selected-photo-grid">
            {selectedAlbum.photos.map((photo) => (
              <figure key={photo.id}>
                <span className="gallery-photo-frame">
                  <Image
                    src={photo.imageUrl}
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
        )}
      </section>
    </div>
  );
}
