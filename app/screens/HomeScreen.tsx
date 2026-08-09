const exhibitions = [
  {
    title: "공간과 기억 사이",
    meta: "2025.04.01 – 2025.06.30 · 성수 MCM 하우스",
    status: "진행 중",
    art: "art-one",
    action: "탐색하기",
  },
  {
    title: "빛의 잔향",
    meta: "2025.05.15 – 2025.07.20 · 청담 갤러리",
    status: "예정",
    art: "art-two",
    action: "미리보기",
  },
];

const newContents = [
  {
    label: "방금 공개",
    title: "관람 요약 공개",
    detail: "공간과 기억 사이",
    tone: "amber",
  },
  {
    label: "1일 후 콘텐츠",
    title: "숨은 해설 공개",
    detail: "빛의 잔향",
    tone: "blue",
  },
  {
    label: "3일 후 콘텐츠",
    title: "비하인드 스토리",
    detail: "공간과 기억 사이",
    tone: "rose",
  },
];

const recommendations = [
  {
    name: "MCM 스타크 백팩",
    color: "어쉬 블루",
    reason: "수집 작품 《빛의 잔향》의 색채 연결",
    art: "product-blue",
  },
  {
    name: "MCM 클래식 토트",
    color: "코냑 브라운",
    reason: "수집 작품 소재의 따뜻한 질감에서 이어집니다.",
    art: "product-cognac",
  },
];

export function HomeScreen({ announce }: { announce: (message: string) => void }) {
  return (
    <div className="home-content">
      <section className="home-intro">
        <div>
          <p className="eyebrow">MY EXHIBITION MEMORY</p>
          <h1>나의 전시 기억</h1>
          <p>기억해 둔 작품과 새롭게 도착한 이야기를 만나보세요.</p>
        </div>
        <div className="memory-date"><span>07</span><small>AUG<br />2026</small></div>
      </section>

      <section className="section-block exhibitions-section">
        <div className="section-heading">
          <div><span className="section-kicker">NOW &amp; NEXT</span><h2>지금 열리는 전시</h2></div>
          <button type="button" onClick={() => announce("전시 전체 보기는 다음 단계에서 연결됩니다.")}>전체 보기</button>
        </div>
        <div className="exhibition-grid">
          {exhibitions.map((exhibition, index) => (
            <article className="exhibition-card" key={exhibition.title}>
              <div className={`exhibition-art ${exhibition.art}`}>
                <span className="exhibition-number">0{index + 1}</span>
                <span className={`status-chip ${index === 1 ? "upcoming" : ""}`}>{exhibition.status}</span>
                <div className="art-plane plane-a" /><div className="art-plane plane-b" />
              </div>
              <div className="exhibition-card-body">
                <h3>{exhibition.title}</h3>
                <p>{exhibition.meta}</p>
                <button type="button" onClick={() => announce(`${exhibition.title} 전시를 선택했습니다.`)}>{exhibition.action}<span>↗</span></button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block record-section">
        <div className="section-heading compact">
          <div><span className="section-kicker">ARCHIVE</span><h2>나의 방문 기록</h2></div>
          <button type="button" onClick={() => announce("마이 페이지는 다음 구현 범위입니다.")}>마이 페이지에서 보기</button>
        </div>
        <div className="record-grid">
          <div><strong>02</strong><span>방문 인증</span><small>EXHIBITIONS</small></div>
          <div><strong>07</strong><span>수집 작품</span><small>COLLECTED</small></div>
          <div><strong>03</strong><span>한줄평</span><small>NOTES</small></div>
        </div>
      </section>

      <section className="keyring-card">
        <div className="keyring-visual" aria-hidden="true">
          <span className="keyring-loop" /><span className="keyring-body">M</span><span className="keyring-wave">)))</span>
        </div>
        <div className="keyring-copy">
          <span className="section-kicker light">MCM NFC EXPERIENCE</span>
          <h2>기억을 시작하는<br />나만의 키링</h2>
          <p>NFC 키링을 연결하면 전시 방문 인증과 작품 수집이 시작됩니다.</p>
          <div className="keyring-state"><i />연결된 키링이 없습니다.</div>
          <button type="button" onClick={() => announce("키링 연결 화면은 다음 단계에서 제공됩니다.")}>키링 연결하기<span>→</span></button>
        </div>
      </section>

      <section className="section-block contents-section">
        <div className="section-heading">
          <div><span className="section-kicker">JUST UNLOCKED</span><h2>새로 공개된 콘텐츠</h2></div>
          <button type="button" onClick={() => announce("모든 알림은 다음 구현 범위입니다.")}>모든 알림</button>
        </div>
        <div className="content-list">
          {newContents.map((content) => (
            <button type="button" key={content.title} onClick={() => announce(`${content.title} 콘텐츠를 확인합니다.`)}>
              <span className={`content-symbol ${content.tone}`}><i /></span>
              <span className="content-copy"><small>{content.label}</small><strong>{content.title}</strong><em>{content.detail}</em></span>
              <span className="content-arrow">→</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section-block recommendation-section">
        <div className="section-heading recommendation-heading">
          <div>
            <span className="section-kicker">CURATED FOR YOU</span>
            <h2>나를 위한 추천</h2>
            <p>수집한 작품의 색감과 이야기를 바탕으로 선별했습니다.</p>
          </div>
        </div>
        <div className="recommendation-grid">
          {recommendations.map((product) => (
            <article className="product-card" key={product.name}>
              <div className={`product-art ${product.art}`}>
                <div className="bag-shape"><span /></div>
              </div>
              <div className="product-info">
                <small>{product.color}</small><h3>{product.name}</h3><p>{product.reason}</p>
                <button type="button" onClick={() => announce(`${product.name} 상세 보기는 다음 단계에서 연결됩니다.`)}>자세히 보기<span>↗</span></button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
