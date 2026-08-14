"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BrandMark } from "./components/BrandMark";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ExhibitionListScreen } from "./screens/ExhibitionListScreen";
import { PersonalHallScreen } from "./screens/PersonalHallScreen";
import { ProductCurationScreen } from "./screens/ProductCurationScreen";
import { MyPageScreen } from "./screens/MyPageScreen";
import { GalleryScreen } from "./screens/GalleryScreen";
import { CameraCaptureButton } from "./components/CameraCaptureButton";
import type { AuthUser } from "./types";

const navItems = ["홈", "전시", "사진첩", "맞춤 추천", "마이"] as const;
type ScreenKey = (typeof navItems)[number] | "전시회장";
const navIconClasses: Record<(typeof navItems)[number], string> = {
  홈: "nav-1",
  전시: "nav-2",
  사진첩: "nav-4",
  "맞춤 추천": "nav-5",
  마이: "nav-6",
};

function MainShell({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<ScreenKey>("홈");
  const [initialExhibitionId, setInitialExhibitionId] = useState<string | null>(null);
  const [activeExhibitionId, setActiveExhibitionId] = useState<string | null>(null);
  const [personalHallExhibitionId, setPersonalHallExhibitionId] = useState<string | null>(null);
  const [galleryExhibitionId, setGalleryExhibitionId] = useState<string | null>(null);
  const [cameraOpenRequest, setCameraOpenRequest] = useState(0);
  const [notice, setNotice] = useState("");
  const handledVisitLinkRef = useRef(false);

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  // NFC 태그·QR이 여는 "/?visit=<exhibitionId>" 링크를 처리한다.
  // 실물 태그는 이 주소를 열기만 하면 되므로(OS/카메라가 URL을 열어줌),
  // 여기서 파라미터를 감지해 방문 인증 후 해당 전시로 바로 이동시킨다.
  useEffect(() => {
    if (handledVisitLinkRef.current) return;

    const exhibitionId = new URLSearchParams(window.location.search).get("visit");
    if (!exhibitionId || !/^\d+$/.test(exhibitionId)) return;
    handledVisitLinkRef.current = true;

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
        setInitialExhibitionId(exhibitionId);
        setActiveNav("전시");
      })
      .catch(() => {
        announce("네트워크 오류로 방문 인증에 실패했습니다.");
      })
      .finally(() => {
        router.replace("/");
      });
  }, [router]);

  const screen = activeNav === "홈" ? (
    <HomeScreen
      announce={announce}
      onExploreExhibitions={(exhibitionId) => {
        setInitialExhibitionId(exhibitionId ?? null);
        setActiveNav("전시");
      }}
    />
  ) : activeNav === "전시" ? (
    <ExhibitionListScreen
      announce={announce}
      initialExhibitionId={initialExhibitionId}
      onActiveExhibitionChange={(exhibitionId) => {
        setActiveExhibitionId(exhibitionId);
        setCameraOpenRequest(0);
      }}
      onOpenPersonalHall={(exhibitionId) => {
        setInitialExhibitionId(exhibitionId);
        setPersonalHallExhibitionId(exhibitionId);
        setActiveNav("전시회장");
      }}
    />
  ) : activeNav === "전시회장" ? (
    <PersonalHallScreen
      exhibitionId={personalHallExhibitionId}
      onBack={() => setActiveNav("전시")}
      announce={announce}
    />
  ) : activeNav === "사진첩" ? (
    <GalleryScreen
      onOpenCamera={() => setCameraOpenRequest((request) => request + 1)}
      onSelectedExhibitionChange={(exhibitionId) => {
        setGalleryExhibitionId(exhibitionId);
        setCameraOpenRequest(0);
      }}
    />
  ) : activeNav === "맞춤 추천" ? (
    <ProductCurationScreen announce={announce} />
  ) : (
    <MyPageScreen announce={announce} />
  );

  return (
    <main className="home-shell">
      <header className="home-header">
        <BrandMark />
        <div className="header-actions">
          <button className="notification-button" type="button" aria-label="알림" onClick={() => announce("새 알림이 3개 있어요.")}>
            <span aria-hidden="true">⌁</span><i>3</i>
          </button>
          <button className="avatar-button" type="button" aria-label={`${user.username} 로그아웃`} onClick={() => void onLogout()}>
            {user.username.slice(0, 2).toUpperCase()}
          </button>
        </div>
      </header>

      {screen}

      {(activeNav === "전시" ? activeExhibitionId : activeNav === "사진첩" ? galleryExhibitionId : null) && (
        <CameraCaptureButton
          key={cameraOpenRequest}
          activeExhibitionId={activeNav === "전시" ? activeExhibitionId : galleryExhibitionId}
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
            onClick={() => {
              if (key === "전시") setInitialExhibitionId(null);
              if (key !== "전시") setActiveExhibitionId(null);
              if (key !== "사진첩") setGalleryExhibitionId(null);
              setActiveNav(key);
            }}
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
