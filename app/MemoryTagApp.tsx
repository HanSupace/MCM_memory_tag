"use client";

import { useEffect, useState } from "react";
import { BrandMark } from "./components/BrandMark";
import { LoginScreen } from "./screens/LoginScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { ExhibitionListScreen } from "./screens/ExhibitionListScreen";
import { PersonalHallScreen } from "./screens/PersonalHallScreen";
import { ProductCurationScreen } from "./screens/ProductCurationScreen";
import { MyPageScreen } from "./screens/MyPageScreen";
import type { AuthUser } from "./types";

const navItems = ["홈", "전시", "전시회장", "맞춤 추천", "마이"] as const;

function MainShell({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const [activeNav, setActiveNav] = useState<(typeof navItems)[number]>("홈");
  const [initialExhibitionId, setInitialExhibitionId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  const screen = activeNav === "홈" ? (
    <HomeScreen
      announce={announce}
      onExploreExhibitions={(exhibitionId) => {
        setInitialExhibitionId(exhibitionId ?? null);
        setActiveNav("전시");
      }}
    />
  ) : activeNav === "전시" ? (
    <ExhibitionListScreen announce={announce} initialExhibitionId={initialExhibitionId} />
  ) : activeNav === "전시회장" ? (
    <PersonalHallScreen announce={announce} />
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

      <nav className="bottom-nav" aria-label="주 메뉴">
        {navItems.map((key, index) => (
          <button
            className={activeNav === key ? "active" : ""}
            type="button"
            key={key}
            onClick={() => {
              if (key === "전시") setInitialExhibitionId(null);
              setActiveNav(key);
            }}
          >
            <span className={`nav-icon nav-${index + 1}`} aria-hidden="true" /><small>{key}</small>
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
