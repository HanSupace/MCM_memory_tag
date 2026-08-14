import { useState } from "react";
import { CollectArtworkPanel, CollectedArtwork } from "../components/CollectArtworkPanel";

export function PersonalHallScreen({ announce }: { announce: (message: string) => void }) {
  const [showCollectPanel, setShowCollectPanel] = useState(false);

  function handleCollected(artwork: CollectedArtwork) {
    announce(`${artwork.title} 작품을 수집했습니다.`);
  }

  return (
    <div className="home-content">
      <section className="section-block">
        <div className="section-heading">
          <div><span className="section-kicker">ARCHIVE</span><h2>나만의 전시회장</h2></div>
        </div>
        <p>이 화면은 다음 단계에서 구현됩니다. (Issue #8)</p>
        <button type="button" onClick={() => setShowCollectPanel(true)}>작품 QR·NFC로 수집하기</button>
      </section>

      {showCollectPanel && (
        <CollectArtworkPanel
          announce={announce}
          onClose={() => setShowCollectPanel(false)}
          onCollected={handleCollected}
        />
      )}
    </div>
  );
}
