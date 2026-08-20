import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { saveGalleryPhoto } from "../../lib/gallery-storage";
import { ArrowLeftIcon, BellIcon, GalleryIcon, UserIcon } from "./MomenteIcons";

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
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState("");
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
    clearCapturedPhoto();
    setIsOpen(false);
    setCameraError("");
  }

  function clearCapturedPhoto() {
    if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
    setCapturedPhoto(null);
    setCapturedPhotoUrl("");
  }

  function setPhotoPreview(blob: Blob) {
    if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
    stopCamera();
    setCapturedPhoto(blob);
    setCapturedPhotoUrl(URL.createObjectURL(blob));
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
      clearCapturedPhoto();
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
      await saveGalleryPhoto(exhibition.id, blob);
      window.dispatchEvent(new Event("mcm-gallery-updated"));
      announce(`${exhibition.title} 사진첩에 저장했습니다.`);
      closeCamera();
    } catch (error) {
      setCameraError(error instanceof Error ? error.message : "사진 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.");
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
      if (blob) setPhotoPreview(blob);
      else setCameraError("사진을 만들지 못했습니다. 다시 촬영해 주세요.");
    }, "image/jpeg", 0.9);
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) setPhotoPreview(file);
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

  useEffect(() => () => {
    if (capturedPhotoUrl) URL.revokeObjectURL(capturedPhotoUrl);
  }, [capturedPhotoUrl]);

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
        <div className="camera-panel-backdrop" role="presentation">
          <section className="camera-panel" role="dialog" aria-modal="true" aria-labelledby="camera-panel-title">
            <header className="camera-screen-header">
              <button type="button" onClick={closeCamera} aria-label="카메라 화면 닫기"><ArrowLeftIcon /></button>
              <span className="camera-screen-logo" role="img" aria-label="MCM" />
              <div className="camera-screen-header-actions" aria-hidden="true">
                <BellIcon />
                <UserIcon />
              </div>
            </header>

            <div className="camera-screen-body">
              <div className="camera-screen-title">
                <h2 id="camera-panel-title">Exhibition photo</h2>
                <p>전시회 목록</p>
              </div>

              <label className="camera-exhibition-select">
              <span className="sr-only">사진을 저장할 전시회</span>
              <select value={selectedExhibitionId} onChange={(event) => {
                const exhibitionId = event.target.value;
                stopCamera();
                clearCapturedPhoto();
                setSelectedExhibitionId(exhibitionId);
                setCameraError("");
                if (exhibitionId) window.setTimeout(() => void startCamera(exhibitionId), 0);
              }}>
                <option value="">전시회를 선택해 주세요</option>
                {exhibitions.map((exhibition) => (
                  <option key={exhibition.id} value={exhibition.id}>{exhibition.title}</option>
                ))}
              </select>
              </label>

              <div
                className={`camera-preview${isCameraReady ? " ready" : ""}${capturedPhotoUrl ? " captured" : ""}`}
                style={capturedPhotoUrl ? { backgroundImage: `url(${capturedPhotoUrl})` } : undefined}
              >
                <video ref={videoRef} muted playsInline aria-label="카메라 미리보기" />
                {!isCameraReady && !capturedPhotoUrl && <p>카메라 화면</p>}
              </div>

              {cameraError && <p className="camera-error" role="alert">{cameraError}</p>}

              <div className="camera-panel-actions">
                <button type="button" className="camera-file-button" onClick={() => fileInputRef.current?.click()}>
                  <GalleryIcon /> 사진 선택
                </button>
                <button
                  type="button"
                  className={`camera-shutter${capturedPhoto ? " retake" : ""}`}
                  onClick={capturedPhoto ? () => void startCamera() : capturePhoto}
                  disabled={!capturedPhoto && !isCameraReady}
                  aria-label={capturedPhoto ? "다시 촬영" : "사진 촬영"}
                ><span /></button>
                <button
                  type="button"
                  className="camera-save-button"
                  disabled={!capturedPhoto}
                  onClick={() => capturedPhoto && void storePhoto(capturedPhoto)}
                >
                  <span aria-hidden="true" /> 사진 담기
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={(event) => void handleFileChange(event)} hidden />
              </div>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
