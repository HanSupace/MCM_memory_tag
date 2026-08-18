import { useCallback, useEffect, useState } from "react";

export type ConnectedKeyring = { keyringCode: string; connectedAt: string };

type Step = "nfc" | "code";
type Status = "idle" | "scanning" | "connecting" | "error";

// Web NFC(NDEFReader)는 Chrome for Android 등 일부 브라우저에만 있어 표준 lib.dom.d.ts에 없다.
type NdefReadingEvent = { serialNumber?: string };
type NdefReaderLike = {
  scan: () => Promise<void>;
  addEventListener: (type: "reading", listener: (event: NdefReadingEvent) => void) => void;
};

function getNdefReader(): NdefReaderLike | null {
  const ctor = (window as unknown as { NDEFReader?: new () => NdefReaderLike }).NDEFReader;
  return ctor ? new ctor() : null;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 100,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(22, 22, 19, 0.6)",
};

const cardStyle: React.CSSProperties = {
  width: "min(100%, 420px)",
  padding: "32px 28px",
  borderRadius: 4,
  background: "var(--paper)",
  color: "var(--ink)",
  display: "grid",
  gap: 18,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  height: 50,
  padding: "0 14px",
  border: "1px solid var(--line)",
  borderRadius: 3,
  background: "#fff",
  color: "var(--ink)",
  fontSize: 14,
  boxSizing: "border-box",
};

const primaryButtonStyle: React.CSSProperties = {
  height: 50,
  border: "1px solid var(--ink)",
  borderRadius: 3,
  background: "var(--ink)",
  color: "#fff",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButtonStyle: React.CSSProperties = {
  height: 46,
  border: "1px solid var(--line)",
  borderRadius: 3,
  background: "none",
  color: "var(--ink)",
  fontSize: 13,
  cursor: "pointer",
};

export function KeyringConnectPanel({
  onClose,
  onConnected,
  announce,
}: {
  onClose: () => void;
  onConnected: (keyring: ConnectedKeyring) => void;
  announce: (message: string) => void;
}) {
  const [step, setStep] = useState<Step>("nfc");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState("");
  // 이 패널은 클릭 시에만 클라이언트에서 렌더되어(SSR 대상 아님) 초기 렌더에서 바로 판정해도 하이드레이션 불일치가 없다.
  const [nfcSupported] = useState(() => typeof window !== "undefined" && "NDEFReader" in window);

  const connect = useCallback(
    async (keyringCode: string) => {
      setStatus("connecting");
      setError(null);
      try {
        const response = await fetch("/api/keyrings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ keyringCode }),
        });
        const data = (await response.json()) as { keyring?: ConnectedKeyring; error?: string };
        if (!response.ok || !data.keyring) {
          setStatus("error");
          setError(data.error ?? "키링 연결에 실패했습니다.");
          return;
        }
        announce("키링이 연결되었습니다.");
        onConnected(data.keyring);
      } catch {
        setStatus("error");
        setError("네트워크 오류로 키링 연결에 실패했습니다.");
      }
    },
    [announce, onConnected],
  );

  useEffect(() => {
    if (step !== "nfc" || !nfcSupported) return;

    let cancelled = false;
    const reader = getNdefReader();
    if (!reader) return;

    reader
      .scan()
      .then(() => {
        reader.addEventListener("reading", (event) => {
          if (cancelled || !event.serialNumber) return;
          void connect(event.serialNumber);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setError("NFC 인식에 실패했습니다. 다시 시도하거나 코드를 입력해 주세요.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [step, nfcSupported, connect]);

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    void connect(code);
  }

  return (
    <div className="keyring-connect-overlay" style={overlayStyle} role="dialog" aria-modal="true">
      <div style={cardStyle}>
        {step === "nfc" ? (
          <>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>키링을 휴대폰에 태그하세요</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                홈 화면에 나타난 NFC 영역에 키링을 접촉해주세요.
              </p>
            </div>
            <div style={{ border: "1px solid var(--line)", borderRadius: 4, padding: "28px 16px", display: "grid", justifyItems: "center", gap: 8 }}>
              <span style={{ fontSize: 32 }} aria-hidden="true">📱</span>
              <strong style={{ fontSize: 13 }}>
                {!nfcSupported
                  ? "이 기기는 NFC를 지원하지 않습니다"
                  : status === "connecting"
                    ? "연결 중..."
                    : "NFC 감지 대기 중"}
              </strong>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>키링을 상단에 접촉하세요</span>
            </div>
            {error && <span style={{ color: "#9c3b32", fontSize: 12 }} role="alert">{error}</span>}
            <div style={{ display: "grid", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>다른 방법</span>
              <button type="button" style={secondaryButtonStyle} onClick={() => { setStatus("idle"); setError(null); setStep("code"); }}>
                QR 코드 스캔 / 코드 직접 입력
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={submitCode} style={{ display: "grid", gap: 16 }}>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>QR·코드로 키링 연결</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                키링 뒷면의 코드를 입력하거나 QR 코드를 확인해 아래에 입력하세요.
              </p>
            </div>
            <label style={{ display: "grid", gap: 8 }}>
              <span style={{ fontSize: 12 }}>키링 코드</span>
              <input
                style={inputStyle}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="예: MCM-XXXX-XXXX"
              />
            </label>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              코드를 찾을 수 없나요? 키링 뒷면 또는 포장 안쪽을 확인하세요.
            </span>
            {error && <span style={{ color: "#9c3b32", fontSize: 12 }} role="alert">{error}</span>}
            <button type="submit" style={primaryButtonStyle} disabled={status === "connecting" || !code.trim()}>
              {status === "connecting" ? "연결 중..." : "연결 확인"}
            </button>
            {nfcSupported && (
              <button type="button" style={secondaryButtonStyle} onClick={() => { setStatus("idle"); setError(null); setStep("nfc"); }}>
                NFC로 다시 시도
              </button>
            )}
          </form>
        )}
        <button type="button" style={secondaryButtonStyle} onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
