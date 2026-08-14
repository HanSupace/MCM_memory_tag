import { useCallback, useEffect, useRef, useState } from "react";

export type CollectedArtwork = {
  artworkId: string;
  exhibitionArtworkId: string;
  exhibitionId: string;
  exhibitionTitle: string;
  title: string;
  artistName: string | null;
  productionYear: string | null;
  material: string | null;
  imageUrl: string | null;
  description: string | null;
  appreciationPoints: string | null;
};

type Status = "idle" | "collecting";
type ResultState =
  | { kind: "success"; artwork: CollectedArtwork }
  | { kind: "duplicate"; artwork: CollectedArtwork }
  | { kind: "fail"; message: string };

// Web NFC(NDEFReader)는 Chrome for Android 등 일부 브라우저에만 있어 표준 lib.dom.d.ts에 없다.
type NdefRecord = { recordType: string; data?: DataView };
type NdefReadingEvent = { serialNumber?: string; message?: { records: NdefRecord[] } };
type NdefReaderLike = {
  scan: () => Promise<void>;
  addEventListener: (type: "reading", listener: (event: NdefReadingEvent) => void) => void;
};

function getNdefReader(): NdefReaderLike | null {
  const ctor = (window as unknown as { NDEFReader?: new () => NdefReaderLike }).NDEFReader;
  return ctor ? new ctor() : null;
}

function decodeNdefRecord(record: NdefRecord): string | null {
  if (!record.data) return null;
  try {
    if (record.recordType === "text") {
      const bytes = new Uint8Array(record.data.buffer, record.data.byteOffset, record.data.byteLength);
      const languageCodeLength = bytes[0] & 0x3f;
      return new TextDecoder().decode(bytes.slice(1 + languageCodeLength));
    }
    if (record.recordType === "url") {
      return new TextDecoder().decode(record.data);
    }
  } catch {
    return null;
  }
  return null;
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
  padding: "18px 16px",
};

