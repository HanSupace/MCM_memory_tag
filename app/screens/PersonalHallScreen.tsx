export function PersonalHallScreen({ announce }: { announce: (message: string) => void }) {
  return (
    <div className="home-content">
      <section className="section-block">
        <div className="section-heading">
          <div><span className="section-kicker">ARCHIVE</span><h2>나만의 전시회장</h2></div>
        </div>
        <p>이 화면은 다음 단계에서 구현됩니다. (Issue #7, #8)</p>
        <button type="button" onClick={() => announce("나만의 전시회장은 다음 단계에서 제공됩니다.")}>알아보기</button>
      </section>
    </div>
  );
}
