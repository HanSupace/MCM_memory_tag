"use client";

import { useEffect, useState, type UIEvent } from "react";
import Image from "next/image";
import { TasteReportPanel } from "../components/TasteReportPanel";
import { ChevronRightIcon, MailIcon, ReportIcon, SmileIcon, SparkleIcon } from "../components/MomenteIcons";

type ContentKey = "summary" | "sticker" | "taste" | "invitation";
type Summary = {
  headline: string;
  narrative: string;
  moodKeywords: string[];
  artworkMoments: Array<{ title: string; reaction: string; observation: string }>;
  commonThread: string;
  docentMessage: string;
  artworkImages: Record<string, string | null>;
  artworkArtists?: Record<string, string>;
  exhibition: { title: string; venue: string; visitedAt: string } | null;
  counts: { exhibitions: number; artworks: number; notes: number };
};
type Stickers = {
  title: string;
  description: string;
  imageDataUrl: string;
};
type Letter = {
  eyebrow: string;
  title: string;
  greeting: string;
  body: string;
  reason: string;
  closing: string;
  recommendedExhibition: { title: string; venue: string; start_at: string; end_at: string } | null;
};
type Generated = { summary?: Summary; sticker?: Stickers; invitation?: Letter };
type TimelineExhibition = {
  id: string; title: string; venue: string; hero_image_url: string | null; reference_at: string; reference_type: "visit" | "collection";
};

const contents: Array<{
  key: ContentKey; day: string; dayOffset: number; title: string; description: string; action: string;
}> = [
  { key: "summary", day: "당일 공개", dayOffset: 0, title: "맞춤형 관람 요약", description: "내가 실제로 방문하고 수집한 작품과 감상 기록을 AI가 한 편의 관람 기록으로 정리합니다.", action: "AI 요약 만들기" },
  { key: "sticker", day: "1일 후 공개", dayOffset: 1, title: "나만의 전시 스티커", description: "수집한 작품의 제목, 소재와 내가 남긴 감상에서 모티프를 찾아 AI 스티커 팩을 만듭니다.", action: "AI 스티커 만들기" },
  { key: "taste", day: "7일 후 공개", dayOffset: 7, title: "취향 리포트", description: "사진, 수집 작품과 감상 기록을 바탕으로 AI가 나만의 미적 취향을 분석합니다.", action: "취향 분석하기" },
  { key: "invitation", day: "30일 후 공개", dayOffset: 30, title: "전시회에서 온 편지", description: "내 관람 취향과 이어지는 실제 다른 전시를 골라 AI가 개인 초대 편지를 씁니다.", action: "AI 편지 받기" },
];

const timelineLabels: Record<ContentKey, string> = {
  summary: "Today",
  sticker: "One day later",
  taste: "7 days later",
  invitation: "30 days later",
};

function TimelineContentIcon({ contentKey }: { contentKey: ContentKey }) {
  if (contentKey === "summary") return <SparkleIcon />;
  if (contentKey === "sticker") return <SmileIcon />;
  if (contentKey === "taste") return <ReportIcon />;
  return <MailIcon />;
}

function timelineExhibitionHero(exhibition: TimelineExhibition | null) {
  if (!exhibition) return null;
  if (exhibition.hero_image_url) return exhibition.hero_image_url;
  const title = exhibition.title.toUpperCase();
  if (title.includes("F.A.M")) return "/artworks/fam/infinity.png";
  if (title.includes("WEARABLE") || title.includes("웨어러블")) return "/artworks/wearable-casa/chatty-sofa.png";
  if (title.includes("BE@RBRICK")) return "/artworks/berbrick-wonderland/nobuki-hizume-installation.jpg";
  return null;
}

function releaseDate(referenceAt: string, offset: number) {
  const date = new Date(referenceAt);
  date.setDate(date.getDate() + offset);
  return new Intl.DateTimeFormat("ko-KR", { year: "numeric", month: "long", day: "numeric" }).format(date);
}

