import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { AiDocentPanel } from "../components/AiDocentPanel";
import { getCollectionItem, saveCollectionItem } from "../../lib/collection-storage";
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
  onOpenPersonalHall,
  announce,
}: {
  exhibitionId: string;
  onBack: () => void;
  onOpenPersonalHall: (exhibitionId: string) => void;
  announce: (message: string) => void;
}) {
  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null);
  const [error, setError] = useState("");
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(null);
  const [showVisitPanel, setShowVisitPanel] = useState(false);
  const [showDocentPanel, setShowDocentPanel] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [collectionReview, setCollectionReview] = useState("");
  const [isCollected, setIsCollected] = useState(false);
  const [isSavingCollection, setIsSavingCollection] = useState(false);

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

  useEffect(() => {
    if (!showCollectionForm) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowCollectionForm(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showCollectionForm]);

  const selectedArtwork = exhibition?.artworks.find((artwork) => artwork.id === selectedArtworkId) ?? null;

  async function openArtwork(artwork: ArtworkSummary) {
    setSelectedArtworkId(artwork.id);
    setCollectionReview("");
    setIsCollected(false);
    setShowCollectionForm(false);
    try {
      const storedItem = await getCollectionItem(artwork.exhibitionArtworkId);
      setCollectionReview(storedItem?.review ?? "");
      setIsCollected(Boolean(storedItem));
    } catch {
      // 작품 상세는 계속 보여주고 저장 시 서버 오류 메시지를 안내한다.
    }
  }

  function closeArtwork() {
    setSelectedArtworkId(null);
    setCollectionReview("");
    setIsCollected(false);
    setShowCollectionForm(false);
  }

  async function submitCollectionReview(event: React.FormEvent) {
    event.preventDefault();
    const review = collectionReview.trim();
    if (!exhibition || !selectedArtwork || !review) {
      announce("한 줄 평을 입력해 주세요.");
      return;
    }

    setIsSavingCollection(true);
    try {
      await saveCollectionItem({ exhibitionArtworkId: selectedArtwork.exhibitionArtworkId, review });
      setIsCollected(true);
      setShowCollectionForm(false);
      announce("작품과 한 줄 평을 나만의 전시회장에 담았습니다.");
    } catch (error) {
      announce(error instanceof Error ? error.message : "컬렉션을 저장하지 못했습니다.");
    } finally {
      setIsSavingCollection(false);
    }
  }

  if (exhibition && selectedArtwork) {
    return (
      <div className="home-content">
        <section className="artwork-detail-screen">
          <header className="artwork-detail-header">
            <button
              type="button"
              className="round-back-button"
              onClick={closeArtwork}
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
            <button type="button" className={isCollected ? "collected" : ""} onClick={() => setShowCollectionForm(true)}>
              <span aria-hidden="true">{isCollected ? "✓" : "＋"}</span>
              {isCollected ? "한 줄 평 수정하기" : "내 컬렉션에 담기"}
            </button>
            <button type="button" className="primary" onClick={() => setShowDocentPanel(true)}>
              <span aria-hidden="true">✦</span>
              AI와 대화하기
            </button>
          </div>

          {showCollectionForm && (
            <div
              className="collection-modal-backdrop"
              role="presentation"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setShowCollectionForm(false);
              }}
            >
              <form
                className="collection-review-form collection-review-modal"
                onSubmit={submitCollectionReview}
                role="dialog"
                aria-modal="true"
                aria-labelledby="collection-modal-title"
              >
                <button
                  type="button"
                  className="collection-modal-close"
                  onClick={() => setShowCollectionForm(false)}
                  aria-label="컬렉션 팝업 닫기"
                >
                  ×
                </button>
                <div>
                  <span className="section-kicker">MY COMMENT</span>
                  <h3 id="collection-modal-title">{isCollected ? "한 줄 평 수정하기" : "컬렉션에 담기"}</h3>
                  <p>{selectedArtwork.title}을 기억할 나만의 문장을 남겨보세요.</p>
                </div>
                <label>
                  <span className="sr-only">작품 한 줄 평</span>
                  <input
                    type="text"
                    value={collectionReview}
                    maxLength={80}
                    placeholder="예: 익숙한 물건이 새로운 공간으로 보였다."
                    onChange={(event) => setCollectionReview(event.target.value)}
                  />
                  <small>{collectionReview.length}/80</small>
                </label>
                <div className="collection-review-actions">
                  <button type="button" onClick={() => setShowCollectionForm(false)}>취소</button>
                  <button type="submit" className="primary" disabled={!collectionReview.trim() || isSavingCollection}>
                    {isSavingCollection ? "저장 중…" : "전시회장에 담기"}
                  </button>
                </div>
              </form>
            </div>
          )}

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
          <button
            type="button"
            className="personal-hall-header-button"
            onClick={() => onOpenPersonalHall(exhibitionId)}
            aria-label={`${exhibition?.title ?? "현재 전시"} 나만의 전시회장 열기`}
          >
            <span className="hall-grid-symbol" aria-hidden="true" />
            <span><small>MY HALL</small><strong>전시회장</strong></span>
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
                    onClick={() => void openArtwork(artwork)}
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
