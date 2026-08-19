"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "./components/BrandMark";
import { LoginScreen } from "./screens/LoginScreen";
import { MomenteHomeScreen } from "./screens/MomenteHomeScreen";
import { ExhibitionListScreen } from "./screens/ExhibitionListScreen";
import { PersonalHallScreen } from "./screens/PersonalHallScreen";
import { ProductCurationScreen } from "./screens/ProductCurationScreen";
import { TimedContentScreen } from "./screens/TimedContentScreen";
import { MyPageScreen } from "./screens/MyPageScreen";
import { GalleryScreen } from "./screens/GalleryScreen";
import { CameraCaptureButton } from "./components/CameraCaptureButton";
import { ArtworkQrScanner } from "./components/ArtworkQrScanner";
import {
  ArrowLeftIcon,
  GalleryIcon,
  HomeIcon,
  LandmarkIcon,
  ProductIcon,
  ScanQrIcon,
  TimedContentIcon,
  UserIcon,
} from "./components/MomenteIcons";
import type { AuthUser } from "./types";

const navItems = ["홈", "전시", "사진첩", "콘텐츠", "맞춤 추천", "마이"] as const;
type ScreenKey = (typeof navItems)[number] | "전시회장";
const navIcons: Record<(typeof navItems)[number], typeof HomeIcon> = {
  홈: HomeIcon,
  전시: LandmarkIcon,
  사진첩: GalleryIcon,
  콘텐츠: TimedContentIcon,
  "맞춤 추천": ProductIcon,
  마이: UserIcon,
};

type AppRoute = {
  screen: ScreenKey;
  exhibitionId: string | null;
  artworkId: string | null;
  visitExhibitionId: string | null;
};

function parseAppRoute(pathname: string): AppRoute {
  const segments = pathname.split("/").filter(Boolean);
  const routeId = (value?: string) => value ? decodeURIComponent(value) : null;
  const exhibitionId = segments[0] === "exhibitions" ? routeId(segments[1]) : null;

  if (segments[0] === "visit" && routeId(segments[1])) {
    return { screen: "전시", exhibitionId: routeId(segments[1]), artworkId: null, visitExhibitionId: routeId(segments[1]) };
  }
  if (segments[0] === "exhibitions") {
    if (exhibitionId && segments[2] === "hall") {
      return { screen: "전시회장", exhibitionId, artworkId: null, visitExhibitionId: null };
    }
    const artworkId = exhibitionId && segments[2] === "artworks"
      ? routeId(segments[3])
      : null;
    return { screen: "전시", exhibitionId, artworkId, visitExhibitionId: null };
  }
  if (segments[0] === "gallery") {
    return {
      screen: "사진첩",
      exhibitionId: routeId(segments[1]),
      artworkId: null,
      visitExhibitionId: null,
    };
  }
  if (segments[0] === "timed-content") {
    return {
      screen: "콘텐츠",
      exhibitionId: routeId(segments[1]),
      artworkId: null,
      visitExhibitionId: null,
    };
  }
  if (segments[0] === "recommendations") return { screen: "맞춤 추천", exhibitionId: null, artworkId: null, visitExhibitionId: null };
  if (segments[0] === "my") return { screen: "마이", exhibitionId: null, artworkId: null, visitExhibitionId: null };
  return { screen: "홈", exhibitionId: null, artworkId: null, visitExhibitionId: null };
}

const navPaths: Record<(typeof navItems)[number], string> = {
  홈: "/home",
  전시: "/exhibitions",
  사진첩: "/gallery",
  콘텐츠: "/timed-content",
  "맞춤 추천": "/recommendations",
  마이: "/my",
};

