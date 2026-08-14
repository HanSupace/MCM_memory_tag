import { useCallback, useEffect, useState } from "react";

export type VisitResult = { visitedAt: string; alreadyVisited?: boolean };

type Status = "idle" | "verifying" | "error";

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
  maxHeight: "90vh",
  overflowY: "auto",
  padding: "32px 28px",
  borderRadius: 4,
  background: "var(--paper)",
  color: "var(--ink)",
  display: "grid",
  gap: 18,
};

const boxStyle: React.CSSProperties = {
  border: "1px solid var(--line)",
  borderRadius: 4,
  padding: "20px 16px",
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

export function VisitVerificationPanel({
  exhibitionId,
  exhibitionTitle,
  onClose,
  onVerified,
  announce,
}: {
  exhibitionId: string;
  exhibitionTitle: string;
  onClose: () => void;
  onVerified: (result: VisitResult) => void;
  announce: (message: string) => void;
}) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  // 이 패널은 버튼 클릭 시에만 클라이언트에서 렌더되어(SSR 대상 아님) 초기 렌더에서 바로 판정해도 하이드레이션 불일치가 없다.
  const [nfcSupported] = useState(() => typeof window !== "undefined" && "NDEFReader" in window);

  const verify = useCallback(async () => {
    setStatus("verifying");
    setError(null);
    try {
      const response = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exhibitionId }),
      });
      const data = (await response.json()) as { visitedAt?: string; alreadyVisited?: boolean; error?: string };
      if (!response.ok || !data.visitedAt) {
        setStatus("error");
        setError(data.error ?? "방문 인증에 실패했습니다.");
        return;
      }
      announce(data.alreadyVisited ? "이미 방문 인증된 전시입니다." : "방문 인증이 완료되었습니다.");
      onVerified({ visitedAt: data.visitedAt, alreadyVisited: data.alreadyVisited });
    } catch {
      setStatus("error");
      setError("네트워크 오류로 방문 인증에 실패했습니다.");
    }
  }, [exhibitionId, announce, onVerified]);

  useEffect(() => {
    if (!nfcSupported) return;

    let cancelled = false;
    const reader = getNdefReader();
    if (!reader) return;

    reader
      .scan()
      .then(() => {
        reader.addEventListener("reading", () => {
          if (cancelled) return;
          void verify();
        });
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("error");
          setError("NFC 인식에 실패했습니다. 다시 시도하거나 다른 방법으로 인증해 주세요.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nfcSupported, verify]);

  return (
    <div className="visit-verification-overlay" style={overlayStyle} role="dialog" aria-modal="true">
      <div style={cardStyle}>
        <div>
          <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>방문 인증</h2>
          <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
            전시장 입구의 태그 포인트에 키링을 가까이 대세요.
          </p>
        </div>

        <div style={{ ...boxStyle, display: "grid", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--muted)" }}>현재 전시</span>
          <strong style={{ fontSize: 14 }}>{exhibitionTitle}</strong>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>키링 태그로 인증하기</span>
          <div style={{ ...boxStyle, display: "grid", justifyItems: "center", gap: 8 }}>
            <span style={{ fontSize: 32 }} aria-hidden="true">📱</span>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
              키링을 스마트폰 뒷면에 가까이 대면 자동으로 인증됩니다.
            </p>
            <button type="button" style={primaryButtonStyle} onClick={() => void verify()} disabled={status === "verifying"}>
              {status === "verifying" ? "인증 중..." : "키링 태그 인증"}
            </button>
          </div>
        </div>

        {error && <span style={{ color: "#9c3b32", fontSize: 12 }} role="alert">{error}</span>}

        <div style={{ display: "grid", gap: 10 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>다른 방법으로 인증하기</span>
          <div style={{ ...boxStyle, display: "grid", gap: 10 }}>
            <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
              NFC를 사용할 수 없는 경우 아래 방법 중 하나를 선택하세요.
            </p>
            <button type="button" style={secondaryButtonStyle} onClick={() => void verify()} disabled={status === "verifying"}>
              QR 코드 스캔으로 인증
            </button>
            <button type="button" style={secondaryButtonStyle} onClick={() => void verify()} disabled={status === "verifying"}>
              테스트 버튼으로 인증 (MVP)
            </button>
          </div>
        </div>

        <button type="button" style={secondaryButtonStyle} onClick={() => setShowHelp((value) => !value)}>
          인증 실패 시 도움말 보기
        </button>
        {showHelp && (
          <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
            키링이 인식되지 않으면 키링을 스마트폰 뒷면 중앙에 2~3초간 밀착해 보세요. 계속 실패하면 QR 코드 스캔 또는
            테스트 버튼으로 인증할 수 있습니다.
          </p>
        )}

        <button type="button" style={secondaryButtonStyle} onClick={onClose}>취소</button>
      </div>
    </div>
  );
}
