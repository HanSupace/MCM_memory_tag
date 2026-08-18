"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { BrandMark } from "./components/BrandMark";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ExhibitionListScreen } from "./screens/ExhibitionListScreen";
import { PersonalHallScreen } from "./screens/PersonalHallScreen";
import { ProductCurationScreen } from "./screens/ProductCurationScreen";
import { TimedContentScreen } from "./screens/TimedContentScreen";
import { MyPageScreen } from "./screens/MyPageScreen";
import { GalleryScreen } from "./screens/GalleryScreen";
import { CameraCaptureButton } from "./components/CameraCaptureButton";
import { OperatorScreen } from "./screens/OperatorScreen";
import { AccessLockedPanel } from "./components/AccessLockedPanel";
import type { AuthUser } from "./types";

const navItems = ["홈", "전시", "사진첩", "콘텐츠", "맞춤 추천", "마이"] as const;
type ScreenKey = (typeof navItems)[number] | "전시회장" | "운영자";
const navIconClasses: Record<(typeof navItems)[number], string> = {
  홈: "nav-1",
  전시: "nav-2",
  사진첩: "nav-4",
  콘텐츠: "nav-3",
  "맞춤 추천": "nav-5",
  마이: "nav-6",
};

type AppRoute = {
  screen: ScreenKey;
  exhibitionId: string | null;
  artworkId: string | null;
  visitEntryToken: string | null;
  collectExhibitionId: string | null;
  collectIdentifier: string | null;
};

function parseAppRoute(pathname: string): AppRoute {
  const segments = pathname.split("/").filter(Boolean);
  const exhibitionId = segments[0] === "exhibitions" && /^\d+$/.test(segments[1] ?? "") ? segments[1] : null;

  if (segments[0] === "visit" && segments[1]) {
    return {
      screen: "전시",
      exhibitionId: null,
      artworkId: null,
      visitEntryToken: segments[1],
      collectExhibitionId: null,
      collectIdentifier: null,
    };
  }
  if (segments[0] === "collect" && segments[1]) {
    const hasExhibitionPrefix = Boolean(segments[2]);
    return {
      screen: "전시",
      exhibitionId: hasExhibitionPrefix && /^\d+$/.test(segments[1]) ? segments[1] : null,
      artworkId: null,
      visitEntryToken: null,
      collectExhibitionId: hasExhibitionPrefix && /^\d+$/.test(segments[1]) ? segments[1] : null,
      collectIdentifier: hasExhibitionPrefix ? segments[2] : segments[1],
    };
  }
  if (segments[0] === "exhibitions") {
    if (exhibitionId && segments[2] === "hall") {
      return { screen: "전시회장", exhibitionId, artworkId: null, visitEntryToken: null, collectExhibitionId: null, collectIdentifier: null };
    }
    const artworkId = exhibitionId && segments[2] === "artworks" && /^\d+$/.test(segments[3] ?? "")
      ? segments[3]
      : null;
    return { screen: "전시", exhibitionId, artworkId, visitEntryToken: null, collectExhibitionId: null, collectIdentifier: null };
  }
  if (segments[0] === "gallery") {
    return {
      screen: "사진첩",
      exhibitionId: /^\d+$/.test(segments[1] ?? "") ? segments[1] : null,
      artworkId: null,
      visitEntryToken: null,
      collectExhibitionId: null,
      collectIdentifier: null,
    };
  }
  if (segments[0] === "timed-content") {
    return {
      screen: "콘텐츠",
      exhibitionId: /^\d+$/.test(segments[1] ?? "") ? segments[1] : null,
      artworkId: null,
      visitEntryToken: null,
      collectExhibitionId: null,
      collectIdentifier: null,
    };
  }
  if (segments[0] === "recommendations") return { screen: "맞춤 추천", exhibitionId: null, artworkId: null, visitEntryToken: null, collectExhibitionId: null, collectIdentifier: null };
  if (segments[0] === "operator") return { screen: "운영자", exhibitionId: null, artworkId: null, visitEntryToken: null, collectExhibitionId: null, collectIdentifier: null };
  if (segments[0] === "my") return { screen: "마이", exhibitionId: null, artworkId: null, visitEntryToken: null, collectExhibitionId: null, collectIdentifier: null };
  return { screen: "홈", exhibitionId: null, artworkId: null, visitEntryToken: null, collectExhibitionId: null, collectIdentifier: null };
}

const navPaths: Record<(typeof navItems)[number], string> = {
  홈: "/",
  전시: "/exhibitions",
  사진첩: "/gallery",
  콘텐츠: "/timed-content",
  "맞춤 추천": "/recommendations",
  마이: "/my",
};

