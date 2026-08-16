"use client";

import { useEffect, useState } from "react";

type OperatorExhibition = { id: string; title: string; status: string };
type EntryToken = { id: string; type: "keyring" | "venue_qr"; active: boolean; createdAt: string };
type IssuedToken = { id: string; type: "keyring" | "venue_qr"; value: string; url: string; createdAt: string };

function statusLabel(status: string) {
  if (status === "ongoing") return "진행 중";
  if (status === "ended") return "종료";
  return "예정";
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const input = document.createElement("textarea");
  input.value = value;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.appendChild(input);
  input.select();
  document.execCommand("copy");
  input.remove();
}

export function OperatorScreen({ onBack, announce }: { onBack: () => void; announce: (message: string) => void }) {
  const [exhibitions, setExhibitions] = useState<OperatorExhibition[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [tokens, setTokens] = useState<EntryToken[]>([]);
  const [issuedToken, setIssuedToken] = useState<IssuedToken | null>(null);
  const [loading, setLoading] = useState(true);
  const [tokensLoading, setTokensLoading] = useState(false);
  const [busyType, setBusyType] = useState<"keyring" | "venue_qr" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/operator/exhibitions", { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { exhibitions?: OperatorExhibition[]; error?: string };
        if (response.status === 403) throw new Error("운영자 권한이 필요합니다.");
        if (!response.ok || !body.exhibitions) throw new Error(body.error ?? "운영자 전시 목록을 불러오지 못했습니다.");
        return body.exhibitions;
      })
      .then((items) => {
        if (!active) return;
        setExhibitions(items);
        setSelectedId(items[0]?.id ?? "");
      })
      .catch((cause) => {
        if (active) setError(cause instanceof Error ? cause.message : "운영자 전시 목록을 불러오지 못했습니다.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let active = true;
    fetch(`/api/exhibitions/${selectedId}/entry-tokens`, { cache: "no-store" })
      .then(async (response) => {
        const body = await response.json() as { tokens?: EntryToken[]; error?: string };
        if (!response.ok || !body.tokens) throw new Error(body.error ?? "입장 자산을 불러오지 못했습니다.");
        return body.tokens;
      })
      .then((items) => { if (active) setTokens(items); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "입장 자산을 불러오지 못했습니다."); })
      .finally(() => { if (active) setTokensLoading(false); });
    return () => { active = false; };
  }, [selectedId]);

  async function issueToken(type: "keyring" | "venue_qr") {
    if (!selectedId) return;
    setBusyType(type);
    setError("");
    try {
      const response = await fetch(`/api/exhibitions/${selectedId}/entry-tokens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const body = await response.json() as { token?: IssuedToken; error?: string };
      if (!response.ok || !body.token) throw new Error(body.error ?? "입장 자산을 생성하지 못했습니다.");
      setIssuedToken(body.token);
      setTokens((current) => [{ id: body.token!.id, type: body.token!.type, active: true, createdAt: body.token!.createdAt }, ...current]);
      announce(type === "keyring" ? "키링 코드가 생성되었습니다." : "전시장 QR 주소가 생성되었습니다.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "입장 자산을 생성하지 못했습니다.");
    } finally {
      setBusyType(null);
    }
  }

  async function deactivateToken(token: EntryToken) {
    if (!selectedId || !token.active) return;
    const confirmed = window.confirm("이 입장 자산을 비활성화할까요? 이미 배포한 키링·QR은 더 이상 사용할 수 없습니다.");
    if (!confirmed) return;
    const response = await fetch(`/api/exhibitions/${selectedId}/entry-tokens`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tokenId: token.id }),
    });
    const body = await response.json() as { error?: string };
    if (!response.ok) {
      setError(body.error ?? "입장 자산을 비활성화하지 못했습니다.");
      return;
    }
    setTokens((current) => current.map((item) => item.id === token.id ? { ...item, active: false } : item));
    announce("입장 자산을 비활성화했습니다.");
  }

  async function writeNfc(url: string) {
    const NDEFReaderClass = (window as Window & { NDEFReader?: new () => { write: (message: { records: Array<{ recordType: string; data: string }> }) => Promise<void> } }).NDEFReader;
    if (!NDEFReaderClass) {
      await copyText(url);
      announce("이 브라우저는 NFC 쓰기를 지원하지 않아 URL을 복사했습니다.");
      return;
    }
    try {
      const reader = new NDEFReaderClass();
      await reader.write({ records: [{ recordType: "url", data: url }] });
      announce("NFC 태그에 전시 입장 URL을 기록했습니다.");
    } catch {
      setError("NFC 기록에 실패했습니다. 태그를 휴대폰 가까이에 두고 다시 시도해 주세요.");
    }
  }

  return (
    <div className="home-content">
      <section style={{ maxWidth: 900, margin: "0 auto", padding: "36px 20px 120px" }}>
        <button type="button" onClick={onBack} style={{ border: 0, background: "transparent", padding: 0, color: "#8b6c35", cursor: "pointer" }}>← 홈으로</button>
        <header style={{ margin: "28px 0 30px" }}>
          <span className="section-kicker">EXHIBITION OPERATOR</span>
          <h1 style={{ margin: "10px 0" }}>전시 입장 자산</h1>
          <p style={{ color: "#77736b", lineHeight: 1.6, margin: 0 }}>전시별 키링 코드와 전시장 입장 URL을 발급합니다. 이 페이지에서는 전시 콘텐츠와 방문 기록을 조회하지 않습니다.</p>
        </header>

        {loading ? <p>전시 목록을 불러오는 중입니다.</p> : exhibitions.length === 0 ? <p>운영 가능한 공개 전시가 없습니다.</p> : (
          <>
            <label style={{ display: "grid", gap: 8, marginBottom: 20 }}>
              <span style={{ fontWeight: 700 }}>전시 선택</span>
              <select value={selectedId} onChange={(event) => { setIssuedToken(null); setSelectedId(event.target.value); }} style={{ minHeight: 48, padding: "0 12px", border: "1px solid #d8d3c8", background: "#fff" }}>
                {exhibitions.map((exhibition) => <option key={exhibition.id} value={exhibition.id}>{exhibition.title} · {statusLabel(exhibition.status)}</option>)}
              </select>
            </label>

            <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", marginBottom: 24 }}>
              <button type="button" onClick={() => void issueToken("keyring")} disabled={busyType !== null} style={{ minHeight: 120, padding: 18, textAlign: "left", border: "1px solid #cdb68d", background: "#fbf5e8", cursor: "pointer" }}>
                <strong style={{ display: "block", marginBottom: 8 }}>키링 코드 생성</strong>
                <span style={{ color: "#77736b", lineHeight: 1.5 }}>{busyType === "keyring" ? "생성 중..." : "키링 뒷면에 인쇄하거나 NFC에 기록할 입장 코드를 만듭니다."}</span>
              </button>
              <button type="button" onClick={() => void issueToken("venue_qr")} disabled={busyType !== null} style={{ minHeight: 120, padding: 18, textAlign: "left", border: "1px solid #cdb68d", background: "#fff", cursor: "pointer" }}>
                <strong style={{ display: "block", marginBottom: 8 }}>전시장 QR 주소 생성</strong>
                <span style={{ color: "#77736b", lineHeight: 1.5 }}>{busyType === "venue_qr" ? "생성 중..." : "누구나 사용할 수 있는 전시장 입장 URL을 만듭니다."}</span>
              </button>
            </section>

            {issuedToken ? (
              <section style={{ padding: 20, marginBottom: 26, border: "1px solid #ad813b", background: "#fbf5e8" }} aria-live="polite">
                <strong>{issuedToken.type === "keyring" ? "새 키링 입장 코드" : "새 전시장 QR 입장 URL"}</strong>
                <p style={{ margin: "12px 0 8px", wordBreak: "break-all", fontFamily: "monospace", fontSize: 16 }}>{issuedToken.type === "keyring" ? issuedToken.value : issuedToken.url}</p>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button type="button" onClick={() => void copyText(issuedToken.type === "keyring" ? issuedToken.value : issuedToken.url).then(() => announce("클립보드에 복사했습니다."))} style={{ padding: "10px 14px", border: 0, background: "#171716", color: "#fff", cursor: "pointer" }}>복사</button>
                  {issuedToken.type === "keyring" ? <button type="button" onClick={() => void writeNfc(issuedToken.url)} style={{ padding: "10px 14px", border: "1px solid #171716", background: "transparent", cursor: "pointer" }}>NFC에 URL 기록</button> : null}
                </div>
                <small style={{ display: "block", marginTop: 12, color: "#9c3b32" }}>보안을 위해 원본 값은 지금만 표시됩니다. QR 이미지는 이 URL을 사용해 생성해 주세요.</small>
              </section>
            ) : null}

            <section style={{ padding: 20, border: "1px solid #dedbd4", background: "#fff" }}>
              <h2 style={{ marginTop: 0 }}>발급 이력</h2>
              {tokensLoading ? <p>불러오는 중입니다.</p> : tokens.length === 0 ? <p>아직 발급한 입장 자산이 없습니다.</p> : (
                <div style={{ display: "grid", gap: 10 }}>
                  {tokens.map((token) => (
                    <div key={token.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: 12, borderTop: "1px solid #eeeae2" }}>
                      <span><strong>{token.type === "keyring" ? "키링" : "전시장 QR"}</strong><small style={{ display: "block", marginTop: 4, color: "#77736b" }}>{new Date(token.createdAt).toLocaleString("ko-KR")} · {token.active ? "활성" : "비활성"}</small></span>
                      {token.active ? <button type="button" onClick={() => void deactivateToken(token)} style={{ padding: "8px 10px", border: "1px solid #d3b8af", background: "#fff8f5", color: "#9c3b32", cursor: "pointer" }}>비활성화</button> : null}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
        {error ? <p className="form-error" role="alert" style={{ marginTop: 18 }}>{error}</p> : null}
      </section>
    </div>
  );
}