export function TimedContentScreen({
  announce,
  initialExhibitionId = null,
  onSelectedExhibitionChange,
}: {
  announce: (message: string) => void;
  initialExhibitionId?: string | null;
  onSelectedExhibitionChange?: (exhibitionId: string) => void;
}) {
  const [openContent, setOpenContent] = useState<ContentKey | null>(null);
  const [generated, setGenerated] = useState<Generated>({});
  const [loadingKey, setLoadingKey] = useState<ContentKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exhibitions, setExhibitions] = useState<TimelineExhibition[]>([]);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState("");
  const [listLoading, setListLoading] = useState(true);
  const [savedByExhibition, setSavedByExhibition] = useState<Record<string, Generated>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeMomentIndex, setActiveMomentIndex] = useState(0);
  const [stickerExpanded, setStickerExpanded] = useState(false);
  const [letterOpened, setLetterOpened] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/timed-content", { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { exhibitions?: TimelineExhibition[]; savedContent?: Record<string, Generated>; error?: string };
        if (!response.ok) throw new Error(payload.error || "전시 기록을 불러오지 못했습니다.");
        if (!active) return;
        const next = payload.exhibitions || [];
        setExhibitions(next);
        const preferredId = initialExhibitionId && next.some((item) => item.id === initialExhibitionId)
          ? initialExhibitionId
          : next[0]?.id || "";
        const savedContent = payload.savedContent || {};
        setSavedByExhibition(savedContent);
        setGenerated(savedContent[preferredId] || {});
        setSelectedExhibitionId(preferredId);
      })
      .catch((caught) => active && setError(caught instanceof Error ? caught.message : "전시 기록을 불러오지 못했습니다."))
      .finally(() => active && setListLoading(false));
    return () => { active = false; };
  }, [initialExhibitionId]);

  const selectedExhibition = exhibitions.find((item) => item.id === selectedExhibitionId) || null;
  const selectedExhibitionHero = timelineExhibitionHero(selectedExhibition);

  function selectExhibition(id: string) {
    setSelectedExhibitionId(id);
    onSelectedExhibitionChange?.(id);
    setGenerated(savedByExhibition[id] || {});
    setOpenContent(null);
    setError(null);
    setPickerOpen(false);
    setActiveMomentIndex(0);
    setLetterOpened(false);
  }

  async function handleAction(key: ContentKey) {
    if (!selectedExhibitionId) {
      setError("콘텐츠를 볼 전시회를 먼저 선택해 주세요.");
      return;
    }
    if (openContent === key) {
      setOpenContent(null);
      if (key === "invitation") setLetterOpened(false);
      return;
    }
    setError(null);
    if (key === "taste" || generated[key]) {
      setOpenContent(key);
      return;
    }

    setLoadingKey(key);
    try {
      const response = await fetch("/api/timed-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: key === "sticker" ? "stickers" : key, exhibitionId: selectedExhibitionId }),
      });
      const payload = await response.json() as { content?: Summary | Stickers | Letter; error?: string };
      if (!response.ok || !payload.content) throw new Error(payload.error || "맞춤 콘텐츠를 만들지 못했습니다.");
      const nextGenerated = { ...generated, [key]: payload.content };
      setGenerated(nextGenerated);
      setSavedByExhibition((current) => ({ ...current, [selectedExhibitionId]: nextGenerated }));
      setOpenContent(key);
      announce("현재 계정의 관람 기록으로 AI 맞춤 콘텐츠를 만들었습니다.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "맞춤 콘텐츠를 만들지 못했습니다.";
      setError(message);
      announce(message);
    } finally {
      setLoadingKey(null);
    }
  }

  function handleMomentScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget;
    const cards = Array.from(container.querySelectorAll<HTMLElement>(".summary-moment-card"));
    if (cards.length === 0) return;
    const focusPoint = container.scrollLeft + container.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - focusPoint);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });
    setActiveMomentIndex(nearestIndex);
  }

  const summary = generated.summary;
  const stickers = generated.sticker;
  const letter = generated.invitation;
  const activeSummaryMoment = summary?.artworkMoments[Math.min(activeMomentIndex, Math.max(summary.artworkMoments.length - 1, 0))] ?? null;

  return (
    <div className="home-content">
      <section className="timed-content-screen">
        <header className="timed-content-heading">
          <h1>After the Exhibition</h1>
        </header>

        <section className={`timeline-exhibition-picker${pickerOpen ? " open" : ""}`} aria-label="시간차 콘텐츠 전시 선택">
          <span className="timeline-picker-label">My Exhibition</span>
          {listLoading ? <p>전시 기록을 불러오는 중…</p> : exhibitions.length === 0 ? <p>방문하거나 작품을 수집한 전시가 아직 없습니다.</p> : selectedExhibition && (
            <>
              <button
                className="timeline-picker-trigger"
                type="button"
                aria-expanded={pickerOpen}
                onClick={() => setPickerOpen((current) => !current)}
              >
                <span className="timeline-picker-logo"><Image src="/mcm-entry-logo.png" alt="" width={74} height={62} /></span>
                <strong>{selectedExhibition.title}</strong>
                <ChevronRightIcon className="timeline-picker-arrow" />
              </button>
              <div className="timeline-exhibition-options">
                {exhibitions.map((exhibition) => (
                  <button className={selectedExhibitionId === exhibition.id ? "active" : ""} type="button" onClick={() => selectExhibition(exhibition.id)} key={exhibition.id}>
                    <strong>{exhibition.title}</strong><small>{exhibition.venue}</small>
                    <em>{exhibition.reference_type === "visit" ? "방문일" : "최초 수집일"} · {releaseDate(exhibition.reference_at, 0)}</em>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>

        {error && <p className="timed-content-error" role="alert">{error}</p>}
        <div className="timed-content-list">
          {contents.map((content) => {
            const isOpen = openContent === content.key;
            const isLoading = loadingKey === content.key;
            return (
              <article className={`timed-content-card ${isOpen ? "open" : ""}`} key={content.key}>
                <div className="timed-content-index"><i /><span>{timelineLabels[content.key]}</span></div>
                <div className="timed-content-main">
                  <div className="timed-content-title-row">
                    <span className="timed-content-icon"><TimelineContentIcon contentKey={content.key} /></span>
                    <div><h2>{content.title}</h2></div>
                  </div>
                  <small className="timed-content-day">{content.day}</small>
                  {selectedExhibition && <div className="timeline-release-date"><span>공개일</span><strong>{releaseDate(selectedExhibition.reference_at, content.dayOffset)}</strong></div>}
                  <p>{content.description}</p>

                  <div className={`timed-content-reveal${isOpen ? " open" : ""}`}>
                    <div>
                  {isOpen && content.key === "summary" && summary && (
                    <div className="visit-summary-content">
                      <section className="summary-editorial-hero">
                        {selectedExhibitionHero && <Image className="summary-editorial-image" src={selectedExhibitionHero} alt={`${selectedExhibition?.title || "전시회"} 대표 이미지`} fill sizes="(max-width: 760px) 90vw, 620px" />}
                        <div className="summary-editorial-overlay" />
                        <div className="summary-editorial-copy">
                          <span>EXHIBITION JOURNAL</span>
                          <h3>{summary.headline}</h3>
                          <p>{summary.narrative}</p>
                          <div className="summary-editorial-tags">{summary.moodKeywords.map((keyword) => <em key={keyword}>#{keyword}</em>)}</div>
                        </div>
                      </section>
                      <section className="summary-moments">
                        <div className="summary-section-heading"><h3>마음에 머문 대표 작품</h3></div>
                        {activeSummaryMoment && (
                          <div className="summary-active-moment">
                            <span>EXHIBITION MEMORY</span>
                            <h4>{activeSummaryMoment.title}</h4>
                            <p>{activeSummaryMoment.observation}</p>
                          </div>
                        )}
                        <div className="summary-moment-grid" onScroll={handleMomentScroll}>
                          {summary.artworkMoments.map((moment, momentIndex) => {
                            const imageUrl = summary.artworkImages[moment.title];
                            return <article className="summary-moment-card" key={`${moment.title}-${momentIndex}`}>
                              {imageUrl ? <Image src={imageUrl} alt={moment.title} width={480} height={360} /> : <div className="summary-art-placeholder"><span>{String(momentIndex + 1).padStart(2, "0")}</span></div>}
                              <div><small>대표 작품</small><h4>{moment.title}</h4><em>#{summary.artworkArtists?.[moment.title] || "작가 미상"}</em></div>
                            </article>;
                          })}
                        </div>
                        <div className="summary-moment-dots" aria-hidden="true">
                          {summary.artworkMoments.map((moment, index) => <i className={index === activeMomentIndex ? "active" : ""} key={moment.title} />)}
                        </div>
                      </section>
                      <section className="summary-insight"><span>AI가 발견한 공통점</span><p>{summary.commonThread}</p></section>
                      <blockquote className="summary-docent"><span>AI DOCENT&apos;S NOTE</span><p>“{summary.docentMessage}”</p></blockquote>
                    </div>
                  )}

                  {isOpen && content.key === "sticker" && stickers && (
                    <div className="sticker-result">
                      <h3>{stickers.title}</h3><p>{stickers.description}</p>
                      <div className="sticker-sheet-wrap">
                        <button className="sticker-sheet-frame" type="button" onClick={() => setStickerExpanded(true)} aria-label="스티커 이미지 전체 화면으로 보기">
                          <Image className="sticker-sheet-image" src={stickers.imageDataUrl} alt="AI가 내 수집 작품과 감상으로 만든 다이컷 전시 스티커 시트" width={768} height={1280} sizes="(max-width: 760px) 80vw, 560px" unoptimized />
                        </button>
                        <a className="sticker-save-icon" href={stickers.imageDataUrl} download="momente-exhibition-stickers.png" aria-label="스티커 이미지 저장">
                          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v11m0 0 4-4m-4 4-4-4M5 16v4h14v-4" /></svg>
                        </a>
                      </div>
                      <small>이미지를 누르면 전체 크기로 볼 수 있어요.</small>
                    </div>
                  )}

                  {isOpen && content.key === "taste" && <TasteReportPanel key={selectedExhibitionId} exhibitionId={selectedExhibitionId} />}

                  {isOpen && content.key === "invitation" && letter && (
                    <div className={`exhibition-letter-experience${letterOpened ? " opened" : ""}`}>
                      <div className="exhibition-envelope">
                        <div className="exhibition-envelope-back" />
                        <div className="exhibition-envelope-note"><span>MOMENTE</span><small>A letter from your exhibition</small></div>
                        <div className="exhibition-envelope-front">
                          <Image src="/letter-envelope/front.png" alt="" fill sizes="430px" />
                        </div>
                        <div className="exhibition-envelope-flap">
                          <Image src="/letter-envelope/flap.png" alt="" fill sizes="430px" />
                        </div>
                        <div className="exhibition-envelope-seal" aria-hidden="true">
                          <Image className="exhibition-wax-image" src="/letter-envelope/wax-seal.png" alt="" fill sizes="58px" />
                          <Image className="exhibition-wax-logo" src="/mcm-entry-logo.png" alt="" width={28} height={28} />
                        </div>
                        <button type="button" onClick={() => setLetterOpened((opened) => !opened)}>
                          <MailIcon size={16} />{letterOpened ? "편지 접기" : "편지 보기"}
                        </button>
                      </div>

                      <div className="exhibition-letter-sheet" aria-hidden={!letterOpened}>
                        <div>
                          <article className="exhibition-letter">
                            <section className="exhibition-letter-hero">
                              {selectedExhibitionHero && <Image src={selectedExhibitionHero} alt="" fill sizes="(max-width: 760px) 90vw, 620px" />}
                              <span className="exhibition-letter-hero-shade" />
                              <div><small>MOMENTE · MCM ARCHIVE</small><p className="exhibition-letter-feature-title">{selectedExhibition?.title}</p></div>
                            </section>
                            <div className="exhibition-letter-ornament" aria-hidden="true">❦　❦　❦</div>
                            <div className="exhibition-letter-paper-body">
                              <header className="exhibition-letter-header">
                                <div><MailIcon size={18} /><small>{letter.eyebrow || "Invitation to the MCM Exhibition"}</small></div>
                                <span className="exhibition-letter-stamp" aria-hidden="true"><b>MCM</b><i>SEOUL</i></span>
                              </header>
                              <div className="exhibition-letter-date">FROM THE EXHIBITION · MOMENTE ARCHIVE</div>
                              <strong className="exhibition-letter-greeting">{letter.greeting}</strong>
                              <p className="exhibition-letter-body">{letter.body}</p>
                              <blockquote>{letter.reason}</blockquote>
                              <p className="letter-closing">{letter.closing}</p>
                              {letter.recommendedExhibition && (
                                <div className="letter-next-invitation">
                                  <header><span>NEXT EXHIBITION</span><small>MOMENTE SELECTION</small></header>
                                  <b>{letter.recommendedExhibition.title}</b>
                                  <p>{letter.recommendedExhibition.venue}</p>
                                </div>
                              )}
                              <footer className="letter-paper-footer">
                                <span>MOMENTE</span>
                                <Image src="/mcm-entry-logo.png" alt="MCM" width={46} height={46} />
                                <small>FROM YOUR EXHIBITION MEMORY</small>
                              </footer>
                            </div>
                          </article>
                        </div>
                      </div>
                    </div>
                  )}
                    </div>
                  </div>
                  <button className="timed-card-toggle" type="button" disabled={isLoading} aria-expanded={isOpen} aria-label={`${content.title} ${isOpen ? "접기" : "펼치기"}`} onClick={() => handleAction(content.key)}>
                    {isLoading ? <span>AI가 만드는 중…</span> : <ChevronRightIcon />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      {stickerExpanded && stickers && (
        <div className="sticker-lightbox" role="dialog" aria-modal="true" aria-label="스티커 이미지 전체 보기" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setStickerExpanded(false);
        }}>
          <div className="sticker-lightbox-content">
            <button className="sticker-lightbox-close" type="button" onClick={() => setStickerExpanded(false)} aria-label="전체 보기 닫기">×</button>
            <Image src={stickers.imageDataUrl} alt="AI가 만든 전시 스티커 시트 전체 이미지" width={768} height={1280} unoptimized />
            <a href={stickers.imageDataUrl} download="momente-exhibition-stickers.png">이미지 저장</a>
          </div>
        </div>
      )}
    </div>
  );
}
