"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { McmProduct } from "../../lib/mcm-product-catalog";
import { ArrowRightIcon, SparkleIcon } from "../components/MomenteIcons";

type Recommendation = { product: McmProduct; reason: string; generatedAt: string };

async function readResponse(response: Response) {
  const payload = await response.json() as { recommendations?: Recommendation[]; error?: string };
  if (!response.ok) throw new Error(payload.error || "맞춤 추천을 불러오지 못했습니다.");
  return payload.recommendations || [];
}

export function ProductCurationScreen({ announce }: { announce: (message: string) => void }) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRecommendations = useCallback(async (notify = false) => {
    setRegenerating(true);
    setError(null);
    try {
      const next = await readResponse(await fetch("/api/product-recommendations", { method: "POST" }));
      setRecommendations(next);
      if (notify) announce("새로운 관람 기록까지 반영해 MCM 추천을 업데이트했습니다.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "맞춤 추천을 만들지 못했습니다.";
      setError(message);
      if (notify) announce(message);
    } finally {
      setRegenerating(false);
    }
  }, [announce]);

  useEffect(() => {
    let active = true;
    fetch("/api/product-recommendations", { cache: "no-store" })
      .then(readResponse)
      .then(async (stored) => {
        if (!active) return;
        if (stored.length > 0) {
          setRecommendations(stored);
          return;
        }
        await generateRecommendations();
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "맞춤 추천을 불러오지 못했습니다.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [generateRecommendations]);

  const generatedAt = recommendations[0]?.generatedAt
    ? new Intl.DateTimeFormat("ko-KR", { month: "long", day: "numeric" }).format(new Date(recommendations[0].generatedAt))
    : null;

  return (
    <div className="home-content">
      <section className="curation-screen mcm-reco-page">
        <header className="mcm-reco-header">
          <div className="mcm-reco-title">
            <span>AI CURATED FOR YOU</span>
            <h1>MCM Curated for You</h1>
            <p>나의 전시 기억과 취향에서 이어진 단 하나의 MCM 셀렉션</p>
          </div>
        </header>

        <section className="mcm-reco-intro">
          <div><h2>{loading || regenerating ? "취향의 연결점을 찾는 중" : "나의 기억을 닮은 MCM"}</h2><p>수집한 작품과 감상 기록을 바탕으로, 지금의 취향과 가장 가까운 상품을 골랐어요.</p></div>
          <button className="mcm-reco-refresh" type="button" disabled={loading || regenerating} onClick={() => generateRecommendations(true)}>
            <SparkleIcon size={22} />{regenerating ? "분석 중…" : "추천 새로 받기"}
          </button>
        </section>

        {error && <p className="mcm-reco-error" role="alert">{error}</p>}
        {(loading || regenerating) && recommendations.length === 0 ? (
          <div className="mcm-reco-loading" aria-live="polite"><i /><strong>나의 전시 기록을 분석하는 중</strong><span>수집 작품의 색, 소재와 감상에서 MCM 상품과의 연결점을 찾고 있습니다.</span></div>
        ) : (
          <>
          <section className="mcm-reco-list" aria-label="AI MCM 맞춤 추천 상품">
            {recommendations.map(({ product, reason }) => (
              <article className="mcm-reco-card" key={product.id}>
                <div className="mcm-reco-visual">
                  <Image className="mcm-reco-image" src={product.image} alt={product.name} fill sizes="(max-width: 480px) calc(100vw - 84px), 345px" />
                </div>
                <div className="mcm-reco-copy">
                  <small>Exhibition Collection</small><h3>{product.name}</h3>
                  <blockquote><span><SparkleIcon size={14} /> AI CURATION NOTE</span><p>{product.description}</p>{reason}</blockquote>
                  <a href={product.officialUrl} target="_blank" rel="noreferrer" onClick={() => announce("MCM 공식 스토어에서 상품을 확인합니다.")}>MCM 공식몰에서 보기 <ArrowRightIcon size={18} /></a>
                </div>
              </article>
            ))}
          </section>
          <div className="mcm-reco-indicators" aria-label="추천 상품 위치" aria-hidden="true">
            {Array.from({ length: 5 }, (_, index) => <i className={index === 0 ? "active" : ""} key={index} />)}
          </div>
          </>
        )}

        <footer className="mcm-reco-disclaimer">
          <span>MCM VERIFIED · AI PERSONALIZED</span>
          <p>{generatedAt ? `${generatedAt}의 계정 기록을 기준으로 저장된 추천입니다. ` : ""}AI는 MCM 공식 카탈로그에 등록된 상품만 선택하며, 가격과 재고는 공식몰에서 최신 정보를 확인해 주세요.</p>
        </footer>
      </section>
    </div>
  );
}
