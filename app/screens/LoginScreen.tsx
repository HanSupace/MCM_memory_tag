import { FormEvent, useEffect, useMemo, useState } from "react";
import type { AuthUser } from "../types";

type AuthMode = "login" | "signup";

function PasswordEye({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.3 12s3.5-6 9.7-6 9.7 6 9.7 6-3.5 6-9.7 6S2.3 12 2.3 12Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 6.1A10 10 0 0 1 12 6c6.2 0 9.7 6 9.7 6a16 16 0 0 1-3.1 3.7M6.2 6.2C3.7 8 2.3 12 2.3 12s3.5 6 9.7 6c1.4 0 2.7-.3 3.8-.7M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}

export function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [requiredConsent, setRequiredConsent] = useState(false);
  const [personalizationConsent, setPersonalizationConsent] = useState(false);
  const [photoAnalysisConsent, setPhotoAnalysisConsent] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const authError = url.searchParams.get("authError");
    if (!authError) return;

    const timer = window.setTimeout(() => setError(authError), 0);
    url.searchParams.delete("authError");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    return () => window.clearTimeout(timer);
  }, []);

  const canSubmit = useMemo(
    () => username.trim().length > 0 && password.length > 0 && (mode === "login" || requiredConsent),
    [mode, password, requiredConsent, username],
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          ...(mode === "signup" ? {
            consents: {
              required: requiredConsent,
              personalization: personalizationConsent,
              photo_analysis: photoAnalysisConsent,
              marketing: marketingConsent,
            },
          } : {}),
        }),
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
    setRequiredConsent(false);
    setPersonalizationConsent(false);
    setPhotoAnalysisConsent(false);
    setMarketingConsent(false);
  }

  async function startKakaoLogin() {
    setError("");
    if (mode === "signup" && !requiredConsent) {
      setError("필수 서비스 동의에 동의해 주세요.");
      return;
    }

    setSocialLoading(true);
    try {
      const response = await fetch("/api/auth/oauth/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "kakao",
          mode,
          ...(mode === "signup" ? {
            consents: {
              required: requiredConsent,
              personalization: personalizationConsent,
              photo_analysis: photoAnalysisConsent,
              marketing: marketingConsent,
            },
          } : {}),
        }),
      });
      const data = await response.json() as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error ?? "소셜 로그인을 시작하지 못했습니다.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSocialLoading(false);
    }
  }

  return (
    <main className={`login-shell login-mode-${mode}`}>
      <header className="login-page-title">
        <h1>{mode === "login" ? "Login" : "Sign Up"}</h1>
      </header>
      <section className="login-panel">
        <div className="login-panel-inner">
          <div className="login-brand-lockup">
            <img src="/mcm-entry-logo.png" alt="MCM" />
            <h2>MOMENTE</h2>
          </div>

          <form className="login-form" onSubmit={submit} noValidate>
            <label>
              <span>Name</span>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="User name"
                autoComplete="username"
                minLength={3}
                maxLength={20}
                aria-describedby={error ? "login-error" : undefined}
              />
            </label>
            <label>
              <span>Password</span>
              <div className="password-field">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="*******"
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
                  <PasswordEye open={showPassword} />
                </button>
              </div>
            </label>
            {mode === "signup" ? (
              <fieldset style={{ border: 0, margin: 0, padding: 0 }}>
                <legend style={{ marginBottom: 10, fontSize: 12, fontWeight: 700 }}>서비스 동의</legend>
                {[
                  {
                    key: "required",
                    label: "[필수] 서비스 이용 및 개인정보 처리에 동의합니다.",
                    checked: requiredConsent,
                    setChecked: setRequiredConsent,
                  },
                  {
                    key: "personalization",
                    label: "[선택] 개인화 서비스에 동의합니다.",
                    checked: personalizationConsent,
                    setChecked: setPersonalizationConsent,
                  },
                  {
                    key: "photo-analysis",
                    label: "[선택] 사진 분석 활용에 동의합니다.",
                    checked: photoAnalysisConsent,
                    setChecked: setPhotoAnalysisConsent,
                  },
                  {
                    key: "marketing",
                    label: "[선택] 마케팅 알림 수신에 동의합니다.",
                    checked: marketingConsent,
                    setChecked: setMarketingConsent,
                  },
                ].map((consent) => (
                  <label
                    key={consent.key}
                    style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 10, cursor: "pointer" }}
                  >
                    <input
                      type="checkbox"
                      checked={consent.checked}
                      onChange={(event) => consent.setChecked(event.target.checked)}
                      style={{ width: 18, height: 18, flex: "0 0 auto", padding: 0 }}
                    />
                    <span style={{ margin: 0, lineHeight: 1.5, fontWeight: 400 }}>{consent.label}</span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            <span id="login-error" className="form-error" aria-live="polite">{error}</span>
            <button className="primary-button login-submit-button" type="submit" disabled={!canSubmit || loading}>
              {loading ? (
                <span className="spinner" aria-label="처리 중" />
              ) : mode === "login" ? (
                "Log In"
              ) : (
                "Sign Up"
              )}
            </button>
          </form>
          <div className="login-divider">
            <span />
            Or
            <span />
          </div>
          <div className="social-login-area">
            <button
              type="button"
              className="kakao-login-button"
              onClick={() => void startKakaoLogin()}
              disabled={socialLoading}
            >
              <span className="kakao-bubble" aria-hidden="true" />
              {socialLoading ? "카카오 연결 중..." : `카카오 ${mode === "login" ? "로그인" : "회원가입"}`}
            </button>
          </div>
          <p className="signup-copy">
            {mode === "login" ? "Don’t have an account?" : "Already have an account?"}
            <button type="button" onClick={() => changeMode(mode === "login" ? "signup" : "login")}>
              {mode === "login" ? "Sign Up" : "Log In"}
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
