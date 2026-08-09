export function MyPageScreen({ announce }: { announce: (message: string) => void }) {
  return (
    <div className="home-content">
      <section className="section-block">
        <div className="section-heading">
          <div><span className="section-kicker">MY</span><h2>마이</h2></div>
        </div>
        <p>이 화면은 다음 단계에서 구현됩니다. (Issue #15)</p>
        <button type="button" onClick={() => announce("마이 화면은 다음 단계에서 제공됩니다.")}>알아보기</button>
      </section>
    </div>
  );
}
