import { FormEvent, useMemo, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import type { AuthUser } from "../types";

type AuthMode = "login" | "signup";

export function LoginScreen({ onAuthenticated }: { onAuthenticated: (user: AuthUser) => void }) {
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
