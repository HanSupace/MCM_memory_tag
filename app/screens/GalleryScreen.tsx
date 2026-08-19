import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { listGalleryPhotos, type GalleryPhoto } from "../../lib/gallery-storage";
import { GalleryIcon } from "../components/MomenteIcons";

type ExhibitionOption = {
  id: string;
  title: string;
  venue: string;
  heroImageUrl?: string | null;
};

type GalleryAlbum = ExhibitionOption & {
  photos: GalleryPhoto[];
};

function albumHeroImage(album: GalleryAlbum) {
  if (album.heroImageUrl) return album.heroImageUrl;
  const title = album.title.toUpperCase();
  if (title.includes("F.A.M")) return "/artworks/fam/infinity.png";
  if (title.includes("WEARABLE")) return "/artworks/wearable-casa/chatty-sofa.png";
  if (title.includes("BE@RBRICK")) return "/artworks/berbrick-wonderland/pause-usa-usa.jpg";
  return null;
}

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
      }));
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

  return (
    <div className="home-content">
      <section className={`gallery-screen${selectedAlbum ? " album-open" : " album-list"}`}>
        <header className="gallery-heading">
          {selectedAlbum ? (
            <div className="gallery-selected-heading">
              <div>
                <h1>{selectedAlbum.title}</h1>
                <p>Photo List · 사진 {selectedAlbum.photos.length}장</p>
              </div>
            </div>
          ) : (
            <div><h1>Exhibition photo album</h1></div>
          )}
        </header>

        {loading && <p className="gallery-message">사진첩을 불러오는 중입니다…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && !selectedAlbum && albums.length === 0 && (
          <div className="gallery-empty-state">
            <span className="gallery-empty-icon" aria-hidden="true"><GalleryIcon size={40} /></span>
            <h2>아직 기록한 사진이 없어요</h2>
            <p>전시 화면에서 전시를 선택하고 카메라 버튼으로 첫 순간을 남겨보세요.</p>
          </div>
        )}

        {!loading && !error && !selectedAlbum && albums.length > 0 && (
          <div className="gallery-album-grid">
            {albums.map((album) => (
              <button type="button" className="gallery-album-button" key={album.id} onClick={() => selectAlbum(album.id)}>
                {albumHeroImage(album) && (
                  <span className="gallery-album-image" aria-hidden="true">
                    <Image src={albumHeroImage(album) as string} alt="" fill sizes="(max-width: 760px) 100vw, 760px" />
                  </span>
                )}
                <span className="gallery-album-shade" aria-hidden="true" />
                <span className="gallery-album-symbol" aria-hidden="true" />
                <span className="gallery-album-copy">
                  <strong>{album.title}</strong>
                </span>
                <span className="gallery-album-count">사진 {album.photos.length}장 <b>→</b></span>
              </button>
            ))}
          </div>
        )}

        {!loading && !error && selectedAlbum && selectedAlbum.photos.length === 0 && (
          <div className="gallery-empty-state">
            <span className="gallery-empty-icon" aria-hidden="true"><GalleryIcon size={40} /></span>
            <h2>아직 기록한 사진이 없어요</h2>
            <p>화면 오른쪽 아래 카메라 버튼으로 첫 순간을 남겨보세요.</p>
            <button type="button" onClick={onOpenCamera}>첫 사진 추가하기</button>
          </div>
        )}

        {!loading && !error && selectedAlbum && selectedAlbum.photos.length > 0 && (
          <div className="gallery-photo-grid gallery-selected-photo-grid">
            {[0, 1].map((column) => (
              <div className="gallery-photo-column" key={column}>
                {selectedAlbum.photos.map((photo, index) => index % 2 === column && (
                  <figure className={`gallery-photo-item photo-shape-${index % 5}`} key={photo.id}>
                    <span className="gallery-photo-frame">
                      <Image
                        src={photo.imageUrl}
                        alt={`${photo.exhibitionTitle}에서 촬영한 사진`}
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 50vw, 360px"
                      />
                    </span>
                  </figure>
                ))}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
