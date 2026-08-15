"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { AuthUser } from "../types";

type ConsentPreferences = {
  required: boolean;
  personalization: boolean;
  photo_analysis: boolean;
  marketing: boolean;
};

const defaultConsents: ConsentPreferences = {
  required: true,
  personalization: false,
  photo_analysis: false,
  marketing: false,
};

const consentItems: Array<{
  key: keyof ConsentPreferences;
  label: string;
  description: string;
  required?: boolean;
}> = [
  { key: "required", label: "서비스 필수 동의", description: "계정과 전시 기록을 안전하게 보관합니다.", required: true },
  { key: "personalization", label: "맞춤형 서비스", description: "수집 작품과 감상 기록으로 개인화 경험을 제공합니다." },
  { key: "photo_analysis", label: "사진 분석 활용", description: "직접 올린 전시 사진을 AI 취향 분석에 활용합니다." },
  { key: "marketing", label: "마케팅 알림", description: "새 전시와 MCM 컬렉션 소식을 받아봅니다." },
];

export function MyPageScreen({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  const [consents, setConsents] = useState(defaultConsents);
  const [loadingConsents, setLoadingConsents] = useState(true);
  const [savingConsent, setSavingConsent] = useState<keyof ConsentPreferences | null>(null);
  const [message, setMessage] = useState("");
  const displayName = user.displayName?.trim() || user.username;
  const initials = displayName.slice(0, 2).toUpperCase();

  useEffect(() => {
    let active = true;
    fetch("/api/auth/consents", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ consents: ConsentPreferences }>;
      })
      .then((body) => { if (active) setConsents(body.consents); })
      .catch(() => { if (active) setMessage("동의 설정을 불러오지 못했습니다."); })
      .finally(() => { if (active) setLoadingConsents(false); });
    return () => { active = false; };
  }, []);

  async function updateConsent(key: keyof ConsentPreferences, granted: boolean) {
    if (key === "required") return;
    const next = { ...consents, [key]: granted, required: true };
    setSavingConsent(key);
    setMessage("");
    try {
      const response = await fetch("/api/auth/consents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consents: next }),
      });
      const body = await response.json() as { consents?: ConsentPreferences; error?: string };
      if (!response.ok || !body.consents) throw new Error(body.error ?? "설정을 저장하지 못했습니다.");
      setConsents(body.consents);
      setMessage("설정이 저장되었습니다.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "설정을 저장하지 못했습니다.");
    } finally {
      setSavingConsent(null);
    }
  }

  return (
    <div className="home-content">
      <section className="my-page">
        <header className="my-page-heading">
          <span className="section-kicker">MY MCM</span>
          <h1>마이 페이지</h1>
          <p>나의 프로필과 전시 경험에 사용되는 정보를 관리하세요.</p>
        </header>

        <section className="profile-card" aria-label="프로필">
          <div className="profile-avatar">
            {user.profileImageUrl ? (
              <Image src={user.profileImageUrl} alt={`${displayName} 프로필`} fill unoptimized sizes="88px" />
            ) : <span>{initials}</span>}
          </div>
          <div className="profile-copy">
            <span className="profile-status">✦ MCM MEMORY MEMBER</span>
            <h2>{displayName}</h2>
            <p>@{user.username}</p>
          </div>
          <span className="profile-login-badge">로그인 중</span>
        </section>

        <section className="my-settings-card">
          <div className="my-settings-heading">
            <div><span className="section-kicker">PROFILE</span><h2>개인정보</h2></div>
            <span>안전하게 보호됨</span>
          </div>
          <dl className="profile-info-list">
            <div><dt>닉네임</dt><dd>{displayName}</dd></div>
            <div><dt>아이디</dt><dd>{user.username}</dd></div>
            <div><dt>로그인 방식</dt><dd>{user.profileImageUrl || user.displayName ? "카카오 계정" : "아이디 로그인"}</dd></div>
            <div><dt>회원 번호</dt><dd>MCM-{user.id.slice(-6).toUpperCase()}</dd></div>
          </dl>
        </section>

        <section className="my-settings-card">
          <div className="my-settings-heading">
            <div><span className="section-kicker">PRIVACY</span><h2>개인정보 및 활용 설정</h2></div>
          </div>
          <div className="consent-list" aria-busy={loadingConsents}>
            {consentItems.map((item) => (
              <label key={item.key} className="consent-row">
                <span><strong>{item.label}{item.required && <em> 필수</em>}</strong><small>{item.description}</small></span>
                <input
                  type="checkbox"
                  aria-label={item.label}
                  checked={consents[item.key]}
                  disabled={loadingConsents || item.required || savingConsent !== null}
                  onChange={(event) => void updateConsent(item.key, event.target.checked)}
                />
                <i aria-hidden="true" />
              </label>
            ))}
          </div>
          {message && <p className="my-setting-message" role="status">{message}</p>}
        </section>

        <section className="account-actions">
          <div><h2>계정 관리</h2><p>현재 기기에서 안전하게 로그아웃합니다.</p></div>
          <button type="button" onClick={() => void onLogout()}>로그아웃</button>
        </section>
      </section>
    </div>
  );
}
