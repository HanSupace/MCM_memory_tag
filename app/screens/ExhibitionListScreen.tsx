import { useEffect, useState } from "react";
import { ExhibitionDetailScreen } from "./ExhibitionDetailScreen";

type ExhibitionStatus = "upcoming" | "ongoing" | "ended";

type ExhibitionSummary = {
  id: string;
  title: string;
  venue: string;
  heroImageUrl: string | null;
  startAt: string;
  endAt: string;
  status: ExhibitionStatus;
  representativeArtists: string[];
};

const exhibitionFallbackImages = [
  { test: (title: string) => title.toUpperCase().includes("F.A.M"), url: "/artworks/exhibition-venues/fam.png" },
  { test: (title: string) => title.toUpperCase().includes("WEARABLE") || title.includes("웨어러블"), url: "/artworks/exhibition-venues/wearable-casa.png" },
  { test: (title: string) => title.toUpperCase().includes("BE@RBRICK"), url: "/artworks/exhibition-venues/bearbrick.png" },
];

function formatDateRange(startAt: string, endAt: string) {
  const format = (value: string) => {
    const date = new Date(value);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };
  return `${format(startAt)} – ${format(endAt)}`;
}

function getExhibitionImage(exhibition: ExhibitionSummary) {
  return exhibition.heroImageUrl ?? exhibitionFallbackImages.find((item) => item.test(exhibition.title))?.url ?? null;
}

function formatArtists(artists: string[]) {
  if (artists.length === 0) return "대표 아티스트 미정";
  if (artists.length === 1) return artists[0];
  return `${artists[0]} 외 ${artists.length - 1}인`;
}

export function ExhibitionListScreen({
  announce,
  initialExhibitionId = null,
  initialArtworkId = null,
  onActiveExhibitionChange,
  onArtworkChange,
  onOpenPersonalHall,
}: {
  announce: (message: string) => void;
  initialExhibitionId?: string | null;
  initialArtworkId?: string | null;
  onActiveExhibitionChange?: (exhibitionId: string | null) => void;
  onArtworkChange?: (artworkId: string | null) => void;
  onOpenPersonalHall: (exhibitionId: string) => void;
}) {
  const [exhibitions, setExhibitions] = useState<ExhibitionSummary[] | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialExhibitionId);

  useEffect(() => {
    onActiveExhibitionChange?.(selectedId);
  }, [onActiveExhibitionChange, selectedId]);

  useEffect(() => {
    let active = true;

    fetch("/api/exhibitions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { exhibitions: ExhibitionSummary[] };
        return data.exhibitions;
      })
      .then((list) => {
        if (active) setExhibitions(list);
      })
      .catch(() => {
        if (active) setError("전시 목록을 불러오지 못했습니다.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (selectedId) {
    return (
      <ExhibitionDetailScreen
        exhibitionId={selectedId}
        initialArtworkId={initialArtworkId}
        onBack={() => {
          setSelectedId(null);
          onActiveExhibitionChange?.(null);
        }}
        onArtworkChange={onArtworkChange}
        onOpenPersonalHall={onOpenPersonalHall}
        announce={announce}
      />
    );
  }

  return (
    <div className="home-content momente-exhibition-list-page">
      <section className="momente-exhibition-list-section">
        <h1>Exhibition List</h1>
        {error && <p className="form-error">{error}</p>}
        {!error && exhibitions === null && <p>전시를 불러오는 중입니다…</p>}
        {!error && exhibitions !== null && exhibitions.length === 0 && <p>아직 추가한 전시가 없습니다. 홈에서 NFC, QR 또는 전시 코드를 연결해 주세요.</p>}

        <div className="momente-exhibition-list">
          {(exhibitions ?? []).map((exhibition) => {
            const imageUrl = getExhibitionImage(exhibition);
            return (
            <button
              type="button"
              className="momente-exhibition-list-card"
              key={exhibition.id}
              onClick={() => {
                setSelectedId(exhibition.id);
                onActiveExhibitionChange?.(exhibition.id);
              }}
              style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
            >
              <span className="momente-exhibition-list-copy">
                <strong>{exhibition.title}</strong>
                <small>{formatDateRange(exhibition.startAt, exhibition.endAt)}</small>
                <small>{exhibition.venue}</small>
                <small>대표 아티스트 · {formatArtists(exhibition.representativeArtists)}</small>
              </span>
            </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
