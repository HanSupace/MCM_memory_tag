"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type AuthMode = "login" | "signup";

type AuthUser = {
  id: string;
  username: string;
};

const exhibitions = [
  {
    title: "공간과 기억 사이",
    meta: "2025.04.01 – 2025.06.30 · 성수 MCM 하우스",
    status: "진행 중",
    art: "art-one",
    action: "탐색하기",
  },
  {
    title: "빛의 잔향",
    meta: "2025.05.15 – 2025.07.20 · 청담 갤러리",
    status: "예정",
    art: "art-two",
    action: "미리보기",
  },
];

const newContents = [
  {
    label: "방금 공개",
    title: "관람 요약 공개",
    detail: "공간과 기억 사이",
    tone: "amber",
  },
  {
    label: "1일 후 콘텐츠",
    title: "숨은 해설 공개",
    detail: "빛의 잔향",
    tone: "blue",
  },
  {
    label: "3일 후 콘텐츠",
    title: "비하인드 스토리",
    detail: "공간과 기억 사이",
    tone: "rose",
  },
];

const recommendations = [
  {
    name: "MCM 스타크 백팩",
    color: "어쉬 블루",
    reason: "수집 작품 《빛의 잔향》의 색채 연결",
    art: "product-blue",
  },
  {
    name: "MCM 클래식 토트",
    color: "코냑 브라운",
    reason: "수집 작품 소재의 따뜻한 질감에서 이어집니다.",
    art: "product-cognac",
  },
];

