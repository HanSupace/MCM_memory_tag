import { type FormEvent, useEffect, useRef, useState } from "react";
import type { IScannerControls } from "@zxing/browser";

export function ArtworkQrScanner({
  onClose,
  onDetected,
}: {
  onClose: () => void;
  onDetected: (value: string) => string | null;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const callbacksRef = useRef({ onClose, onDetected });
  const [manualCode, setManualCode] = useState("");
  const [message, setMessage] = useState("후면 카메라를 준비하고 있습니다…");
  const [cameraReady, setCameraReady] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [requestedDeviceId, setRequestedDeviceId] = useState("");
  const [currentDeviceId, setCurrentDeviceId] = useState("");

  useEffect(() => {
    callbacksRef.current = { onClose, onDetected };
  }, [onClose, onDetected]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") callbacksRef.current.onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => {
    let active = true;
    let stream: MediaStream | null = null;
    let controls: IScannerControls | null = null;

    async function startCamera() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setMessage("이 브라우저에서는 카메라를 사용할 수 없습니다. 아래에 작품 코드를 직접 입력해 주세요.");
        return;
      }

      try {
        const { BrowserCodeReader, BrowserQRCodeReader } = await import("@zxing/browser");
        if (!active) return;
        const video = videoRef.current;
        if (!video) return;
        const codeReader = new BrowserQRCodeReader(undefined, {
          delayBetweenScanAttempts: 220,
          delayBetweenScanSuccess: 800,
        });
        controls = await codeReader.decodeFromConstraints({
          audio: false,
          video: requestedDeviceId
            ? { deviceId: { exact: requestedDeviceId } }
            : { facingMode: { ideal: "environment" } },
        }, video, (result, _error, scannerControls) => {
          if (!active || !result) return;
          const errorMessage = callbacksRef.current.onDetected(result.getText());
          if (errorMessage) {
            setMessage(errorMessage);
            return;
          }
          scannerControls.stop();
        });
        if (!active) {
          controls.stop();
          return;
        }

        stream = video.srcObject instanceof MediaStream ? video.srcObject : null;
        const devices = await BrowserCodeReader.listVideoInputDevices();
        if (!active) return;
        setVideoDevices(devices);
        setCurrentDeviceId(stream.getVideoTracks()[0]?.getSettings().deviceId ?? requestedDeviceId);
        setCameraReady(true);
        setMessage("작품 옆 QR이 사각형 안에 들어오도록 비춰 주세요.");
      } catch (error) {
        const denied = error instanceof DOMException && (error.name === "NotAllowedError" || error.name === "SecurityError");
        setMessage(denied
          ? "카메라 권한이 필요합니다. 브라우저 설정에서 권한을 허용하거나 코드를 직접 입력해 주세요."
          : "카메라를 열지 못했습니다. 다른 앱에서 카메라를 사용 중인지 확인해 주세요.");
      }
    }

    void startCamera();
    return () => {
      active = false;
      controls?.stop();
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [requestedDeviceId]);

  function submitManualCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = manualCode.trim();
    if (!value) return;
    const error = callbacksRef.current.onDetected(value);
    if (error) setMessage(error);
  }

  return (
    <div
      className="qr-scanner-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="qr-scanner-modal" role="dialog" aria-modal="true" aria-labelledby="qr-scanner-title">
        <header>
          <div>
            <span className="section-kicker">ARTWORK QR</span>
            <h2 id="qr-scanner-title">작품 QR 스캔</h2>
          </div>
          <button type="button" className="qr-scanner-close" onClick={onClose} aria-label="QR 스캐너 닫기">×</button>
        </header>

        <div className={`qr-camera-frame${cameraReady ? " ready" : ""}`}>
          <video ref={videoRef} muted playsInline aria-label="QR 인식용 카메라 화면" />
          <span className="qr-camera-guide" aria-hidden="true" />
          {!cameraReady && <span className="qr-camera-placeholder" aria-hidden="true">▦</span>}
        </div>

        {videoDevices.length > 1 && (
          <div className="qr-camera-select">
            <label htmlFor="qr-camera-device">사용할 카메라</label>
            <select
              id="qr-camera-device"
              value={currentDeviceId}
              onChange={(event) => {
                setCameraReady(false);
                setMessage("선택한 카메라로 전환하고 있습니다…");
                setRequestedDeviceId(event.target.value);
              }}
            >
              {videoDevices.map((device, index) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `카메라 ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <p className="qr-scanner-message" role="status">{message}</p>

        <form className="qr-manual-form" onSubmit={submitManualCode}>
          <label htmlFor="artwork-qr-code">카메라가 안 되면 작품 코드 입력</label>
          <div>
            <input
              id="artwork-qr-code"
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value)}
              placeholder="작품 코드 또는 QR 주소"
            />
            <button type="submit" disabled={!manualCode.trim()}>찾기</button>
          </div>
        </form>
      </section>
    </div>
  );
}