const chipStyle: React.CSSProperties = {
  height: 36,
  padding: "0 14px",
  border: "1px solid var(--line)",
  borderRadius: 18,
  background: "none",
  color: "var(--ink)",
  fontSize: 12,
  cursor: "pointer",
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

export function CollectArtworkPanel({
  onClose,
  onCollected,
  announce,
}: {
  onClose: () => void;
  onCollected: (artwork: CollectedArtwork) => void;
  announce: (message: string) => void;
}) {
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<ResultState | null>(null);
  const codeInputRef = useRef<HTMLInputElement | null>(null);
  // 이 패널은 버튼 클릭 시에만 클라이언트에서 렌더되어(SSR 대상 아님) 초기 렌더에서 바로 판정해도 하이드레이션 불일치가 없다.
  const [nfcSupported] = useState(() => typeof window !== "undefined" && "NDEFReader" in window);

  const collect = useCallback(
    async (identifier: string) => {
      if (!identifier.trim()) return;
      setStatus("collecting");
      try {
        const response = await fetch("/api/artworks/collect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        });
        const data = (await response.json()) as {
          collected?: boolean;
          duplicate?: boolean;
          artwork?: CollectedArtwork;
          error?: string;
        };

        if (!response.ok || !data.collected || !data.artwork) {
          setResult({ kind: "fail", message: data.error ?? "인식 실패. QR 또는 NFC를 다시 시도하거나 코드를 직접 입력해 주세요." });
          return;
        }

        if (data.duplicate) {
          setResult({ kind: "duplicate", artwork: data.artwork });
          announce("이미 수집한 작품입니다.");
        } else {
          setResult({ kind: "success", artwork: data.artwork });
          announce("작품이 내 전시회장에 추가되었습니다.");
          onCollected(data.artwork);
        }
      } catch {
        setResult({ kind: "fail", message: "네트워크 오류로 수집에 실패했습니다." });
      } finally {
        setStatus("idle");
      }
    },
    [announce, onCollected],
  );

  useEffect(() => {
    if (!nfcSupported) return;

    let cancelled = false;
    const reader = getNdefReader();
    if (!reader) return;

    reader
      .scan()
      .then(() => {
        reader.addEventListener("reading", (event) => {
          if (cancelled) return;
          const decoded = event.message?.records.map(decodeNdefRecord).find((value) => value) ?? event.serialNumber;
          if (decoded) void collect(decoded);
        });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ kind: "fail", message: "NFC 인식에 실패했습니다. QR 또는 코드를 직접 입력해 주세요." });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [nfcSupported, collect]);

  function submitCode(event: React.FormEvent) {
    event.preventDefault();
    void collect(code);
  }

  function reset() {
    setResult(null);
    setCode("");
  }

  return (
    <div className="collect-artwork-overlay" style={overlayStyle} role="dialog" aria-modal="true">
      <div style={cardStyle}>
        {result ? (
          <>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>
                {result.kind === "success" ? "수집 완료" : result.kind === "duplicate" ? "이미 수집한 작품" : "인식 실패"}
              </h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                {result.kind === "success"
                  ? "작품이 내 전시회장에 추가되었습니다."
                  : result.kind === "duplicate"
                    ? "이 작품은 이미 내 전시회장에 있습니다."
                    : result.message}
              </p>
            </div>

            {result.kind !== "fail" && (
              <article style={{ ...boxStyle, display: "grid", gap: 8 }}>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{result.artwork.exhibitionTitle}</span>
                <strong style={{ fontSize: 16 }}>{result.artwork.title}</strong>
                <span style={{ fontSize: 12, color: "var(--muted)" }}>{result.artwork.artistName ?? "작가 미상"}</span>
                {result.artwork.description && (
                  <p style={{ margin: 0, fontSize: 13 }}>{result.artwork.description}</p>
                )}
                {result.artwork.appreciationPoints && (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--muted)" }}>
                    감상 포인트: {result.artwork.appreciationPoints}
                  </p>
                )}
              </article>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              {result.kind === "fail" && (
                <button type="button" style={secondaryButtonStyle} onClick={reset}>다시 시도</button>
              )}
              <button type="button" style={primaryButtonStyle} onClick={onClose}>닫기</button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h2 style={{ margin: "0 0 8px", fontSize: 20 }}>작품 수집</h2>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: 13 }}>
                QR 코드 또는 NFC에 기기를 가까이 대세요
              </p>
            </div>

            <div style={{ ...boxStyle, display: "grid", justifyItems: "center", gap: 8 }}>
              <span style={{ fontSize: 32 }} aria-hidden="true">▦</span>
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {nfcSupported ? "NFC 감지 대기 중" : "이 기기는 NFC를 지원하지 않습니다"}
              </span>
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <span style={chipStyle}>QR 스캔</span>
              <span style={chipStyle}>NFC 태그</span>
              <button type="button" style={chipStyle} onClick={() => codeInputRef.current?.focus()}>코드 입력</button>
            </div>

            <form onSubmit={submitCode} style={{ ...boxStyle, display: "grid", gap: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>코드로 직접 입력</span>
              <input
                ref={codeInputRef}
                style={inputStyle}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="작품 코드 입력"
              />
              <button type="submit" style={primaryButtonStyle} disabled={status === "collecting" || !code.trim()}>
                {status === "collecting" ? "수집 중..." : "수집하기"}
              </button>
            </form>

            <div style={{ ...boxStyle, display: "grid", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>수집 안내</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>이미 수집한 작품은 중복 저장되지 않습니다.</span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                NFC 인식이 되지 않으면 QR 스캔 또는 코드 입력을 사용하세요.
              </span>
            </div>

            <button type="button" style={secondaryButtonStyle} onClick={onClose}>취소</button>
          </>
        )}
      </div>
    </div>
  );
}
