import { FormEvent, useEffect, useRef, useState } from "react";
import { ConnectedKeyring, KeyringConnectPanel } from "../components/KeyringConnectPanel";
import { ArrowRightIcon, BookmarkIcon, ChevronRightIcon, LandmarkIcon, PencilIcon } from "../components/MomenteIcons";

type Exhibition = {
  id: string;
  title: string;
  venue: string;
  heroImageUrl: string | null;
  startAt: string;
  endAt: string;
  status: "upcoming" | "ongoing" | "ended";
};

type HomeSummary = {
  counts: { exhibitions: number; artworks: number; notes: number };
  recentExhibition: Exhibition | null;
};

const fallbackExhibitions: Exhibition[] = [
  {
    id: "exhibition-berbrick-wonderland-2025",
    title: "BE@RBRICK in MCM Wonderland",
    venue: "MCM HAUS 플래그십 스토어",
    heroImageUrl: "/artworks/berbrick-wonderland/nobuki-hizume-installation.jpg",
    startAt: "2025-09-03",
    endAt: "2025-09-30",
    status: "ended",
  },
  {
    id: "exhibition-fam-2022",
    title: "F.A.M: Fashion & Art at MCM HAUS",
    venue: "MCM HAUS 청담",
    heroImageUrl: "/artworks/fam/infinity.png",
    startAt: "2022-08-31",
    endAt: "2022-09-30",
    status: "ended",
  },
  {
    id: "exhibition-wearable-casa-2024",
    title: "WEARABLE CASA at MCM HAUS",
    venue: "MCM HAUS 플래그십 스토어",
    heroImageUrl: "/artworks/wearable-casa/chatty-sofa.png",
    startAt: "2024-09-03",
    endAt: "2024-10-06",
    status: "ended",
  },
];

const fallbackHeroImages: Record<string, string> = {
  "exhibition-berbrick-wonderland-2025": "/artworks/berbrick-wonderland/nobuki-hizume-installation.jpg",
  "exhibition-fam-2022": "/artworks/fam/infinity.png",
  "exhibition-wearable-casa-2024": "/artworks/wearable-casa/chatty-sofa.png",
};

function fallbackHeroFor(exhibition: Pick<Exhibition, "id" | "title">) {
  if (fallbackHeroImages[exhibition.id]) return fallbackHeroImages[exhibition.id];
  const title = exhibition.title.toUpperCase();
  if (title.includes("BE@RBRICK")) return "/artworks/berbrick-wonderland/nobuki-hizume-installation.jpg";
  if (title.includes("F.A.M")) return "/artworks/fam/infinity.png";
  if (title.includes("WEARABLE") || title.includes("웨어러블")) return "/artworks/wearable-casa/chatty-sofa.png";
  return null;
}

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

function formatCount(value: number) {
  return String(value).padStart(2, "0");
}

