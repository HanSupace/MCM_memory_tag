import { QrScanner } from "./QrScanner";

export function ArtworkQrScanner({
  onClose,
  onDetected,
}: {
  onClose: () => void;
  onDetected: (value: string) => string | null;
}) {
  return (
    <QrScanner
      onClose={onClose}
      onDetected={onDetected}
      kicker="ARTWORK QR"
      title="작품 QR 스캔"
      cameraMessage="작품 옆 QR이 사각형 안에 들어오도록 비춰 주세요."
      manualLabel="카메라가 안 되면 작품 코드 입력"
      manualPlaceholder="작품 코드 또는 QR 주소"
    />
  );
}
