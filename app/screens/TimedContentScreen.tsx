"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TasteReportPanel } from "../components/TasteReportPanel";

type ContentKey = "summary" | "sticker" | "taste" | "invitation";
type Summary = {
  headline: string;
  narrative: string;
  moodKeywords: string[];
  artworkMoments: Array<{ title: string; reaction: string; observation: string }>;
  commonThread: string;
  docentMessage: string;
  artworkImages: Record<string, string | null>;
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
  id: string; title: string; venue: string; reference_at: string; reference_type: "visit" | "collection";
};

const contents: Array<{
  key: ContentKey; day: string; dayOffset: number; title: string; description: string; action: string;
}> = [
  { key: "summary", day: "당일 공개", dayOffset: 0, title: "맞춤형 관람 요약", description: "내가 실제로 방문하고 수집한 작품과 감상 기록을 AI가 한 편의 관람 기록으로 정리합니다.", action: "AI 요약 만들기" },
  { key: "sticker", day: "1일 후 공개", dayOffset: 1, title: "나만의 전시 스티커", description: "수집한 작품의 제목, 소재와 내가 남긴 감상에서 모티프를 찾아 AI 스티커 팩을 만듭니다.", action: "AI 스티커 만들기" },
  { key: "taste", day: "7일 후 공개", dayOffset: 7, title: "취향 리포트", description: "사진, 수집 작품과 감상 기록을 바탕으로 AI가 나만의 미적 취향을 분석합니다.", action: "취향 분석하기" },
  { key: "invitation", day: "30일 후 공개", dayOffset: 30, title: "전시회에서 온 편지", description: "내 관람 취향과 이어지는 실제 다른 전시를 골라 AI가 개인 초대 편지를 씁니다.", action: "AI 편지 받기" },
];

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

  function selectExhibition(id: string) {
    setSelectedExhibitionId(id);
    onSelectedExhibitionChange?.(id);
    setGenerated(savedByExhibition[id] || {});
    setOpenContent(null);
    setError(null);
  }

  async function handleAction(key: ContentKey) {
    if (!selectedExhibitionId) {
      setError("콘텐츠를 볼 전시회를 먼저 선택해 주세요.");
      return;
    }
    if (openContent === key) {
      setOpenContent(null);
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

  const summary = generated.summary;
  const stickers = generated.sticker;
  const letter = generated.invitation;

  return (
    <div className="home-content">
      <section className="timed-content-screen">
        <header className="timed-content-heading">
          <span className="section-kicker">MEMORY TIMELINE</span>
          <h1>전시 이후 기록</h1>
          <p>현재 로그인 계정의 DB 기록을 바탕으로 AI 콘텐츠가 순차적으로 도착합니다.</p>
        </header>

        <section className="timeline-exhibition-picker" aria-label="시간차 콘텐츠 전시 선택">
          <div><span>MY EXHIBITION</span><h2>어떤 전시의 기록을 볼까요?</h2></div>
          {listLoading ? <p>전시 기록을 불러오는 중…</p> : exhibitions.length === 0 ? <p>방문하거나 작품을 수집한 전시가 아직 없습니다.</p> : (
            <div className="timeline-exhibition-options">
              {exhibitions.map((exhibition) => (
                <button className={selectedExhibitionId === exhibition.id ? "active" : ""} type="button" onClick={() => selectExhibition(exhibition.id)} key={exhibition.id}>
                  <strong>{exhibition.title}</strong><small>{exhibition.venue}</small>
                  <em>{exhibition.reference_type === "visit" ? "방문일" : "최초 수집일"} · {releaseDate(exhibition.reference_at, 0)}</em>
                </button>
              ))}
            </div>
          )}
        </section>

        {error && <p className="timed-content-error" role="alert">{error}</p>}
        <div className="timed-content-list">
          {contents.map((content, index) => {
            const isOpen = openContent === content.key;
            const isLoading = loadingKey === content.key;
            const hasGenerated = content.key === "taste" || (content.key !== "taste" && Boolean(generated[content.key]));
            return (
              <article className={`timed-content-card ${isOpen ? "open" : ""}`} key={content.key}>
                <div className="timed-content-index"><span>{String(index + 1).padStart(2, "0")}</span><i /></div>
                <div className="timed-content-main">
                  <div className="timed-content-title-row">
                    <div><h2>{content.title}</h2><small>{content.day}</small></div>
                    <span className="timed-content-status">AI 맞춤</span>
                  </div>
                  {selectedExhibition && <div className="timeline-release-date"><span>공개일</span><strong>{releaseDate(selectedExhibition.reference_at, content.dayOffset)}</strong></div>}
                  <p>{content.description}</p>
                  <button type="button" disabled={isLoading} onClick={() => handleAction(content.key)}>
                    {isLoading ? "AI가 만드는 중…" : isOpen ? "접기" : hasGenerated ? "다시 보기" : content.action}
                  </button>

                  {isOpen && content.key === "summary" && summary && (
                    <div className="visit-summary-content">
                      <div className="summary-stat"><strong>{String(summary.counts.exhibitions).padStart(2, "0")}</strong><span>기록 전시</span></div>
                      <div className="summary-stat"><strong>{String(summary.counts.artworks).padStart(2, "0")}</strong><span>수집 작품</span></div>
                      <div className="summary-stat"><strong>{String(summary.counts.notes).padStart(2, "0")}</strong><span>남긴 감상</span></div>
                      <section className="summary-hero">
                        <span>MY EXHIBITION MOMENT</span><h3>{summary.headline}</h3><p>{summary.narrative}</p>
                        <div className="summary-moods">{summary.moodKeywords.map((keyword) => <em key={keyword}>#{keyword}</em>)}</div>
                      </section>
                      <section className="summary-moments">
                        <div className="summary-section-heading"><span>AI SELECTED · UP TO 2</span><h3>마음에 머문 대표 작품</h3></div>
                        <div className="summary-moment-grid">
                          {summary.artworkMoments.map((moment, momentIndex) => {
                            const imageUrl = summary.artworkImages[moment.title];
                            return <article className="summary-moment-card" key={`${moment.title}-${momentIndex}`}>
                              {imageUrl ? <Image src={imageUrl} alt={moment.title} width={480} height={360} /> : <div className="summary-art-placeholder"><span>{String(momentIndex + 1).padStart(2, "0")}</span></div>}
                              <div><small>{moment.reaction}</small><h4>{moment.title}</h4><p>{moment.observation}</p></div>
                            </article>;
                          })}
                        </div>
                      </section>
                      <section className="summary-insight"><span>AI가 발견한 공통점</span><p>{summary.commonThread}</p></section>
                      <blockquote className="summary-docent"><span>AI DOCENT&apos;S NOTE</span><p>“{summary.docentMessage}”</p></blockquote>
                    </div>
                  )}

                  {isOpen && content.key === "sticker" && stickers && (
                    <div className="sticker-result">
                      <h3>{stickers.title}</h3><p>{stickers.description}</p>
                      <Image className="sticker-sheet-image" src={stickers.imageDataUrl} alt="AI가 내 수집 작품과 감상으로 만든 다이컷 전시 스티커 시트" width={1024} height={1536} unoptimized />
                      <small>이미지를 길게 눌러 저장할 수 있어요.</small>
                    </div>
                  )}

                  {isOpen && content.key === "taste" && <TasteReportPanel key={selectedExhibitionId} exhibitionId={selectedExhibitionId} />}

                  {isOpen && content.key === "invitation" && letter && (
                    <article className="exhibition-letter">
                      <small>{letter.eyebrow}</small><h3>{letter.title}</h3>
                      <strong>{letter.greeting}</strong><p>{letter.body}</p>
                      <blockquote>{letter.reason}</blockquote><p className="letter-closing">{letter.closing}</p>
                      {letter.recommendedExhibition && (
                        <div className="letter-exhibition">
                          <span>INVITATION</span><b>{letter.recommendedExhibition.title}</b>
                          <small>{letter.recommendedExhibition.venue}</small>
                        </div>
                      )}
                    </article>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
