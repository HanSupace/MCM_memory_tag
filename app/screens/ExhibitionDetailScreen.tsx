import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { AiDocentPanel } from "../components/AiDocentPanel";
import { VisitVerificationPanel } from "../components/VisitVerificationPanel";

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
  const [showVisitPanel, setShowVisitPanel] = useState(false);
  const [showDocentPanel, setShowDocentPanel] = useState(false);

  function handleVisitVerified() {
    setExhibition((current) => (current ? { ...current, visited: true } : current));
    setShowVisitPanel(false);
  }

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

  useLayoutEffect(() => {
    if (!selectedArtworkId) return;

    const root = document.documentElement;
    const previousScrollBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    root.scrollTop = 0;
    document.body.scrollTop = 0;
    window.scrollTo(0, 0);

    const frame = window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousScrollBehavior;
    });

    return () => {
      window.cancelAnimationFrame(frame);
      root.style.scrollBehavior = previousScrollBehavior;
    };
  }, [selectedArtworkId]);

  const selectedArtwork = exhibition?.artworks.find((artwork) => artwork.id === selectedArtworkId) ?? null;

  if (exhibition && selectedArtwork) {
    return (
      <div className="home-content">
        <section className="artwork-detail-screen">
          <header className="artwork-detail-header">
            <button
              type="button"
              className="round-back-button"
              onClick={() => setSelectedArtworkId(null)}
              aria-label="작품 목록으로 돌아가기"
            >
              ←
            </button>
            <div>
              <span className="section-kicker">ARTWORK</span>
              <h1>작품 상세</h1>
            </div>
            <span aria-hidden="true" />
          </header>

          <div className={`artwork-detail-hero${selectedArtwork.imageUrl ? " has-image" : ""}`}>
            {selectedArtwork.imageUrl && (
              <Image
                className="artwork-detail-hero-image"
                src={selectedArtwork.imageUrl}
                alt=""
                fill
                priority
                sizes="(max-width: 640px) 100vw, 1120px"
              />
            )}
            <div className="artwork-detail-hero-shade" aria-hidden="true" />
            <div className="artwork-detail-hero-copy">
              <span className="section-kicker">SELECTED ARTWORK</span>
              <h2>{selectedArtwork.title}</h2>
              <p>{selectedArtwork.artistName ?? "작가 미상"}</p>

              <dl className="artwork-detail-meta-grid">
                <div><dt>전시</dt><dd>{exhibition.title}</dd></div>
                <div><dt>위치</dt><dd>{exhibition.venue}</dd></div>
                {selectedArtwork.productionYear && <div><dt>제작 연도</dt><dd>{selectedArtwork.productionYear}</dd></div>}
                {selectedArtwork.material && <div><dt>유형·재료</dt><dd>{selectedArtwork.material}</dd></div>}
              </dl>
            </div>
          </div>

          <div className="artwork-detail-actions" aria-label="작품 기능">
            <button type="button" onClick={() => announce("내 컬렉션 담기 기능은 다음 단계에서 연결됩니다.")}>
              <span aria-hidden="true">＋</span>
              내 컬렉션에 담기
            </button>
            <button type="button" className="primary" onClick={() => setShowDocentPanel(true)}>
              <span aria-hidden="true">✦</span>
              AI와 대화하기
            </button>
          </div>

          {showDocentPanel && (
            <AiDocentPanel
              exhibitionArtworkId={selectedArtwork.exhibitionArtworkId}
              artworkTitle={selectedArtwork.title}
              announce={announce}
              onClose={() => setShowDocentPanel(false)}
            />
          )}

          <article className="artwork-description-card">
            <span className="section-kicker">ABOUT THE WORK</span>
            <h3>작품 소개</h3>
            <p>{selectedArtwork.description ?? "등록된 작품 설명이 없습니다."}</p>
          </article>

          {selectedArtwork.appreciationPoints && (
            <article className="artwork-description-card appreciation-card">
              <span className="section-kicker">VIEWING GUIDE</span>
              <h3>감상 포인트</h3>
              <p>{selectedArtwork.appreciationPoints}</p>
            </article>
          )}
        </section>
      </div>
    );
  }

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

            {!exhibition.visited && (
              <button type="button" className="artwork-qr-callout" onClick={() => setShowVisitPanel(true)}>
                <span className="qr-outline" aria-hidden="true">📱</span>
                <span><strong>방문 인증하기</strong><small>키링 태그, QR 또는 테스트 버튼으로 방문을 인증하세요</small></span>
                <b aria-hidden="true">↗</b>
              </button>
            )}

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
                    className="artwork-card"
                    key={artwork.exhibitionArtworkId}
                    onClick={() => setSelectedArtworkId(artwork.id)}
                  >
                    <span
                      className={`artwork-image${artwork.imageUrl ? " has-image" : ` artwork-image-${(index % 4) + 1}`}`}
                    >
                      {artwork.imageUrl && (
                        <Image
                          src={artwork.imageUrl}
                          alt={`${artwork.title} 작품`}
                          fill
                          sizes="(max-width: 640px) 50vw, 560px"
                        />
                      )}
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

          </>
        )}
      </section>

      {showVisitPanel && exhibition && (
        <VisitVerificationPanel
          exhibitionId={exhibition.id}
          exhibitionTitle={exhibition.title}
          announce={announce}
          onClose={() => setShowVisitPanel(false)}
          onVerified={handleVisitVerified}
        />
      )}
    </div>
  );
}