export function MomenteHomeScreen({
  announce,
  onExploreExhibitions,
}: {
  announce: (message: string) => void;
  onExploreExhibitions: (exhibitionId?: string) => void;
}) {
  const [exhibitions, setExhibitions] = useState(fallbackExhibitions);
  const [summary, setSummary] = useState<HomeSummary>({
    counts: { exhibitions: 0, artworks: 0, notes: 0 },
    recentExhibition: null,
  });
  const [keyring, setKeyring] = useState<ConnectedKeyring | null>(null);
  const [showKeyringPanel, setShowKeyringPanel] = useState(false);
  const [activeExhibition, setActiveExhibition] = useState(0);
  const [showUnlock, setShowUnlock] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [password, setPassword] = useState("");
  const [unlockError, setUnlockError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const exhibitionRailRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/exhibitions", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() as Promise<{ exhibitions?: Exhibition[] }> : null)
      .then((data) => {
        if (!active || !data?.exhibitions?.length) return;
        setExhibitions(data.exhibitions.map((exhibition) => ({
          ...exhibition,
          heroImageUrl: exhibition.heroImageUrl ?? fallbackHeroFor(exhibition),
        })));
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/keyrings", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null),
      fetch("/api/home-summary", { cache: "no-store" }).then(async (response) => response.ok ? response.json() : null),
    ])
      .then(([keyringData, summaryData]) => {
        if (!active) return;
        setKeyring((keyringData as { keyring?: ConnectedKeyring | null } | null)?.keyring ?? null);
        if (summaryData) setSummary(summaryData as HomeSummary);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  function updateActiveExhibition() {
    const rail = exhibitionRailRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-exhibition-card]"));
    const railCenter = rail.scrollLeft + rail.clientWidth / 2;
    let closestIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.offsetLeft + card.offsetWidth / 2 - railCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    setActiveExhibition(closestIndex);
  }

  async function unlockCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!password) return;
    setUnlocking(true);
    setUnlockError("");
    try {
      const response = await fetch("/api/auth/verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await response.json() as { verified?: boolean; error?: string };
      if (!response.ok || !data.verified) throw new Error(data.error ?? "비밀번호를 확인하지 못했습니다.");
      setCodeVisible(true);
      setShowUnlock(false);
      setPassword("");
      announce("연결 코드 번호가 표시되었습니다.");
    } catch (error) {
      setUnlockError(error instanceof Error ? error.message : "비밀번호를 확인하지 못했습니다.");
    } finally {
      setUnlocking(false);
    }
  }

  const recentExhibition = summary.recentExhibition
    ? { ...summary.recentExhibition, heroImageUrl: summary.recentExhibition.heroImageUrl ?? fallbackHeroFor(summary.recentExhibition) }
    : exhibitions[0];

  return (
    <div className="home-content momente-home">
      <h1 className="momente-home-title">Home</h1>

      <button className="momente-connect-button" type="button" onClick={() => setShowKeyringPanel(true)}>
        <span>NFC/ QR 연결하기</span>
        <span className="momente-double-chevron" aria-hidden="true"><ChevronRightIcon /><ChevronRightIcon /></span>
      </button>

      {recentExhibition && (
        <section
          className="momente-recent-card"
          style={recentExhibition.heroImageUrl ? { backgroundImage: `url(${recentExhibition.heroImageUrl})` } : undefined}
          aria-label={`최근 방문한 전시회 ${recentExhibition.title}`}
        >
          <div className="momente-recent-copy">
            <small>최근 방문한 전시회</small>
            <h2>{recentExhibition.title}</h2>
          </div>
          <button type="button" aria-label={`${recentExhibition.title}로 이동`} onClick={() => onExploreExhibitions(recentExhibition.id)}>
            <ArrowRightIcon size={34} />
          </button>
        </section>
      )}

      <section className="momente-exhibition-section">
        <header>
          <h2>Exhibition List</h2>
          <button type="button" onClick={() => onExploreExhibitions()}>더보기</button>
        </header>
        <div className="momente-exhibition-rail" ref={exhibitionRailRef} onScroll={updateActiveExhibition}>
          {exhibitions.map((exhibition, index) => (
            <button
              className={`momente-exhibition-card${index === activeExhibition ? " active" : ""}`}
              type="button"
              key={exhibition.id}
              data-exhibition-card
              onClick={() => onExploreExhibitions(exhibition.id)}
            >
              <span
                className="momente-exhibition-image"
                style={exhibition.heroImageUrl ? { backgroundImage: `url(${exhibition.heroImageUrl})` } : undefined}
              />
              <span className="momente-exhibition-copy">
                <strong>{exhibition.title}</strong>
                <small>{formatDate(exhibition.startAt)} ~ {formatDate(exhibition.endAt)} / {exhibition.venue}</small>
                <i aria-hidden="true"><ArrowRightIcon size={17} /></i>
              </span>
            </button>
          ))}
        </div>
        <div className="momente-rail-indicators" aria-label={`${activeExhibition + 1}번째 전시`}>
          {exhibitions.map((exhibition, index) => <i key={exhibition.id} className={index === activeExhibition ? "active" : ""} />)}
        </div>
      </section>

      <section className="momente-record-section">
        <h2>나의 방문 기록</h2>
        <div className="momente-record-grid">
          <div><strong>{formatCount(summary.counts.exhibitions)}</strong><span>방문한 전시</span><small>EXHIBITIONS</small><i><LandmarkIcon size={15} /></i></div>
          <div><strong>{formatCount(summary.counts.artworks)}</strong><span>수집한 작품</span><small>COLLECTED</small><i><BookmarkIcon size={14} /></i></div>
          <div><strong>{formatCount(summary.counts.notes)}</strong><span>한줄평</span><small>NOTES</small><i><PencilIcon size={14} /></i></div>
        </div>
      </section>

      <section className={`momente-code-card ${keyring ? "connected" : "disconnected"}`}>
        <h2>연결된 코드 번호</h2>
        <div className="momente-connection-state"><i />{keyring ? "키링이 연결되었습니다." : "연결된 키링이 없습니다."}</div>
        <div className="momente-code-rule" />
        <div className="momente-code-value">
          <span>코드 번호 : {keyring ? (codeVisible ? keyring.keyringCode : "••••••••••••") : "-"}</span>
          {keyring && (
            <button type="button" onClick={() => codeVisible ? setCodeVisible(false) : setShowUnlock(true)}>
              {codeVisible ? "숨기기" : "번호 보기"}
            </button>
          )}
        </div>
      </section>

      {showKeyringPanel && (
        <KeyringConnectPanel
          announce={announce}
          onClose={() => setShowKeyringPanel(false)}
          onConnected={(connected) => {
            setKeyring(connected);
            setCodeVisible(false);
            setShowKeyringPanel(false);
          }}
        />
      )}

      {showUnlock && (
        <div className="momente-unlock-overlay" role="dialog" aria-modal="true" aria-labelledby="unlock-title">
          <form className="momente-unlock-card" onSubmit={unlockCode}>
            <button className="momente-unlock-close" type="button" aria-label="닫기" onClick={() => { setShowUnlock(false); setUnlockError(""); }}>×</button>
            <h2 id="unlock-title">연결 코드 확인</h2>
            <p>계정 비밀번호를 입력하면 연결 코드 번호가 표시됩니다.</p>
            <label><span>비밀번호</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
            {unlockError && <p className="momente-unlock-error" role="alert">{unlockError}</p>}
            <button className="momente-unlock-submit" type="submit" disabled={unlocking || !password}>{unlocking ? "확인 중..." : "번호 확인"}</button>
          </form>
        </div>
      )}
    </div>
  );
}
