import { useEffect, useState } from "react";

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
  totalArtworks: number;
  visited: boolean;
  collectedCount: number;
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

  return (
    <div className="home-content">
      <section className="section-block exhibition-detail-section">
        <button type="button" className="detail-back-button" onClick={onBack}>
          ← 전시 목록
        </button>

        {error && <p className="form-error">{error}</p>}
        {!error && !exhibition && <p>전시 정보를 불러오는 중입니다…</p>}

        {exhibition && (
          <>
            <div className={`exhibition-art detail-hero${exhibition.heroImageUrl ? "" : " art-placeholder"}`} />

            <div className="detail-status-row">
              <span className="status-chip static">{STATUS_LABEL[exhibition.status]}</span>
            </div>
            <h1 className="detail-title">{exhibition.title}</h1>
            <div className="detail-meta-row">
              <span>장소 · {exhibition.venue}</span>
              <button
                type="button"
                className="text-link-button"
                onClick={() =>
                  window.open(
                    `https://map.naver.com/p/search/${encodeURIComponent(exhibition.venue)}`,
                    "_blank",
                    "noopener,noreferrer",
                  )
                }
              >
                길찾기
              </button>
            </div>
            <p className="detail-meta-line">
              {formatDate(exhibition.startAt)} – {formatDate(exhibition.endAt)}
            </p>
            {exhibition.operatingHours && <p className="detail-meta-line">운영 시간 · {exhibition.operatingHours}</p>}

            <div className="detail-info-box">
              <h2>전시 소개</h2>
              <p>{exhibition.description ?? "등록된 소개가 없습니다."}</p>
            </div>

            <div className="detail-info-box">
              <h2>참여 작가</h2>
              {exhibition.artists.length === 0 ? (
                <p>등록된 작가 정보가 없습니다.</p>
              ) : (
                <ul className="artist-list">
                  {exhibition.artists.map((artist) => (
                    <li className="artist-row" key={artist.id}>
                      <span className="artist-avatar" aria-hidden="true">
                        {artist.name.slice(0, 1)}
                      </span>
                      <span>{artist.name}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="detail-info-box">
              <h2>방문 및 수집 현황</h2>
              <div className="stat-row">
                <span>방문 인증</span>
                <span>{exhibition.visited ? "인증 완료" : "미인증"}</span>
              </div>
              <div className="stat-row">
                <span>수집 작품</span>
                <span>
                  {exhibition.collectedCount} / {exhibition.totalArtworks}점
                </span>
              </div>
              <p className="detail-hint">키링을 연결하면 전시 방문 인증과 작품 수집이 시작됩니다.</p>
            </div>

            <button
              type="button"
              className="primary-button detail-cta"
              onClick={() => announce("키링 연결 화면은 다음 단계에서 제공됩니다.")}
            >
              키링 연결하기
            </button>
          </>
        )}
      </section>
    </div>
  );
}
