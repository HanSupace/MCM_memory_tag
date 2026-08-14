export function ProductCurationScreen({ announce }: { announce: (message: string) => void }) {
  return (
    <div className="home-content">
      <section className="curation-screen">
        <header className="curation-heading">
          <span className="section-kicker">CURATED FOR YOU</span>
          <h1>맞춤 추천</h1>
          <p>전시에서 발견한 색과 형태를 MCM 컬렉션으로 이어 만나보세요.</p>
        </header>

        <section className="curation-next">
          <span className="section-kicker">NEXT COLLECTION</span>
          <h2>기억에서 이어지는 컬렉션</h2>
          <p>수집 작품의 대담한 컬러와 조형적인 실루엣을 닮은 아이템을 선별했습니다.</p>
          <button type="button" onClick={() => announce("추천 컬렉션을 준비하고 있어요.")}>추천 컬렉션 보기</button>
        </section>
      </section>
    </div>
  );
}
