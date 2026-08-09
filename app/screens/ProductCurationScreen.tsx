export function ProductCurationScreen({ announce }: { announce: (message: string) => void }) {
  return (
    <div className="home-content">
      <section className="section-block">
        <div className="section-heading">
          <div><span className="section-kicker">CURATED FOR YOU</span><h2>맞춤 추천</h2></div>
        </div>
        <p>이 화면은 다음 단계에서 구현됩니다. (Issue #14)</p>
        <button type="button" onClick={() => announce("맞춤 추천 화면은 다음 단계에서 제공됩니다.")}>알아보기</button>
      </section>
    </div>
  );
}
