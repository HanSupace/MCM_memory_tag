import { useEffect, useState } from "react";
import { ExhibitionDetailScreen } from "./ExhibitionDetailScreen";
import { NativeQrScanner } from "../components/NativeQrScanner";

type ExhibitionStatus = "upcoming" | "ongoing" | "ended";

type ExhibitionSummary = {
  id: string;
  title: string;
  venue: string;
  heroImageUrl: string | null;
  startAt: string;
  endAt: string;
  status: ExhibitionStatus;
};

const STATUS_LABEL: Record<ExhibitionStatus, string> = {
  ongoing: "진행 중",
  upcoming: "예정",
  ended: "종료",
};

const FILTERS: Array<{ key: "all" | ExhibitionStatus; label: string }> = [
  { key: "all", label: "전체" },
  { key: "ongoing", label: "진행 중" },
  { key: "upcoming", label: "예정" },
  { key: "ended", label: "종료" },
];

function formatDateRange(startAt: string, endAt: string) {
  const format = (value: string) => {
    const date = new Date(value);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
  };
  return `${format(startAt)} – ${format(endAt)}`;
}

export function ExhibitionListScreen({
  announce,
  initialExhibitionId = null,
  initialArtworkId = null,
  onActiveExhibitionChange,
  onArtworkChange,
  onOpenPersonalHall,
}: {
  announce: (message: string) => void;
  initialExhibitionId?: string | null;
  initialArtworkId?: string | null;
  onActiveExhibitionChange?: (exhibitionId: string | null) => void;
  onArtworkChange?: (artworkId: string | null) => void;
  onOpenPersonalHall: (exhibitionId: string) => void;
}) {
  const [exhibitions, setExhibitions] = useState<ExhibitionSummary[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"all" | ExhibitionStatus>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialExhibitionId);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);

  function handleQrDetected(value: string) {
    try {
      const parsed = new URL(value, window.location.origin);
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments[0] !== "visit" && segments[0] !== "collect") {
        announce("전시 입장 또는 작품 QR을 인식해 주세요.");
        return;
      }
      setQrScannerOpen(false);
      window.location.assign(`${parsed.pathname}${parsed.search}`);
    } catch {
      announce("QR 주소를 읽지 못했습니다.");
    }
  }

  useEffect(() => {
    onActiveExhibitionChange?.(selectedId);
  }, [onActiveExhibitionChange, selectedId]);

  useEffect(() => {
    let active = true;

    fetch("/api/exhibitions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        const data = (await response.json()) as { exhibitions: ExhibitionSummary[] };
        return data.exhibitions;
      })
      .then((list) => {
        if (active) setExhibitions(list);
      })
      .catch(() => {
        if (active) setError("전시 목록을 불러오지 못했습니다.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (selectedId) {
    return (
      <ExhibitionDetailScreen
        exhibitionId={selectedId}
        initialArtworkId={initialArtworkId}
        onBack={() => {
          setSelectedId(null);
          onActiveExhibitionChange?.(null);
        }}
        onArtworkChange={onArtworkChange}
        onOpenPersonalHall={onOpenPersonalHall}
        announce={announce}
      />
    );
  }

  const filtered = (exhibitions ?? []).filter((exhibition) => {
    const matchesFilter = filter === "all" || exhibition.status === filter;
    const normalizedQuery = query.trim().toLocaleLowerCase("ko");
    const matchesQuery = normalizedQuery.length === 0
      || exhibition.title.toLocaleLowerCase("ko").includes(normalizedQuery)
      || exhibition.venue.toLocaleLowerCase("ko").includes(normalizedQuery);
    return matchesFilter && matchesQuery;
  });

  return (
    <div className="home-content">
      <section className="exhibition-explore-section">
        <div className="explore-titlebar">
          <div>
            <span className="section-kicker">EXHIBITION</span>
            <h1>전시 탐색</h1>
          </div>
          <button type="button" className="qr-header-button" onClick={() => setQrScannerOpen(true)}>
            <span aria-hidden="true">▦</span> QR
          </button>
        </div>

        <label className="explore-search">
          <span aria-hidden="true" className="search-symbol" />
          <span className="sr-only">전시 검색</span>
          <input
            type="search"
            placeholder="전시명, 장소로 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <div className="filter-row">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`filter-chip${filter === item.key ? " active" : ""}`}
              onClick={() => setFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && <p className="form-error">{error}</p>}
        {!error && exhibitions === null && <p>전시를 불러오는 중입니다…</p>}
        {!error && exhibitions !== null && filtered.length === 0 && <p>조건에 맞는 전시가 없습니다.</p>}

        <div className="exhibition-list-grid explore-card-grid">
          {filtered.map((exhibition) => (
            <button
              type="button"
              className="exhibition-card exhibition-list-card"
              key={exhibition.id}
              onClick={() => {
                setSelectedId(exhibition.id);
                onActiveExhibitionChange?.(exhibition.id);
              }}
            >
              <div
                className={`exhibition-art${exhibition.heroImageUrl ? "" : " art-placeholder"}`}
                style={exhibition.heroImageUrl ? { backgroundImage: `url(${exhibition.heroImageUrl})` } : undefined}
              >
                <span className={`status-chip${exhibition.status === "upcoming" ? " upcoming" : ""}`}>
                  {STATUS_LABEL[exhibition.status]}
                </span>
              </div>
              <div className="exhibition-card-body">
                <h3>{exhibition.title}</h3>
                <p>
                  {exhibition.venue} · {formatDateRange(exhibition.startAt, exhibition.endAt)}
                </p>
                <span className="explore-card-action">전시 작품 보기 <b>↗</b></span>
              </div>
            </button>
          ))}
        </div>
      </section>
      {qrScannerOpen && <NativeQrScanner onDetected={handleQrDetected} onClose={() => setQrScannerOpen(false)} />}
    </div>
  );
}