function MainShell({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const router = useRouter();
  const pathname = usePathname();
  const route = parseAppRoute(pathname);
  const activeNav = route.screen;
  const [cameraOpenRequest, setCameraOpenRequest] = useState(0);
  const [notice, setNotice] = useState("");
  const handledAccessLinkRef = useRef<string | null>(null);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  // NFC 태그·전시장 QR이 여는 "/visit/<entryToken>" 링크를 처리한다.
  // 기존 query 형식은 토큰만 지원하며, 숫자 전시 ID는 더 이상 인증 수단으로 사용하지 않는다.
  // 실물 태그는 이 주소를 열기만 하면 되므로(OS/카메라가 URL을 열어줌),
  // 여기서 파라미터를 감지해 방문 인증 후 해당 전시로 바로 이동시킨다.
  useEffect(() => {
    const queryEntryToken = new URLSearchParams(window.location.search).get("visit");
    const entryToken = route.visitEntryToken ?? (queryEntryToken && !/^\d+$/.test(queryEntryToken) ? queryEntryToken : null);
    if (!entryToken) return;
    const accessLinkKey = `visit:${entryToken}`;
    if (handledAccessLinkRef.current === accessLinkKey) return;
    handledAccessLinkRef.current = accessLinkKey;

    fetch("/api/visits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryToken }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { exhibitionId?: string; visitedAt?: string; alreadyVisited?: boolean; error?: string };
        if (!response.ok || !data.visitedAt) {
          announce(data.error ?? "전시를 찾을 수 없습니다.");
          router.replace("/exhibitions");
          return;
        }
        announce(data.alreadyVisited ? "이미 방문 인증된 전시입니다." : "방문 인증이 완료되었습니다.");
        router.replace(`/exhibitions/${data.exhibitionId}`);
      })
      .catch(() => {
        announce("네트워크 오류로 방문 인증에 실패했습니다.");
        router.replace("/exhibitions");
      })
      .finally(() => undefined);
  }, [route.visitEntryToken, router]);

  const collectExhibitionId = route.collectExhibitionId;
  const collectIdentifier = route.collectIdentifier;

  useEffect(() => {
    if (!collectIdentifier) return;
    const accessLinkKey = `collect:${collectExhibitionId ?? "any"}:${collectIdentifier}`;
    if (handledAccessLinkRef.current === accessLinkKey) return;
    handledAccessLinkRef.current = accessLinkKey;

    fetch("/api/artworks/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...(collectExhibitionId ? { exhibitionId: collectExhibitionId } : {}), identifier: collectIdentifier, artworkQr: true }),
    })
      .then(async (response) => {
        const data = (await response.json()) as { collected?: boolean; duplicate?: boolean; artwork?: { exhibitionId: string }; error?: string };
        if (!response.ok || !data.collected || !data.artwork) {
          announce(data.error ?? "작품을 수집하지 못했습니다.");
          router.replace(collectExhibitionId ? `/exhibitions/${collectExhibitionId}` : "/exhibitions");
          return;
        }
        announce(data.duplicate ? "이미 수집한 작품입니다." : "작품이 나만의 전시회장에 추가되었습니다.");
        router.replace(`/exhibitions/${data.artwork.exhibitionId}/hall`);
      })
      .catch(() => {
        announce("네트워크 오류로 작품 수집에 실패했습니다.");
        router.replace(collectExhibitionId ? `/exhibitions/${collectExhibitionId}` : "/exhibitions");
      });
  }, [collectExhibitionId, collectIdentifier, router]);

  const screen = activeNav === "운영자" && user.role !== "exhibition_operator" ? (
    <AccessLockedPanel title="운영자 권한이 필요합니다" onBack={() => router.push("/")} />
  ) : activeNav === "홈" ? (
    <HomeScreen
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
  ) : activeNav === "운영자" ? (
    <OperatorScreen onBack={() => router.push("/")} announce={announce} />
  ) : (
    <MyPageScreen user={user} onLogout={onLogout} />
  );

  return (
    <main className="home-shell">
      <header className="home-header">
        <BrandMark />
        <div className="header-actions">
          <button className="notification-button" type="button" aria-label="알림" onClick={() => announce("새 알림이 3개 있어요.")}>
            <span aria-hidden="true">⌁</span><i>3</i>
          </button>
          <button className="avatar-button" type="button" aria-label={`${user.username} 마이 페이지`} onClick={() => router.push("/my")}>
            {user.username.slice(0, 2).toUpperCase()}
          </button>
          {user.role === "exhibition_operator" ? (
            <button type="button" onClick={() => router.push("/operator")} style={{ border: 0, background: "transparent", color: "#8b6c35", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>
              운영자
            </button>
          ) : null}
        </div>
      </header>

      {screen}

      {((activeNav === "전시" || activeNav === "사진첩") ? route.exhibitionId : null) && (
        <CameraCaptureButton
          key={cameraOpenRequest}
          activeExhibitionId={route.exhibitionId}
          initiallyOpen={cameraOpenRequest > 0}
          announce={announce}
        />
      )}

      <nav className="bottom-nav" aria-label="주 메뉴">
        {navItems.map((key) => (
          <button
            className={activeNav === key ? "active" : ""}
            type="button"
            key={key}
            onClick={() => router.push(navPaths[key])}
          >
            <span className={`nav-icon ${navIconClasses[key]}`} aria-hidden="true" /><small>{key}</small>
          </button>
        ))}
      </nav>
      <div className={`toast ${notice ? "visible" : ""}`} role="status">{notice}</div>
    </main>
  );
}

export function MemoryTagApp() {
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
