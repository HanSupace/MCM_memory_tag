"use client";

import { useEffect, useState } from "react";

type TasteReport = {
  exhibitionId?: string;
  title: string;
  summary: string;
  keywords: string[];
  evidence: string[];
  recommendations: string[];
  confidence: number;
  sourceCounts: { photos: number; artworks: number; notes: number; docentQuestions: number };
  generatedAt: string;
};

async function readResponse(response: Response) {
  const body = await response.json() as { report?: TasteReport | null; error?: string };
  if (!response.ok) throw new Error(body.error ?? "요청을 처리하지 못했습니다.");
  return body;
}

export function TasteReportPanel({ exhibitionId }: { exhibitionId?: string }) {
  const [report, setReport] = useState<TasteReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const query = exhibitionId ? `?exhibitionId=${encodeURIComponent(exhibitionId)}` : "";
    fetch(`/api/taste-report${query}`, { cache: "no-store" })
      .then(readResponse)
      .then((body) => { if (active) setReport(body.report ?? null); })
      .catch(() => undefined)
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [exhibitionId]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const body = await readResponse(await fetch("/api/taste-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibitionId }),
      }));
      setReport(body.report ?? null);
      setExpanded(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "잠시 후 다시 시도해 주세요.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) return <section className="taste-report-card taste-report-loading">취향 기록을 확인하는 중입니다…</section>;

  if (!report) {
    return (
      <section className="taste-report-card taste-report-empty">
        <span className="section-kicker">YOUR MCM TASTE · AI REPORT</span>
        <h2>당신의 전시 취향을 발견해 보세요</h2>
        <p>사진, 수집한 작품, 감상평과 개인화에 동의한 도슨트 질문을 함께 살펴봅니다.</p>
        {error && <p className="taste-report-error" role="alert">{error}</p>}
        <button type="button" onClick={generate} disabled={generating}>
          {generating ? "취향을 분석하는 중…" : "AI 취향 리포트 만들기"}
        </button>
      </section>
    );
  }

  const totalSources = Object.values(report.sourceCounts).reduce((sum, count) => sum + count, 0);
  return (
    <section className="taste-report-card">
      <span className="section-kicker">YOUR MCM TASTE · AI REPORT</span>
      <h2>{report.title}</h2>
      <div className="taste-report-tags">{report.keywords.map((keyword) => <span key={keyword}>#{keyword}</span>)}</div>
      <p className="taste-report-summary">{report.summary}</p>
      <div className="taste-report-meta">
        <span>신뢰도 {Math.round(report.confidence * 100)}%</span>
        <span>{totalSources}개의 기록 분석</span>
      </div>
      {expanded && (
        <div className="taste-report-details">
          <h3>이렇게 발견했어요</h3>
          <ul>{report.evidence.map((item) => <li key={item}>{item}</li>)}</ul>
          <h3>당신을 위한 다음 제안</h3>
          <ul>{report.recommendations.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      )}
      {error && <p className="taste-report-error" role="alert">{error}</p>}
      <div className="taste-report-actions">
        <button type="button" className="secondary" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "리포트 접기" : "분석 근거 보기"}
        </button>
        <button type="button" onClick={generate} disabled={generating}>
          {generating ? "업데이트 중…" : "리포트 업데이트"}
        </button>
      </div>
    </section>
  );
}
