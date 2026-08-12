import { useEffect, useState } from "react";

type ExhibitionStatus = "upcoming" | "ongoing" | "ended";

type ExhibitionDetail = {
  id: string;
  title: string;
  description: string | null;
  heroImageUrl: string | null;
  venue: string;
  startAt: string;
  endAt: string;
  operatingHours: string | null;
  status: ExhibitionStatus;
  artists: Array<{ id: string; name: string }>;
  artworks: ArtworkSummary[];
  totalArtworks: number;
  visited: boolean;
  collectedCount: number;
};

type ArtworkSummary = {
  id: string;
  exhibitionArtworkId: string;
  title: string;
  artistName: string | null;
  productionYear: string | null;
  material: string | null;
  imageUrl: string | null;
  description: string | null;
  appreciationPoints: string | null;
};

const STATUS_LABEL: Record<ExhibitionStatus, string> = {
  ongoing: "진행 중",
  upcoming: "예정",
  ended: "종료",
};

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

export function ExhibitionDetailScreen({
  exhibitionId,
  onBack,
  announce,
}: {
  exhibitionId: string;
  onBack: () => void;
  announce: (message: string) => void;
}) {
  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null);
  const [error, setError] = useState("");
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(`/api/exhibitions/${exhibitionId}`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { exhibition: ExhibitionDetail };
        return data.exhibition;
      })
      .then((detail) => {
        if (active) setExhibition(detail);
      })
      .catch(() => {
        if (active) setError("전시 정보를 불러오지 못했습니다.");
      });

    return () => {
      active = false;
    };
  }, [exhibitionId]);

  const selectedArtwork = exhibition?.artworks.find((artwork) => artwork.id === selectedArtworkId) ?? null;

  return (
    <div className="home-content">
      <section className="exhibition-detail-section artwork-selection-section">
        <div className="explore-titlebar detail-titlebar">
          <button type="button" className="round-back-button" onClick={onBack} aria-label="전시 목록으로 돌아가기">←</button>
          <div>
            <span className="section-kicker">EXHIBITION</span>
            <h1>전시 작품</h1>
          </div>
          <button type="button" className="qr-header-button" onClick={() => announce("작품 QR 스캔 기능은 다음 단계에서 연결됩니다.")}>
            <span aria-hidden="true">▦</span> QR
          </button>
        </div>

        {error && <p className="form-error">{error}</p>}
        {!error && !exhibition && <p>전시 정보를 불러오는 중입니다…</p>}

        {exhibition && (
          <>
            <div className="selected-exhibition-summary">
              <div>
                <h2>{exhibition.title}</h2>
                <p>{formatDate(exhibition.startAt)} – {formatDate(exhibition.endAt)} · {exhibition.venue}</p>
              </div>
              <span className="status-chip static">{STATUS_LABEL[exhibition.status]}</span>
            </div>

            <button type="button" className="artwork-qr-callout" onClick={() => announce("전시장 작품 QR을 스캔해 주세요.")}>
              <span className="qr-outline" aria-hidden="true">▦</span>
              <span><strong>작품 QR로 바로 찾기</strong><small>전시장에서 작품 옆 QR을 스캔하세요</small></span>
              <b aria-hidden="true">↗</b>
            </button>

            <div className="artwork-section-heading">
              <h2>작품 {exhibition.totalArtworks}점</h2>
              <span>{exhibition.collectedCount}점 수집</span>
            </div>

            {exhibition.artworks.length === 0 ? <p className="empty-artworks">등록된 작품이 없습니다.</p> : (
              <div className="artwork-card-grid">
                {exhibition.artworks.map((artwork, index) => (
                  <button
                    type="button"
                    className={`artwork-card${selectedArtworkId === artwork.id ? " selected" : ""}`}
                    key={artwork.exhibitionArtworkId}
                    onClick={() => setSelectedArtworkId(artwork.id)}
                  >
                    <span
                      className={`artwork-image artwork-image-${(index % 4) + 1}`}
                      style={artwork.imageUrl ? { backgroundImage: `url(${artwork.imageUrl})` } : undefined}
                    >
                      <small>{String(index + 1).padStart(2, "0")}</small>
                    </span>
                    <span className="artwork-card-copy">
                      <strong>{artwork.title}</strong>
                      <small>{artwork.artistName ?? "작가 미상"}</small>
                      <span>상세 정보 보기 <b>↗</b></span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {selectedArtwork && (
              <article className="selected-artwork-detail" aria-live="polite">
                <button type="button" onClick={() => setSelectedArtworkId(null)} aria-label="작품 상세 닫기">×</button>
                <span className="section-kicker">SELECTED ARTWORK</span>
                <h2>{selectedArtwork.title}</h2>
                <p className="selected-artwork-meta">
                  {[selectedArtwork.artistName, selectedArtwork.productionYear, selectedArtwork.material].filter(Boolean).join(" · ")}
                </p>
                <p>{selectedArtwork.description ?? "등록된 작품 설명이 없습니다."}</p>
                {selectedArtwork.appreciationPoints && <p className="artwork-tip"><strong>감상 포인트</strong>{selectedArtwork.appreciationPoints}</p>}
              </article>
            )}
          </>
        )}
      </section>
    </div>
  );
}