function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand-mark${inverse ? " inverse" : ""}`} aria-label="MCM Memory Tag">
      <span className="brand-word">MCM</span>
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-sub">MEMORY TAG</span>
    </div>
  );
}

function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0,
    [username, password],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await response.json() as { user?: AuthUser; error?: string };

      if (!response.ok || !data.user) {
        setError(data.error ?? "요청을 처리하지 못했습니다.");
        return;
      }

      onAuthenticated(data.user);
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="login-panel-inner">
          <BrandMark />
          <div className="login-heading">
            <p className="eyebrow">MCM MEMORY TAG</p>
            <h1>{mode === "login" ? "로그인" : "회원가입"}</h1>
            <p>
              {mode === "login"
                ? "아이디와 비밀번호를 입력해 주세요."
                : "사용할 아이디와 비밀번호를 정해 주세요."}
            </p>
          </div>

          <form className="login-form" onSubmit={submit} noValidate>
            <label>
              <span>아이디</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="아이디를 입력해 주세요"
                autoComplete="username"
                minLength={3}
                maxLength={20}
                aria-describedby={error ? "login-error" : undefined}
              />
            </label>
            <label>
              <span>비밀번호</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력해 주세요"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  minLength={8}
                  maxLength={72}
                  aria-describedby={error ? "login-error" : undefined}
                />
                <button
                  className="password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                >
                  {showPassword ? "숨김" : "보기"}
                </button>
              </div>
            </label>
            <span id="login-error" className="form-error" aria-live="polite">{error}</span>
            <button className="primary-button" type="submit" disabled={!canSubmit || loading}>
              {loading ? (
                <span className="spinner" aria-label="처리 중" />
              ) : mode === "login" ? (
                "로그인"
              ) : (
                "회원가입"
              )}
            </button>
          </form>
          <p className="signup-copy">
            {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}
            <button type="button" onClick={() => changeMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "회원가입" : "로그인"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}

function HomeScreen({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const [activeNav, setActiveNav] = useState("홈");
  const [notice, setNotice] = useState("");

  function announce(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

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

      <div className="home-content">
        <section className="home-intro">
          <div>
            <p className="eyebrow">MY EXHIBITION MEMORY</p>
            <h1>나의 전시 기억</h1>
            <p>기억해 둔 작품과 새롭게 도착한 이야기를 만나보세요.</p>
          </div>
          <div className="memory-date"><span>07</span><small>AUG<br />2026</small></div>
        </section>

        <section className="section-block exhibitions-section">
          <div className="section-heading">
            <div><span className="section-kicker">NOW &amp; NEXT</span><h2>지금 열리는 전시</h2></div>
            <button type="button" onClick={() => announce("전시 전체 보기는 다음 단계에서 연결됩니다.")}>전체 보기</button>
          </div>
          <div className="exhibition-grid">
            {exhibitions.map((exhibition, index) => (
              <article className="exhibition-card" key={exhibition.title}>
                <div className={`exhibition-art ${exhibition.art}`}>
                  <span className="exhibition-number">0{index + 1}</span>
                  <span className={`status-chip ${index === 1 ? "upcoming" : ""}`}>{exhibition.status}</span>
                  <div className="art-plane plane-a" /><div className="art-plane plane-b" />
                </div>
                <div className="exhibition-card-body">
                  <h3>{exhibition.title}</h3>
                  <p>{exhibition.meta}</p>
                  <button type="button" onClick={() => announce(`${exhibition.title} 전시를 선택했습니다.`)}>{exhibition.action}<span>↗</span></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block record-section">
          <div className="section-heading compact">
            <div><span className="section-kicker">ARCHIVE</span><h2>나의 방문 기록</h2></div>
            <button type="button" onClick={() => announce("마이 페이지는 다음 구현 범위입니다.")}>마이 페이지에서 보기</button>
          </div>
          <div className="record-grid">
            <div><strong>02</strong><span>방문 인증</span><small>EXHIBITIONS</small></div>
            <div><strong>07</strong><span>수집 작품</span><small>COLLECTED</small></div>
            <div><strong>03</strong><span>한줄평</span><small>NOTES</small></div>
          </div>
        </section>

        <section className="keyring-card">
          <div className="keyring-visual" aria-hidden="true">
            <span className="keyring-loop" /><span className="keyring-body">M</span><span className="keyring-wave">)))</span>
          </div>
          <div className="keyring-copy">
            <span className="section-kicker light">MCM NFC EXPERIENCE</span>
            <h2>기억을 시작하는<br />나만의 키링</h2>
            <p>NFC 키링을 연결하면 전시 방문 인증과 작품 수집이 시작됩니다.</p>
            <div className="keyring-state"><i />연결된 키링이 없습니다.</div>
            <button type="button" onClick={() => announce("키링 연결 화면은 다음 단계에서 제공됩니다.")}>키링 연결하기<span>→</span></button>
          </div>
        </section>

        <section className="section-block contents-section">
          <div className="section-heading">
            <div><span className="section-kicker">JUST UNLOCKED</span><h2>새로 공개된 콘텐츠</h2></div>
            <button type="button" onClick={() => announce("모든 알림은 다음 구현 범위입니다.")}>모든 알림</button>
          </div>
          <div className="content-list">
            {newContents.map((content) => (
              <button type="button" key={content.title} onClick={() => announce(`${content.title} 콘텐츠를 확인합니다.`)}>
                <span className={`content-symbol ${content.tone}`}><i /></span>
                <span className="content-copy"><small>{content.label}</small><strong>{content.title}</strong><em>{content.detail}</em></span>
                <span className="content-arrow">→</span>
              </button>
            ))}
          </div>
        </section>

        <section className="section-block recommendation-section">
          <div className="section-heading recommendation-heading">
            <div>
              <span className="section-kicker">CURATED FOR YOU</span>
              <h2>나를 위한 추천</h2>
              <p>수집한 작품의 색감과 이야기를 바탕으로 선별했습니다.</p>
            </div>
          </div>
          <div className="recommendation-grid">
            {recommendations.map((product) => (
              <article className="product-card" key={product.name}>
                <div className={`product-art ${product.art}`}>
                  <div className="bag-shape"><span /></div>
                </div>
                <div className="product-info">
                  <small>{product.color}</small><h3>{product.name}</h3><p>{product.reason}</p>
                  <button type="button" onClick={() => announce(`${product.name} 상세 보기는 다음 단계에서 연결됩니다.`)}>자세히 보기<span>↗</span></button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>

      <nav className="bottom-nav" aria-label="주 메뉴">
        {["홈", "전시", "전시회장", "맞춤 추천", "마이"].map((item, index) => (
          <button className={activeNav === item ? "active" : ""} type="button" key={item} onClick={() => { setActiveNav(item); if (item !== "홈") announce(`${item} 화면은 다음 구현 범위입니다.`); }}>
            <span className={`nav-icon nav-${index + 1}`} aria-hidden="true" /><small>{item}</small>
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
    <HomeScreen user={user} onLogout={logout} />
  ) : (
    <LoginScreen onAuthenticated={setUser} />
  );
}
