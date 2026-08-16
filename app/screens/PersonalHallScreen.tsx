import { type FormEvent, useEffect, useLayoutEffect, useState } from "react";
import Image from "next/image";
import { CollectArtworkPanel, type CollectedArtwork } from "../components/CollectArtworkPanel";
import {
  COLLECTION_UPDATED_EVENT,
  deleteCollectionItem,
  listCollectionItems,
  saveCollectionItem,
  type CollectionItem,
} from "../../lib/collection-storage";

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
            <h2>{selectedItem.artworkTitle}</h2>
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

          <article className="artwork-description-card personal-ai-history-card">
            <span className="section-kicker">AI CONVERSATION</span>
            <h3>AI와 나눈 대화</h3>
            <p>작품별 AI 대화 기록은 다음 개발 단계에서 이곳에 연결됩니다.</p>
            <span className="feature-coming-soon">COMING SOON</span>
          </article>

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
      <section className="personal-hall-screen">
        <header className="personal-hall-heading">
          <button type="button" className="round-back-button" onClick={onBack} aria-label="전시 작품으로 돌아가기">←</button>
          <div>
            <span className="section-kicker">MY EXHIBITION HALL</span>
            <h1>나만의 전시회장</h1>
            <p>{exhibitionTitle}에서 마음에 담은 작품과 기록을 모았습니다.</p>
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
            <div className="artwork-section-heading personal-hall-count">
              <h2>작품 {exhibitionItems.length}점</h2>
              <span>카드를 눌러 기록 보기</span>
            </div>
            <div className="artwork-card-grid">
              {exhibitionItems.map((item, index) => (
                <button
                  type="button"
                  className="artwork-card"
                  key={item.id}
                  onClick={() => openItem(item)}
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
