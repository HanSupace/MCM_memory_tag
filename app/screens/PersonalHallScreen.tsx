import { type CSSProperties, type FormEvent, type UIEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import { CollectArtworkPanel, type CollectedArtwork } from "../components/CollectArtworkPanel";
import { DocentConversationSummary } from "../components/DocentConversationSummary";
import {
  COLLECTION_UPDATED_EVENT,
  deleteCollectionItem,
  listCollectionItems,
  saveCollectionItem,
  type CollectionItem,
} from "../../lib/collection-storage";

export const PERSONAL_HALL_BACK_EVENT = "mcm-personal-hall-back";

function personalHallBackground(title: string) {
  const upper = title.toUpperCase();
  if (upper.includes("F.A.M")) return "/artworks/fam/infinity.png";
  if (upper.includes("WEARABLE CASA") || title.includes("웨어러블 카사")) return "/artworks/wearable-casa/chatty-sofa.png";
  if (upper.includes("BE@RBRICK")) return "/artworks/berbrick-wonderland/pause-usa-usa.jpg";
  return null;
}

function personalHallTitleLines(title: string) {
  const upper = title.toUpperCase();
  if (upper.includes("F.A.M")) return ["F.A.M", "FASHION & ART", "at MCM HAUS"];
  if (upper.includes("WEARABLE CASA") || title.includes("웨어러블 카사")) return ["WEARABLE CASA", "at MCM HAUS"];
  if (upper.includes("BE@RBRICK")) return ["BE@RBRICK in", "MCM Wonderland"];
  return [title];
}

function cachedHallItems(exhibitionId: string | null) {
  if (!exhibitionId || typeof window === "undefined") return [];
  try {
    const cached = window.sessionStorage.getItem(`mcm-personal-hall:${exhibitionId}`);
    return cached ? JSON.parse(cached) as CollectionItem[] : [];
  } catch {
    return [];
  }
}

export function PersonalHallScreen({
  exhibitionId,
  onBack,
  announce,
}: {
  exhibitionId: string | null;
  onBack: () => void;
  announce: (message: string) => void;
}) {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCollectPanel, setShowCollectPanel] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewDraft, setReviewDraft] = useState("");
  const [actionPending, setActionPending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [activeHallIndex, setActiveHallIndex] = useState(0);
  const hallRailRef = useRef<HTMLDivElement | null>(null);
  const hallScrollFrameRef = useRef<number | null>(null);
  const hallSnapTimeoutRef = useRef<number | null>(null);
  const hallPointerDownRef = useRef(false);
  const hallDidDragRef = useRef(false);
  const hallPointerStartRef = useRef({ x: 0, scrollLeft: 0 });

  useLayoutEffect(() => {
    const cachedItems = cachedHallItems(exhibitionId);
    if (cachedItems.length === 0) return;
    setItems(cachedItems);
    setLoading(false);
  }, [exhibitionId]);

  useEffect(() => {
    const handleHeaderBack = (event: Event) => {
      if (!selectedId) return;
      event.preventDefault();
      setSelectedId(null);
      setShowReviewForm(false);
      setActionError("");
    };
    window.addEventListener(PERSONAL_HALL_BACK_EVENT, handleHeaderBack);
    return () => window.removeEventListener(PERSONAL_HALL_BACK_EVENT, handleHeaderBack);
  }, [selectedId]);

  async function loadItems() {
    try {
      const nextItems = await listCollectionItems();
      setItems(nextItems);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "전시회장을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    const refreshItems = async () => {
      try {
        const nextItems = await listCollectionItems();
        if (active) {
          setItems(nextItems);
          setError("");
          try {
            window.sessionStorage.setItem(
              `mcm-personal-hall:${exhibitionId ?? "all"}`,
              JSON.stringify(exhibitionId ? nextItems.filter((item) => item.exhibitionId === exhibitionId) : nextItems),
            );
          } catch {
            // Keep rendering the fetched result if session storage is unavailable.
          }
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : "전시회장을 불러오지 못했습니다.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void refreshItems();
    const handleUpdate = () => void refreshItems();
    window.addEventListener(COLLECTION_UPDATED_EVENT, handleUpdate);
    return () => {
      active = false;
      window.removeEventListener(COLLECTION_UPDATED_EVENT, handleUpdate);
    };
  }, []);

  function handleCollected(artwork: CollectedArtwork) {
    announce(`${artwork.title} 작품을 수집했습니다.`);
    setShowCollectPanel(false);
    void loadItems();
  }

  function openItem(item: CollectionItem) {
    setSelectedId(item.id);
    setReviewDraft(item.review);
    setShowReviewForm(false);
    setActionError("");
  }

  function centerHallItem(index: number, behavior: ScrollBehavior = "smooth") {
    const rail = hallRailRef.current;
    if (!rail) return;
    const cards = rail.querySelectorAll<HTMLElement>(".artwork-card");
    const card = cards.item(index);
    if (!card) return;
    const left = card.offsetLeft + card.offsetWidth / 2 - rail.clientWidth / 2;
    rail.scrollTo({ left: Math.max(0, left), behavior });
  }

  function settleHallRail(delay = 150) {
    if (hallSnapTimeoutRef.current !== null) window.clearTimeout(hallSnapTimeoutRef.current);
    hallSnapTimeoutRef.current = window.setTimeout(() => {
      if (hallPointerDownRef.current) return;
      const rail = hallRailRef.current;
      if (!rail) return;
      const cards = Array.from(rail.querySelectorAll<HTMLElement>(".artwork-card"));
      if (cards.length === 0) return;
      const railCenter = rail.scrollLeft + rail.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - railCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      setActiveHallIndex(nearestIndex);
      centerHallItem(nearestIndex);
    }, delay);
  }

  function handleHallScroll(event: UIEvent<HTMLDivElement>) {
    const rail = event.currentTarget;
    if (hallPointerDownRef.current && Math.abs(rail.scrollLeft - hallPointerStartRef.current.scrollLeft) > 5) {
      hallDidDragRef.current = true;
    }
    if (hallScrollFrameRef.current !== null) window.cancelAnimationFrame(hallScrollFrameRef.current);
    hallScrollFrameRef.current = window.requestAnimationFrame(() => {
      const cards = Array.from(rail.querySelectorAll<HTMLElement>(".artwork-card"));
      if (cards.length === 0) return;
      const railCenter = rail.scrollLeft + rail.clientWidth / 2;
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;
      cards.forEach((card, index) => {
        const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - railCenter);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });
      setActiveHallIndex((current) => current === nearestIndex ? current : nearestIndex);
      hallScrollFrameRef.current = null;
    });
    settleHallRail();
  }

  useEffect(() => () => {
    if (hallScrollFrameRef.current !== null) window.cancelAnimationFrame(hallScrollFrameRef.current);
    if (hallSnapTimeoutRef.current !== null) window.clearTimeout(hallSnapTimeoutRef.current);
  }, []);

  async function handleReviewSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedItem || actionPending) return;
    const review = reviewDraft.trim();
    if (!review || review.length > 80) {
      setActionError("한줄평은 1~80자로 입력해 주세요.");
      return;
    }

    setActionPending(true);
    setActionError("");
    try {
      const updatedItem = await saveCollectionItem({
        exhibitionArtworkId: selectedItem.exhibitionArtworkId,
        review,
      });
      setItems((current) => current.map((item) => (
        item.exhibitionArtworkId === updatedItem.exhibitionArtworkId ? updatedItem : item
      )));
      setReviewDraft(updatedItem.review);
      setShowReviewForm(false);
      announce("한줄평을 수정했습니다.");
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "한줄평을 수정하지 못했습니다.");
    } finally {
      setActionPending(false);
    }
  }

  async function handleDelete() {
    if (!selectedItem || actionPending) return;
    const confirmed = window.confirm(`‘${selectedItem.artworkTitle}’을 소장 목록에서 삭제할까요?\n작성한 한줄평도 함께 삭제됩니다.`);
    if (!confirmed) return;

    setActionPending(true);
    setActionError("");
    try {
      await deleteCollectionItem(selectedItem.exhibitionArtworkId);
      setItems((current) => current.filter((item) => item.exhibitionArtworkId !== selectedItem.exhibitionArtworkId));
      setSelectedId(null);
      setShowReviewForm(false);
      announce("소장 목록에서 작품과 한줄평을 삭제했습니다.");
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : "소장 작품을 삭제하지 못했습니다.");
    } finally {
      setActionPending(false);
    }
  }

  useLayoutEffect(() => {
    if (!selectedId) return;
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
  }, [selectedId]);

  const exhibitionItems = exhibitionId ? items.filter((item) => item.exhibitionId === exhibitionId) : [];
  const selectedItem = exhibitionItems.find((item) => item.id === selectedId) ?? null;
  const exhibitionTitle = exhibitionItems[0]?.exhibitionTitle ?? "현재 전시";

  useLayoutEffect(() => {
    if (exhibitionItems.length === 0 || selectedId) return;
    const nextIndex = Math.min(activeHallIndex, exhibitionItems.length - 1);
    const frame = window.requestAnimationFrame(() => centerHallItem(nextIndex, "auto"));
    return () => window.cancelAnimationFrame(frame);
  }, [exhibitionItems.length, exhibitionId, selectedId]);

  if (selectedItem) {
    return (
      <div className="home-content">
        <section className="artwork-detail-screen personal-hall-detail-screen">
          <header className="artwork-detail-header">
            <button
              type="button"
              className="round-back-button"
              onClick={() => setSelectedId(null)}
              aria-label="나만의 전시회장 목록으로 돌아가기"
            >
              ←
            </button>
            <div>
              <span className="section-kicker">MY COLLECTION</span>
              <h1>소장 작품</h1>
            </div>
            <span aria-hidden="true" />
          </header>

          <div className="personal-hall-detail-hero">
            {selectedItem.imageUrl ? (
              <Image
                src={selectedItem.imageUrl}
                alt={`${selectedItem.artworkTitle} 작품`}
                fill
                priority
                sizes="(max-width: 640px) 100vw, 1120px"
              />
            ) : (
              <span>등록된 작품 이미지가 없습니다.</span>
            )}
          </div>

          <header className="personal-hall-detail-title">
            <span className="section-kicker">SELECTED ARTWORK</span>
            <div className="personal-hall-title-row"><h2>{selectedItem.artworkTitle}</h2></div>
            <p>{selectedItem.artistName ?? "작가 미상"}</p>
            <small>{selectedItem.exhibitionTitle}</small>
          </header>

          <article className="artwork-description-card personal-review-card">
            <div className="personal-review-heading">
              <div>
                <span className="section-kicker">MY COMMENT</span>
                <h3>내가 남긴 한 줄 평</h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReviewDraft(selectedItem.review);
                  setShowReviewForm((visible) => !visible);
                  setActionError("");
                }}
                disabled={actionPending}
              >
                한줄평 수정
              </button>
            </div>
            {showReviewForm ? (
              <form className="personal-review-edit-form" onSubmit={handleReviewSubmit}>
                <label>
                  <span className="sr-only">수정할 한줄평</span>
                  <input
                    value={reviewDraft}
                    onChange={(event) => setReviewDraft(event.target.value)}
                    maxLength={80}
                  />
                  <small>{reviewDraft.length}/80</small>
                </label>
                <div className="collection-review-actions">
                  <button type="button" onClick={() => setShowReviewForm(false)} disabled={actionPending}>취소</button>
                  <button type="submit" className="primary" disabled={actionPending || !reviewDraft.trim()}>
                    {actionPending ? "저장 중…" : "수정 저장"}
                  </button>
                </div>
              </form>
            ) : (
              <blockquote>“{selectedItem.review}”</blockquote>
            )}
            {actionError && <p className="form-error" role="alert">{actionError}</p>}
          </article>

          <DocentConversationSummary
            key={selectedItem.exhibitionArtworkId}
            exhibitionArtworkId={selectedItem.exhibitionArtworkId}
          />

          <article className="artwork-description-card">
            <span className="section-kicker">ABOUT THE WORK</span>
            <h3>작품 소개</h3>
            <p>{selectedItem.description ?? "등록된 작품 소개가 없습니다."}</p>
          </article>

          <div className="personal-collection-delete-zone">
            <button type="button" onClick={handleDelete} disabled={actionPending}>
              {actionPending ? "처리 중…" : "수집한 작품 삭제"}
            </button>
            <p>소장 기록과 작성한 한줄평이 함께 삭제됩니다.</p>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="home-content">
      <section className={`personal-hall-screen${exhibitionItems.length > 0 ? " has-artworks personal-hall-stage-fixed" : ""}`}>
        {exhibitionItems.length > 0 && personalHallBackground(exhibitionTitle) && (
          <div className="personal-hall-background" style={{ backgroundImage: `url(${personalHallBackground(exhibitionTitle)})` }} aria-hidden="true" />
        )}
        <header className="personal-hall-heading">
          <button type="button" className="round-back-button" onClick={onBack} aria-label="전시 작품으로 돌아가기">←</button>
          <div>
            {exhibitionItems.length > 0 && (
              <p className="personal-hall-exhibition-title">
                {personalHallTitleLines(exhibitionTitle).map((line) => <span key={line}>{line}</span>)}
              </p>
            )}
            <span className="section-kicker">MY EXHIBITION HALL</span>
            <h1>나만의 전시회장</h1>
            <p className="personal-hall-description">{exhibitionTitle}에서 마음에 담은 작품과 기록을 모았습니다.</p>
            <button
              type="button"
              className="personal-hall-collect-button"
              onClick={() => setShowCollectPanel(true)}
            >
              작품 QR·NFC로 수집하기
            </button>
          </div>
        </header>

        {loading && <p className="gallery-message">전시회장을 불러오는 중입니다…</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && exhibitionItems.length === 0 ? (
          <div className="personal-hall-empty">
            <span className="hall-grid-symbol" aria-hidden="true" />
            <h2>이 전시에서 담은 작품이 없어요</h2>
            <p>현재 전시의 작품 상세에서 ‘내 컬렉션에 담기’를 누르고 한 줄 평을 남겨보세요.</p>
            <button type="button" onClick={onBack}>작품 둘러보기</button>
          </div>
        ) : !loading && !error ? (
          <>
            <div className="personal-hall-lamp" aria-hidden="true">
              <Image src="/personal-hall-lamp.png" alt="" width={935} height={689} priority />
              <span />
            </div>
            <div className="artwork-section-heading personal-hall-count">
              <h2>담은 작품 목록</h2>
              <span>더보기</span>
            </div>
            <div
              ref={hallRailRef}
              className="artwork-card-grid"
              onScroll={handleHallScroll}
              onPointerDown={(event) => {
                hallPointerDownRef.current = true;
                hallDidDragRef.current = false;
                hallPointerStartRef.current = { x: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
                if (hallSnapTimeoutRef.current !== null) window.clearTimeout(hallSnapTimeoutRef.current);
              }}
              onPointerMove={(event) => {
                if (hallPointerDownRef.current && Math.abs(event.clientX - hallPointerStartRef.current.x) > 5) {
                  hallDidDragRef.current = true;
                }
              }}
              onPointerUp={() => {
                hallPointerDownRef.current = false;
                settleHallRail(90);
              }}
              onPointerCancel={() => {
                hallPointerDownRef.current = false;
                settleHallRail(90);
              }}
            >
              {exhibitionItems.map((item, index) => (
                <button
                  type="button"
                  className={`artwork-card${index === activeHallIndex ? " active" : ""}`}
                  style={{ "--hall-index": index } as CSSProperties}
                  key={item.id}
                  onClick={() => {
                    if (hallDidDragRef.current) {
                      hallDidDragRef.current = false;
                      return;
                    }
                    if (index !== activeHallIndex) {
                      centerHallItem(index);
                      setActiveHallIndex(index);
                      return;
                    }
                    openItem(item);
                  }}
                >
                  <span className={`artwork-image${item.imageUrl ? " has-image" : ` artwork-image-${(index % 4) + 1}`}`}>
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={`${item.artworkTitle} 작품`}
                        fill
                        sizes="(max-width: 640px) 50vw, 560px"
                      />
                    )}
                    <small>{String(index + 1).padStart(2, "0")}</small>
                  </span>
                  <span className="artwork-card-copy">
                    <strong>{item.artworkTitle}</strong>
                    <small>{item.artistName ?? "작가 미상"}</small>
                    <span>내 기록 보기 <b>↗</b></span>
                  </span>
                </button>
              ))}
            </div>
          </>
        ) : null}
      </section>

      {showCollectPanel && (
        <CollectArtworkPanel
          announce={announce}
          onClose={() => setShowCollectPanel(false)}
          onCollected={handleCollected}
        />
      )}
    </div>
  );
}
