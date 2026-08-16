import { useEffect, useRef, useState } from "react";

type BarcodeDetectorLike = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

type BarcodeDetectorConstructor = new (options?: { formats?: string[] }) => BarcodeDetectorLike;

function getBarcodeDetector(): BarcodeDetectorLike | null {
  const BarcodeDetector = (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }).BarcodeDetector;
  return BarcodeDetector ? new BarcodeDetector({ formats: ["qr_code"] }) : null;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 200,
  display: "grid",
  placeItems: "center",
  padding: 20,
  background: "rgba(22, 22, 19, 0.72)",
};

const cardStyle: React.CSSProperties = {
  width: "min(100%, 460px)",
  padding: "28px 24px",
  borderRadius: 6,
  background: "var(--paper)",
  color: "var(--ink)",
  display: "grid",
  gap: 16,
};

export function NativeQrScanner({
  onDetected,
  onClose,
}: {
  onDetected: (value: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const onDetectedRef = useRef(onDetected);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onDetectedRef.current = onDetected;
  }, [onDetected]);

  useEffect(() => {
    let cancelled = false;
    let stream: MediaStream | null = null;
    let frame = 0;
    let detecting = false;

    async function start() {
      const detector = getBarcodeDetector();
      if (!detector) {
        setError("이 브라우저는 앱 내 QR 인식을 지원하지 않습니다. 휴대폰 기본 카메라로 QR을 열어 주세요.");
        return;
      }
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("카메라를 사용할 수 없습니다. 휴대폰 기본 카메라로 QR을 열어 주세요.");
        return;
      }

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled || !videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setReady(true);

        const detect = async () => {
          if (cancelled || !videoRef.current) return;
          if (!detecting) {
            detecting = true;
            try {
              const detected = await detector.detect(videoRef.current);
              const value = detected.find((item) => item.rawValue)?.rawValue;
              if (value) {
                cancelled = true;
                onDetectedRef.current(value);
                return;
              }
            } catch {
              // 카메라 프레임이 준비되기 전의 인식 실패는 다음 프레임에서 재시도한다.
            } finally {
              detecting = false;
            }
          }
          if (!cancelled) frame = window.requestAnimationFrame(() => void detect());
        };
        frame = window.requestAnimationFrame(() => void detect());
      } catch {
        if (!cancelled) setError("카메라 권한을 허용하지 못했습니다. 브라우저 설정을 확인해 주세요.");
      }
    }

    void start();
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-labelledby="native-qr-scanner-title">
      <section style={cardStyle}>
        <header style={{ display: "flex", alignItems: "start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <span className="section-kicker">QR SCANNER</span>
            <h2 id="native-qr-scanner-title" style={{ margin: "8px 0 0", fontSize: 22 }}>QR 코드를 비춰 주세요</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="QR 스캐너 닫기" style={{ border: 0, background: "none", fontSize: 24, cursor: "pointer" }}>×</button>
        </header>

        <div style={{ position: "relative", overflow: "hidden", aspectRatio: "4 / 3", borderRadius: 6, background: "#1f1d19" }}>
          <video ref={videoRef} muted playsInline aria-label="QR 카메라 미리보기" style={{ width: "100%", height: "100%", objectFit: "cover", display: ready ? "block" : "none" }} />
          {!ready && !error && <p style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", margin: 0, color: "#fff", fontSize: 13 }}>카메라를 준비하는 중입니다…</p>}
        </div>

        {error && <p className="form-error" role="alert" style={{ margin: 0 }}>{error}</p>}
        <p style={{ margin: 0, color: "var(--muted)", fontSize: 12, lineHeight: 1.6 }}>
          전시 입장 QR 또는 작품 QR을 화면 안에 맞춰 주세요.
        </p>
        <button type="button" onClick={onClose} style={{ minHeight: 44, border: "1px solid var(--line)", borderRadius: 4, background: "none", color: "var(--ink)", cursor: "pointer" }}>닫기</button>
      </section>
    </div>
  );
}
