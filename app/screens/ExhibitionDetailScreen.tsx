import { useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { AiDocentPanel } from "../components/AiDocentPanel";
import { ArtworkQrScanner } from "../components/ArtworkQrScanner";
import { ArrowLeftIcon, ArrowRightIcon, BookmarkIcon } from "../components/MomenteIcons";
import { getCollectionItem, listCollectionItems, saveCollectionItem } from "../../lib/collection-storage";
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
  collectIdentifier: string | null;
  title: string;
  artistName: string | null;
  productionYear: string | null;
  material: string | null;
  imageUrl: string | null;
  description: string | null;
  appreciationPoints: string | null;
};

function exhibitionHeroImage(exhibition: ExhibitionDetail) {
  if (exhibition.heroImageUrl) return exhibition.heroImageUrl;
  const title = exhibition.title.toUpperCase();
  if (title.includes("F.A.M")) return "/artworks/fam/infinity.png";
  if (title.includes("WEARABLE") || title.includes("웨어러블")) return "/artworks/wearable-casa/chatty-sofa.png";
  if (title.includes("BE@RBRICK")) return "/artworks/berbrick-wonderland/pause-usa-usa.jpg";
  return null;
}

function exhibitionTitleLines(title: string) {
  const normalized = title.trim();
  const upper = normalized.toUpperCase();
  if (upper.includes("F.A.M")) return ["F.A.M", "FASHION & ART", "at MCM HAUS"];
  if (upper.includes("WEARABLE CASA")) return ["WEARABLE CASA", "at MCM HAUS"];
  if (upper.includes("BE@RBRICK")) return ["BE@RBRICK in", "MCM Wonderland"];
  return [normalized];
}

function briefExhibitionIntro(exhibition: ExhibitionDetail) {
  const description = exhibition.description?.replace(/\s+/g, " ").trim();
  if (!description) return `${exhibition.venue}에서 펼쳐지는 MCM의 특별한 전시입니다.`;
  const firstSentence = description.split(/(?<=[.!?。])\s+/)[0] ?? description;
  return firstSentence.length > 82 ? `${firstSentence.slice(0, 82).trim()}…` : firstSentence;
}