function EntryScreen() {
  return (
    <main className="momente-entry-screen">
      <div className="momente-entry-brand">
        <img src="/mcm-entry-logo.png" alt="MCM" />
        <h1>MOMENTE</h1>
      </div>
      {/* A full navigation avoids the vinext client router stalling on this entry route. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/home">Enter Exhibition »</a>
    </main>
  );
}

function MainShell({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const router = useRouter();
  const pathname = usePathname();
  const route = parseAppRoute(pathname);
  const activeNav = route.screen;
  const navActiveIndex = activeNav === "전시회장" ? 1 : navItems.indexOf(activeNav);
  const bottomNavActiveIndex = navActiveIndex >= 3 ? navActiveIndex + 1 : Math.max(navActiveIndex, 0);
  const [cameraOpenRequest, setCameraOpenRequest] = useState(0);
  const [showGlobalQrScanner, setShowGlobalQrScanner] = useState(false);
  const [notice, setNotice] = useState("");
  const handledVisitLinkRef = useRef<string | null>(null);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function handleGlobalQrDetected(value: string) {
    setShowGlobalQrScanner(false);
    void fetch("/api/artworks/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: value }),
    })
      .then(async (response) => {
        const data = await response.json() as {
          duplicate?: boolean;
          artwork?: { exhibitionId: string; exhibitionArtworkId: string; title: string };
          error?: string;
        };
        if (!response.ok || !data.artwork) throw new Error(data.error ?? "작품을 찾지 못했습니다.");
        announce(data.duplicate ? "이미 수집한 작품입니다." : `${data.artwork.title} 작품을 수집했습니다.`);
        router.push(`/exhibitions/${data.artwork.exhibitionId}/artworks/${data.artwork.exhibitionArtworkId}`);
      })
      .catch((error) => announce(error instanceof Error ? error.message : "QR을 처리하지 못했습니다."));
    return null;
  }

  // NFC 태그·QR이 여는 "/visit/<exhibitionId>" 링크를 처리한다.
  // 기존에 발급한 "/?visit=<exhibitionId>" 주소도 계속 지원한다.
  // 실물 태그는 이 주소를 열기만 하면 되므로(OS/카메라가 URL을 열어줌),
  // 여기서 파라미터를 감지해 방문 인증 후 해당 전시로 바로 이동시킨다.
  useEffect(() => {
    const legacyExhibitionId = new URLSearchParams(window.location.search).get("visit");
    const exhibitionId = route.visitExhibitionId ?? legacyExhibitionId;
    if (!exhibitionId) return;
    if (handledVisitLinkRef.current === exhibitionId) return;
    handledVisitLinkRef.current = exhibitionId;

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ exhibitionId }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { visitedAt?: string; alreadyVisited?: boolean; error?: string };
        if (!response.ok || !data.visitedAt) {
          announce(data.error ?? "전시를 찾을 수 없습니다.");
          return;
        }
        announce(data.alreadyVisited ? "이미 방문 인증된 전시입니다." : "방문 인증이 완료되었습니다.");
      })
      .catch(() => {
        announce("네트워크 오류로 방문 인증에 실패했습니다.");
      })
      .finally(() => {
        router.replace(`/exhibitions/${exhibitionId}`);
      });
  }, [route.visitExhibitionId, router]);

  const screen = activeNav === "홈" ? (
    <MomenteHomeScreen
      announce={announce}
      onExploreExhibitions={(exhibitionId) => {
        router.push(exhibitionId ? `/exhibitions/${exhibitionId}` : "/exhibitions");
      }}
    />
  ) : activeNav === "전시" ? (
    <ExhibitionListScreen
      key={`exhibition:${route.exhibitionId ?? "list"}:${route.artworkId ?? "list"}`}
      announce={announce}
      initialExhibitionId={route.exhibitionId}
      initialArtworkId={route.artworkId}
      onActiveExhibitionChange={(exhibitionId) => {
        setCameraOpenRequest(0);
        const nextPath = exhibitionId ? `/exhibitions/${exhibitionId}` : "/exhibitions";
        if (pathname !== nextPath && !route.artworkId) router.push(nextPath);
      }}
      onArtworkChange={(artworkId) => {
        if (!route.exhibitionId) return;
        const nextPath = artworkId
          ? `/exhibitions/${route.exhibitionId}/artworks/${artworkId}`
          : `/exhibitions/${route.exhibitionId}`;
        if (pathname !== nextPath) router.push(nextPath);
      }}
      onOpenPersonalHall={(exhibitionId) => router.push(`/exhibitions/${exhibitionId}/hall`)}
    />
  ) : activeNav === "전시회장" ? (
    <PersonalHallScreen
      exhibitionId={route.exhibitionId}
      onBack={() => router.push(route.exhibitionId ? `/exhibitions/${route.exhibitionId}` : "/exhibitions")}
      announce={announce}
    />
  ) : activeNav === "사진첩" ? (
    <GalleryScreen
      key={`gallery:${route.exhibitionId ?? "albums"}`}
      onOpenCamera={() => setCameraOpenRequest((request) => request + 1)}
      initialExhibitionId={route.exhibitionId}
      onSelectedExhibitionChange={(exhibitionId) => {
        setCameraOpenRequest(0);
        const nextPath = exhibitionId ? `/gallery/${exhibitionId}` : "/gallery";
        if (pathname !== nextPath) router.push(nextPath);
      }}
    />
  ) : activeNav === "콘텐츠" ? (
    <TimedContentScreen
      announce={announce}
      initialExhibitionId={route.exhibitionId}
      onSelectedExhibitionChange={(exhibitionId) => {
        const nextPath = `/timed-content/${exhibitionId}`;
        if (pathname !== nextPath) router.push(nextPath);
      }}
    />
  ) : activeNav === "맞춤 추천" ? (
    <ProductCurationScreen announce={announce} />
  ) : (
    <MyPageScreen user={user} onLogout={onLogout} />
  );

  const hideBottomNav = (activeNav === "전시" && Boolean(route.exhibitionId)) || activeNav === "전시회장";
  const showExhibitionCamera = activeNav === "전시" && Boolean(route.exhibitionId);

  return (
    <main className={`home-shell${hideBottomNav ? " detail-route" : ""}`}>
      <header className="home-header">
        {(activeNav === "전시" || activeNav === "사진첩") && (
          <button
            className="header-back-button"
            type="button"
            aria-label={activeNav === "사진첩"
              ? route.exhibitionId ? "사진첩 목록으로 돌아가기" : "홈으로 돌아가기"
              : route.artworkId ? "전시 상세로 돌아가기" : route.exhibitionId ? "전시 목록으로 돌아가기" : "홈으로 돌아가기"}
            onClick={() => {
              if (activeNav === "사진첩") {
                router.push(route.exhibitionId ? "/gallery" : "/home");
                return;
              }
              router.push(
                route.artworkId && route.exhibitionId
                  ? `/exhibitions/${route.exhibitionId}`
                  : route.exhibitionId ? "/exhibitions" : "/home",
              );
            }}
          >
            <ArrowLeftIcon />
          </button>
        )}
        <button className="header-home-button" type="button" aria-label="홈으로 이동" onClick={() => router.push("/home")}>
          <img src="/mcm-entry-logo.png" alt="MCM" />
        </button>
        <div className="header-actions">
          <button className="avatar-button" type="button" aria-label={`${user.username} 마이 페이지`} onClick={() => router.push("/my")}>
            <UserIcon />
          </button>
        </div>
      </header>

      {screen}

      {(showExhibitionCamera || (cameraOpenRequest > 0 && activeNav === "사진첩" && Boolean(route.exhibitionId))) && (
        <CameraCaptureButton
          key={`${route.exhibitionId}:${cameraOpenRequest}`}
          activeExhibitionId={route.exhibitionId}
          initiallyOpen={cameraOpenRequest > 0}
          announce={announce}
        />
      )}

      <nav
        className={`bottom-nav${hideBottomNav ? " detail-hidden" : ""}`}
        aria-label="주 메뉴"
        aria-hidden={hideBottomNav}
        style={{ "--nav-active-index": bottomNavActiveIndex } as CSSProperties}
      >
        {navItems.slice(0, 3).map((key) => {
          const Icon = navIcons[key];
          return (
            <button className={activeNav === key ? "active" : ""} type="button" key={key} onClick={() => router.push(navPaths[key])}>
              <Icon /><small>{key === "전시" ? "전시회" : key}</small>
            </button>
          );
        })}
        <button className="bottom-nav-qr" type="button" aria-label="작품 QR 스캔" onClick={() => setShowGlobalQrScanner(true)}>
          <ScanQrIcon />
        </button>
        {navItems.slice(3).map((key) => {
          const Icon = navIcons[key];
          return (
            <button className={activeNav === key ? "active" : ""} type="button" key={key} onClick={() => router.push(navPaths[key])}>
              <Icon /><small>{key === "콘텐츠" ? "시간차" : key === "맞춤 추천" ? "추천" : key}</small>
            </button>
          );
        })}
      </nav>
      {showGlobalQrScanner && <ArtworkQrScanner onClose={() => setShowGlobalQrScanner(false)} onDetected={handleGlobalQrDetected} />}
      <div className={`toast ${notice ? "visible" : ""}`} role="status">{notice}</div>
    </main>
  );
}

export function MemoryTagApp() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/session", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json() as { user?: AuthUser };
        return data.user ?? null;
      })
      .catch(() => null)
      .then((sessionUser) => {
        if (!active) return;
        setUser(sessionUser);
        setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    setUser(null);
  }

  if (pathname === "/") {
    return <EntryScreen />;
  }

  if (checkingSession) {
    return (
      <main className="auth-loading" aria-live="polite">
        <BrandMark />
        <span className="spinner dark" aria-label="로그인 상태 확인 중" />
      </main>
    );
  }

  return user ? (
    <MainShell user={user} onLogout={logout} />
  ) : (
    <LoginScreen onAuthenticated={setUser} />
  );
}
