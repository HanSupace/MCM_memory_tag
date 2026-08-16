"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import type { McmProduct } from "../../lib/mcm-product-catalog";

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
      <section className="curation-screen">
        <header className="curation-heading">
          <div><span className="section-kicker">AI CURATED FOR YOU · MCM ONLY</span><h1>기억에서 이어진<br />MCM 셀렉션</h1></div>
          <p>내 수집 작품, 감상과 취향 리포트를 AI가 함께 읽고 MCM 공식 상품 안에서 나에게 맞는 것만 골랐습니다.</p>
        </header>

        <section className="curation-proof" aria-label="추천 기준">
          <div><span>01</span><strong>내 기록 AI 분석</strong><small>계정별 추천 결과</small></div>
          <div><span>02</span><strong>MCM 공식 상품</strong><small>승인된 카탈로그만 선택</small></div>
          <div><span>03</span><strong>계정에 결과 저장</strong><small>다른 계정과 완전 분리</small></div>
        </section>

        <section className="curation-context">
          <span className="section-kicker">YOUR PERSONAL CURATION</span>
          <div><h2>{loading || regenerating ? "AI가 취향의 연결점을 찾고 있어요" : "내 관람 기록에서 찾은 세 가지 선택"}</h2><p>추천 이유는 같은 상품이라도 계정의 작품 수집과 감상 기록에 따라 다르게 작성됩니다.</p></div>
          <button className="curation-refresh" type="button" disabled={loading || regenerating} onClick={() => generateRecommendations(true)}>
            {regenerating ? "분석 중…" : "AI 추천 다시 받기"}
          </button>
        </section>

        {error && <p className="curation-error" role="alert">{error}</p>}
        {(loading || regenerating) && recommendations.length === 0 ? (
          <div className="curation-loading" aria-live="polite"><i /><strong>나의 전시 기록을 분석하는 중</strong><span>수집 작품의 색, 소재와 감상에서 MCM 상품과의 연결점을 찾고 있습니다.</span></div>
        ) : (
          <section className="mcm-curation-grid" aria-label="AI MCM 맞춤 추천 상품">
            {recommendations.map(({ product, reason }, index) => (
              <article className={`mcm-curation-card ${index === 0 ? "featured" : ""}`} key={product.id}>
                <div className="mcm-product-visual">
                  <div className="mcm-product-label"><span>AI PICK · {product.kind}</span><b>{String(index + 1).padStart(2, "0")}</b></div>
                  <Image className="mcm-product-image" src={product.image} alt={product.name} fill sizes="(max-width: 640px) 100vw, 50vw" />
                  {index === 0 && <em>가장 높은 연결</em>}
                </div>
                <div className="mcm-product-copy">
                  <small>{product.kind}</small><h3>{product.name}</h3><p>{product.description}</p>
                  <blockquote><span>AI가 찾은 나와의 연결</span>{reason}</blockquote>
                  <a href={product.officialUrl} target="_blank" rel="noreferrer" onClick={() => announce("MCM 공식 스토어에서 상품을 확인합니다.")}>MCM 공식몰에서 보기 <span>↗</span></a>
                </div>
              </article>
            ))}
          </section>
        )}

        <footer className="curation-disclaimer">
          <span>MCM VERIFIED · AI PERSONALIZED</span>
          <p>{generatedAt ? `${generatedAt}의 계정 기록을 기준으로 저장된 추천입니다. ` : ""}AI는 MCM 공식 카탈로그에 등록된 상품만 선택하며, 가격과 재고는 공식몰에서 최신 정보를 확인해 주세요.</p>
        </footer>
      </section>
    </div>
  );
}
