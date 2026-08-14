import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { saveGalleryPhoto } from "../../lib/gallery-storage";

type ExhibitionOption = {
  id: string;
  title: string;
};

export function CameraCaptureButton({
  activeExhibitionId,
  initiallyOpen = false,
  announce,
}: {
  activeExhibitionId: string | null;
  initiallyOpen?: boolean;
  announce: (message: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [exhibitions, setExhibitions] = useState<ExhibitionOption[]>([]);
  const [selectedExhibitionId, setSelectedExhibitionId] = useState(activeExhibitionId ?? "");
  const [cameraError, setCameraError] = useState("");
  const [isCameraReady, setIsCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraReady(false);
  }

  function closeCamera() {
    stopCamera();
    setIsOpen(false);
    setCameraError("");
  }

  function openCamera() {
    setSelectedExhibitionId(activeExhibitionId ?? "");
    setIsOpen(true);
    if (activeExhibitionId) {
      window.setTimeout(() => void startCamera(activeExhibitionId), 0);
    }
  }

  async function startCamera(exhibitionId = selectedExhibitionId) {
    if (!exhibitionId) {
      setCameraError("사진을 분류할 전시회를 먼저 선택해 주세요.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("이 브라우저에서는 카메라를 바로 켤 수 없습니다. 기기 사진 선택을 이용해 주세요.");
      return;
    }

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraError("");
      setIsCameraReady(true);
    } catch {
      setCameraError("카메라 권한을 허용하지 못했습니다. 브라우저 설정을 확인하거나 기기 사진을 선택해 주세요.");
    }
  }

  async function storePhoto(blob: Blob) {
    const exhibition = exhibitions.find((item) => item.id === selectedExhibitionId);
    if (!exhibition) {
      setCameraError("사진을 분류할 전시회를 선택해 주세요.");
      return;
    }

    try {
      await saveGalleryPhoto({
        id: crypto.randomUUID(),
        exhibitionId: exhibition.id,
        exhibitionTitle: exhibition.title,
        blob,
        createdAt: new Date().toISOString(),
      });
      window.dispatchEvent(new Event("mcm-gallery-updated"));
      announce(`${exhibition.title} 사진첩에 저장했습니다.`);
      closeCamera();
    } catch {
      setCameraError("사진 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (blob) void storePhoto(blob);
      else setCameraError("사진을 만들지 못했습니다. 다시 촬영해 주세요.");
    }, "image/jpeg", 0.9);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) await storePhoto(file);
    event.target.value = "";
  }

  useEffect(() => {
    if (!isOpen) return;

    fetch("/api/exhibitions", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("failed");
        return response.json() as Promise<{ exhibitions: ExhibitionOption[] }>;
      })
      .then(({ exhibitions: list }) => setExhibitions(list))
      .catch(() => setCameraError("전시 목록을 불러오지 못했습니다."));
  }, [isOpen]);

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
  }, []);

  return (
    <>
      <button
        type="button"
        className={`camera-toggle-button${isOpen ? " active" : ""}`}
        onClick={() => {
          if (isOpen) closeCamera();
          else openCamera();
        }}
        aria-label={isOpen ? "카메라 닫기" : "카메라 열기"}
        aria-expanded={isOpen}
      >
        <span aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="camera-panel-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeCamera();
        }}>
          <section className="camera-panel" role="dialog" aria-modal="true" aria-labelledby="camera-panel-title">
            <header>
              <div>
                <span className="section-kicker">CAPTURE</span>
                <h2 id="camera-panel-title">전시의 순간 기록하기</h2>
              </div>
              <button type="button" onClick={closeCamera} aria-label="카메라 닫기">×</button>
            </header>

            <label className="camera-exhibition-select">
              <span>사진을 저장할 전시회</span>
              <select value={selectedExhibitionId} onChange={(event) => {
                stopCamera();
                setSelectedExhibitionId(event.target.value);
                setCameraError("");
              }}>
                <option value="">전시회를 선택해 주세요</option>
                {exhibitions.map((exhibition) => (
                  <option key={exhibition.id} value={exhibition.id}>{exhibition.title}</option>
                ))}
              </select>
            </label>

            <div className={`camera-preview${isCameraReady ? " ready" : ""}`}>
              <video ref={videoRef} muted playsInline aria-label="카메라 미리보기" />
              {!isCameraReady && <p>전시회를 선택한 뒤 카메라를 켜주세요.</p>}
            </div>

            {cameraError && <p className="camera-error" role="alert">{cameraError}</p>}

            <div className="camera-panel-actions">
              {isCameraReady ? (
                <button type="button" className="camera-shutter" onClick={capturePhoto} aria-label="사진 촬영"><span /></button>
              ) : (
                <button type="button" className="camera-start-button" onClick={() => void startCamera()}>카메라 켜기</button>
              )}
              <button type="button" className="camera-file-button" onClick={() => fileInputRef.current?.click()}>기기 사진 선택</button>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={(event) => void handleFileChange(event)} hidden />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
