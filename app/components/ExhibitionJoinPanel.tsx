import { useCallback, useEffect, useRef, useState } from "react";
import { ArtworkQrScanner } from "./ArtworkQrScanner";

export type JoinableExhibition = {
  id: string;
  title: string;
  venue: string;
  heroImageUrl: string | null;
  startAt: string;
  endAt: string;
  status: "upcoming" | "ongoing" | "ended";
  joined: boolean;
};

type EntryMode = "nfc" | "code";

function formatDate(value: string) {
  const date = new Date(value);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 110,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(18, 13, 9, .72)",
};

const panelStyle: React.CSSProperties = {
  width: "min(100%, 440px)",
  maxHeight: "calc(100svh - 40px)",
  overflowY: "auto",
  padding: "26px 24px",
  display: "grid",
  gap: 18,
  borderRadius: 14,
  background: "#f2eadf",
  color: "#17110c",
  boxShadow: "0 28px 80px rgba(0, 0, 0, .38)",
};

const buttonStyle: React.CSSProperties = {
  minHeight: 48,
  padding: "0 16px",
  border: "1px solid #24160d",
  borderRadius: 8,
  background: "#24160d",
  color: "#fff",
  fontWeight: 750,
  cursor: "pointer",
};

export function ExhibitionJoinPanel({
  initialCode = "",
  onClose,
  onJoined,
}: {
  initialCode?: string;
  onClose: () => void;
  onJoined: (exhibition: JoinableExhibition, alreadyJoined: boolean) => void;
}) {
  const [code, setCode] = useState(initialCode);
  const [resolvedCode, setResolvedCode] = useState("");
  const [exhibition, setExhibition] = useState<JoinableExhibition | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const [mode, setMode] = useState<EntryMode>(initialCode ? "code" : "nfc");
  const initialLookupRef = useRef(false);

  const lookup = useCallback(async (value: string) => {
    const nextCode = value.trim();
    if (!nextCode) return;
    setLoading(true);
    setError("");
    setExhibition(null);
    try {
      const response = await fetch(`/api/exhibition-entry?code=${encodeURIComponent(nextCode)}`, { cache: "no-store" });
      const data = await response.json() as { exhibition?: JoinableExhibition; error?: string };
      if (!response.ok || !data.exhibition) throw new Error(data.error ?? "전시를 찾을 수 없습니다.");
      setCode(nextCode);
      setResolvedCode(nextCode);
      setExhibition(data.exhibition);
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : "전시 코드를 확인하지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialCode || initialLookupRef.current) return;
    initialLookupRef.current = true;
    void lookup(initialCode);
  }, [initialCode, lookup]);

  async function joinExhibition() {
    if (!resolvedCode || !exhibition) return;
    if (exhibition.joined) {
      onJoined(exhibition, true);
      return;
    }
    setJoining(true);
    setError("");
    try {
      const response = await fetch("/api/exhibition-entry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: resolvedCode }),
      });
      const data = await response.json() as { exhibition?: JoinableExhibition; alreadyJoined?: boolean; error?: string };
      if (!response.ok || !data.exhibition) throw new Error(data.error ?? "전시를 추가하지 못했습니다.");
      onJoined(data.exhibition, Boolean(data.alreadyJoined));
    } catch (joinError) {
      setError(joinError instanceof Error ? joinError.message : "전시를 추가하지 못했습니다.");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div style={overlayStyle} role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section style={panelStyle} role="dialog" aria-modal="true" aria-labelledby="exhibition-join-title">
        <header style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <span className="section-kicker">EXHIBITION ENTRY</span>
            <h2 id="exhibition-join-title" style={{ margin: "7px 0 0", fontSize: 25 }}>전시 참가하기</h2>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose} style={{ border: 0, background: "none", fontSize: 26, cursor: "pointer" }}>×</button>
        </header>

        {!exhibition && (
          <>
            <p style={{ margin: 0, color: "#70665e", fontSize: 13, lineHeight: 1.65 }}>
              {mode === "nfc"
                ? "휴대폰을 전시장 NFC 태그에 가까이 대거나 다른 연결 방법을 선택해 주세요."
                : "전시장에서 안내받은 코드를 입력해 주세요."}
            </p>

            {mode === "nfc" ? (
              <div style={{ minHeight: 220, padding: "25px 18px", display: "grid", placeItems: "center", alignContent: "center", gap: 14, border: "1px solid #c5b7a6", borderRadius: 12, background: "rgba(255,255,255,.34)", textAlign: "center" }}>
                <div style={{ position: "relative", width: 76, height: 116, display: "grid", placeItems: "center", border: "3px solid #2b1c13", borderRadius: 16, background: "#f7f0e6" }} aria-hidden="true">
                  <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".08em" }}>NFC</span>
                  <i style={{ position: "absolute", top: 7, width: 22, height: 3, borderRadius: 99, background: "#2b1c13" }} />
                  <i style={{ position: "absolute", right: -28, width: 28, height: 44, border: "2px solid #a98250", borderLeft: 0, borderRadius: "0 50% 50% 0" }} />
                </div>
                <div>
                  <strong style={{ display: "block", fontSize: 15 }}>NFC 태그에 휴대폰을 가까이 대세요</strong>
                  <span style={{ display: "block", marginTop: 7, color: "#786d64", fontSize: 12 }}>인식되면 해당 전시 참가 화면으로 연결됩니다.</span>
                </div>
              </div>
            ) : (
              <form onSubmit={(event) => { event.preventDefault(); void lookup(code); }} style={{ display: "grid", gap: 9 }}>
                <label htmlFor="exhibition-entry-code" style={{ fontSize: 12, fontWeight: 700 }}>전시 코드</label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  <input
                    id="exhibition-entry-code"
                    value={code}
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="code1, code2, code3"
                    autoCapitalize="none"
                    style={{ minWidth: 0, height: 48, padding: "0 13px", border: "1px solid #b7aa9a", borderRadius: 8, fontSize: 14 }}
                  />
                  <button type="submit" disabled={loading || !code.trim()} style={{ ...buttonStyle, minWidth: 74 }}>{loading ? "확인 중" : "확인"}</button>
                </div>
              </form>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
              <button type="button" onClick={() => setShowQrScanner(true)} style={{ ...buttonStyle, background: "transparent", color: "#24160d" }}>QR 스캔</button>
              <button type="button" onClick={() => { setMode(mode === "nfc" ? "code" : "nfc"); setError(""); }} style={{ ...buttonStyle, background: "transparent", color: "#24160d" }}>
                {mode === "nfc" ? "코드 입력" : "NFC 안내"}
              </button>
            </div>
          </>
        )}

        {exhibition && (
          <div style={{ display: "grid", gap: 16 }}>
            <div style={{ minHeight: 180, padding: 18, display: "flex", alignItems: "end", borderRadius: 10, background: exhibition.heroImageUrl ? `linear-gradient(rgba(0,0,0,.2), rgba(0,0,0,.72)), url(${exhibition.heroImageUrl}) center/cover` : "#3c2c21", color: "#fff" }}>
              <div>
                <small>{formatDate(exhibition.startAt)} – {formatDate(exhibition.endAt)}</small>
                <h3 style={{ margin: "7px 0 5px", fontSize: 24 }}>{exhibition.title}</h3>
                <span style={{ fontSize: 12 }}>{exhibition.venue}</span>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6 }}>
              {exhibition.joined ? "이미 추가한 전시입니다. 바로 전시를 둘러볼 수 있습니다." : "이 전시를 추가하면 작품 목록, 카메라, 나만의 전시회장과 도슨트 기능을 사용할 수 있습니다."}
            </p>
            {error && <p role="alert" style={{ margin: 0, color: "#a03d32", fontSize: 12 }}>{error}</p>}
            <button type="button" onClick={() => void joinExhibition()} disabled={joining} style={buttonStyle}>
              {joining ? "추가 중…" : exhibition.joined ? "전시 바로가기" : "이 전시 추가하기"}
            </button>
            <button type="button" onClick={() => { setExhibition(null); setResolvedCode(""); setMode("code"); setError(""); }} style={{ ...buttonStyle, background: "transparent", color: "#24160d" }}>다른 코드 입력</button>
          </div>
        )}

        {!exhibition && error && <p role="alert" style={{ margin: 0, color: "#a03d32", fontSize: 12 }}>{error}</p>}
      </section>

      {showQrScanner && (
        <ArtworkQrScanner
          kicker="EXHIBITION QR"
          title="전시 QR 스캔"
          cameraMessage="전시장 QR이 사각형 안에 들어오도록 비춰 주세요."
          manualLabel="전시 코드 입력"
          manualPlaceholder="code1, code2, code3"
          onClose={() => setShowQrScanner(false)}
          onDetected={(value) => {
            setShowQrScanner(false);
            void lookup(value);
            return null;
          }}
        />
      )}
    </div>
  );
}