export function ExhibitionDetailScreen({
  exhibitionId,
  initialArtworkId = null,
  onBack,
  onArtworkChange,
  onOpenPersonalHall,
  announce,
}: {
  exhibitionId: string;
  initialArtworkId?: string | null;
  onBack: () => void;
  onArtworkChange?: (artworkId: string | null) => void;
  onOpenPersonalHall: (exhibitionId: string) => void;
  announce: (message: string) => void;
}) {
  const [exhibition, setExhibition] = useState<ExhibitionDetail | null>(null);
  const [error, setError] = useState("");
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(initialArtworkId);
  const [showVisitPanel, setShowVisitPanel] = useState(false);
  const [showDocentPanel, setShowDocentPanel] = useState(false);
  const [showCollectionForm, setShowCollectionForm] = useState(false);
  const [collectionReview, setCollectionReview] = useState("");
  const [isCollected, setIsCollected] = useState(false);
  const [isSavingCollection, setIsSavingCollection] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [showAllArtworksScreen, setShowAllArtworksScreen] = useState(false);

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

  useEffect(() => {
    let active = true;
    listCollectionItems()
      .then((items) => {
        if (!active) return;
        const exhibitionItems = items.filter((item) => item.exhibitionId === exhibitionId);
        try {
          window.sessionStorage.setItem(`mcm-personal-hall:${exhibitionId}`, JSON.stringify(exhibitionItems));
        } catch {
          // The hall still works when private browsing blocks session storage.
        }
      })
      .catch(() => {
        // Entering the hall still works; it will request the collection again.
      });
    return () => { active = false; };
  }, [exhibitionId, isCollected]);

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

  useLayoutEffect(() => {
    if (!showAllArtworksScreen) return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [showAllArtworksScreen]);

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

  const selectedArtwork = exhibition?.artworks.find((artwork) => (
    artwork.id === selectedArtworkId || artwork.exhibitionArtworkId === selectedArtworkId
  )) ?? null;

  function openAllArtworks() {
    setShowAllArtworksScreen(true);
  }

  useEffect(() => {
    if (!selectedArtwork) return;
    let active = true;

    getCollectionItem(selectedArtwork.exhibitionArtworkId)
      .then((storedItem) => {
        if (!active) return;
        setCollectionReview(storedItem?.review ?? "");
        setIsCollected(Boolean(storedItem));
      })
      .catch(() => {
        // 작품 상세는 계속 보여주고 저장 시 서버 오류 메시지를 안내한다.
      });

    return () => {
      active = false;
    };
  }, [selectedArtwork]);

  function openArtwork(artwork: ArtworkSummary) {
    setSelectedArtworkId(artwork.id);
    onArtworkChange?.(artwork.id);
    setCollectionReview("");
    setIsCollected(false);
    setShowCollectionForm(false);
  }

  function handleQrDetected(value: string) {
    if (!exhibition) return "전시 정보를 불러온 뒤 다시 시도해 주세요.";

    const trimmed = value.trim();
    let pathSegments: string[] = [];
    try {
      pathSegments = new URL(trimmed, window.location.origin).pathname.split("/").filter(Boolean);
    } catch {
      pathSegments = trimmed.split(/[/?#]/).filter(Boolean);
    }
    const artworkPathIndex = pathSegments.lastIndexOf("artworks");
    const pathArtworkId = artworkPathIndex >= 0 ? pathSegments[artworkPathIndex + 1] : null;
    const collectPathIndex = pathSegments.lastIndexOf("collect");
    const collectIdentifier = collectPathIndex >= 0 ? pathSegments[collectPathIndex + 1] : null;
    const lastSegment = pathSegments[pathSegments.length - 1] ?? trimmed;
    const candidates = new Set([trimmed, pathArtworkId, collectIdentifier, lastSegment].filter(Boolean));

    const artwork = exhibition.artworks.find((item) => (
      candidates.has(item.id)
      || candidates.has(item.exhibitionArtworkId)
      || (item.collectIdentifier ? candidates.has(item.collectIdentifier) : false)
    ));
    if (!artwork) return "현재 전시에 등록된 작품 QR이 아닙니다. 작품 옆 QR을 다시 확인해 주세요.";

    setShowQrScanner(false);
    openArtwork(artwork);
    announce(`${artwork.title} 작품을 찾았습니다.`);
    return null;
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
      <div className="momente-artwork-detail-page">
          <div className={`momente-artwork-detail-hero${selectedArtwork.imageUrl ? " has-image" : ""}`}>
            {selectedArtwork.imageUrl && (
              <Image
                src={selectedArtwork.imageUrl}
                alt={`${selectedArtwork.title} 작품`}
                fill
                priority
                sizes="(max-width: 760px) 100vw, 760px"
              />
            )}
          </div>

          <section className="momente-artwork-detail-content">
            <header>
              <h1 title={selectedArtwork.title}>{selectedArtwork.title}</h1>
              <button type="button" className={isCollected ? "collected" : ""} onClick={() => setShowCollectionForm(true)}>
                <BookmarkIcon />
                <span>{isCollected ? "생각 수정" : "작품 저장"}</span>
              </button>
            </header>
            <p className="momente-artwork-artist">{selectedArtwork.artistName ?? "작가 미상"}</p>

            <dl className="momente-artwork-information">
              <div>
                <dt>작품 소개</dt>
                <dd>{selectedArtwork.description ?? "등록된 작품 설명이 없습니다."}</dd>
              </div>
              {selectedArtwork.productionYear && <div><dt>제작 연도</dt><dd>{selectedArtwork.productionYear}</dd></div>}
              <div>
                <dt>유형 및 재료</dt>
                <dd>{selectedArtwork.material ?? "작품 재료 정보가 준비 중입니다."}</dd>
              </div>
              <div className="viewing-point">
                <dt>감상 포인트</dt>
                <dd>{selectedArtwork.appreciationPoints ?? "작품의 형태와 재료가 공간과 맺는 관계를 천천히 살펴보세요."}</dd>
              </div>
            </dl>

            <button type="button" className="momente-ai-chat-button" onClick={() => setShowDocentPanel(true)}>
              <span aria-hidden="true">✦</span>
              AI와 대화하기
            </button>
          </section>

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
                  <h3 id="collection-modal-title">{isCollected ? "한 줄 평 수정하기" : "한 줄 평 작성하기"}</h3>
                  <p>작품을 기억할 나만의 문장을 남겨보세요.</p>
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
                </label>
                <div className="collection-review-actions">
                  <button type="submit" className="primary" disabled={!collectionReview.trim() || isSavingCollection}>
                    {isSavingCollection ? "저장 중…" : "확인 ❯"}
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
      </div>
    );
  }

  if (error || !exhibition) {
    return (
      <div className="momente-exhibition-detail-page momente-detail-state">
        <button type="button" className="momente-detail-back" onClick={onBack} aria-label="전시 목록으로 돌아가기">
          <ArrowLeftIcon />
        </button>
        <p className={error ? "form-error" : undefined}>{error || "전시 정보를 불러오는 중입니다…"}</p>
      </div>
    );
  }

  const heroImageUrl = exhibitionHeroImage(exhibition);
  const previewArtworks = exhibition.artworks.slice(0, 5);
  const titleLines = exhibitionTitleLines(exhibition.title);

  const artworkCard = (artwork: ArtworkSummary, index: number, fullList = false) => (
    <button
      type="button"
      className={`momente-artwork-card${fullList ? " full-list-card" : ""}`}
      key={artwork.exhibitionArtworkId}
      onClick={() => openArtwork(artwork)}
    >
      <span className={`momente-artwork-image${artwork.imageUrl ? " has-image" : ` artwork-image-${(index % 4) + 1}`}`}>
        {artwork.imageUrl && (
          <Image
            src={artwork.imageUrl}
            alt={`${artwork.title} 작품`}
            fill
            sizes={fullList ? "(max-width: 640px) 50vw, 320px" : "180px"}
          />
        )}
      </span>
      <span className="momente-artwork-copy">
        <strong title={artwork.title}>{artwork.title}</strong>
        <small>{artwork.artistName ?? "작가 미상"}</small>
      </span>
    </button>
  );

  if (showAllArtworksScreen) {
    return (
      <div className="momente-all-artworks-screen">
        <header className="momente-all-artworks-header">
          <div>
            <span>ARTWORKS</span>
            <h1>전체 작품 목록</h1>
            <p>{exhibition.title}</p>
          </div>
        </header>
        <div className="momente-all-artworks-count">총 {exhibition.totalArtworks}점</div>
        <div className="momente-all-artworks-grid screen-grid">
          {exhibition.artworks.map((artwork, index) => artworkCard(artwork, index, true))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`momente-exhibition-detail-page${heroImageUrl ? " has-hero" : ""}`}
    >
      <div
        className="momente-detail-fixed-background"
        style={heroImageUrl ? { backgroundImage: `url(${heroImageUrl})` } : undefined}
        aria-hidden="true"
      />
      <section className="momente-exhibition-overview">
        <header className="momente-detail-title">
          <h1>
            {titleLines.map((line, index) => <span className={index === 0 ? "lead-line" : undefined} key={line}>{line}</span>)}
          </h1>
        </header>

        <section className="momente-detail-info" aria-labelledby="exhibition-information-title">
          <h2 id="exhibition-information-title">전시회 소개</h2>
          <p>{briefExhibitionIntro(exhibition)}</p>
        </section>

        <div className="momente-detail-actions-row">
          <button type="button" className="momente-personal-hall-button" onClick={() => onOpenPersonalHall(exhibitionId)}>
            <span>담은 전시 보기</span>
            <ArrowRightIcon />
          </button>
        </div>

        <section className="momente-artwork-preview" aria-labelledby="artwork-list-title">
          <div className="momente-artwork-heading">
            <h2 id="artwork-list-title">작품 목록</h2>
            {exhibition.artworks.length > 0 && <button type="button" onClick={openAllArtworks}>더보기</button>}
          </div>

          {previewArtworks.length === 0 ? (
            <p className="momente-empty-artworks">등록된 작품이 없습니다.</p>
          ) : (
            <div className="momente-artwork-rail">
              {previewArtworks.map((artwork, index) => artworkCard(artwork, index))}
            </div>
          )}
        </section>

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

      {showQrScanner && exhibition && (
        <ArtworkQrScanner
          onClose={() => setShowQrScanner(false)}
          onDetected={handleQrDetected}
        />
      )}
    </div>
  );
}
