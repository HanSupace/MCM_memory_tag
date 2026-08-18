export function AccessLockedPanel({
  onBack,
  title = "이 전시는 잠겨 있습니다",
}: {
  onBack: () => void;
  title?: string;
}) {
  return (
    <div className="home-content">
      <section
        aria-labelledby="access-locked-title"
        style={{ minHeight: "55vh", display: "grid", placeItems: "center", padding: "64px 0" }}
      >
        <div
          style={{
            width: "min(100%, 520px)",
            padding: "48px 32px",
            border: "1px solid var(--line)",
            borderRadius: 8,
            background: "#ece5d8",
            textAlign: "center",
          }}
        >
          <span aria-hidden="true" style={{ display: "block", marginBottom: 20, fontSize: 34 }}>⌑</span>
          <span className="section-kicker">ACCESS REQUIRED</span>
          <h1 id="access-locked-title" style={{ margin: "12px 0 14px", fontFamily: 'Georgia, "Noto Serif KR", serif', fontSize: 32, fontWeight: 400 }}>
            {title}
          </h1>
          <p style={{ margin: "0 auto 26px", maxWidth: 360, color: "var(--muted)", fontSize: 13, lineHeight: 1.8 }}>
            전시장 QR을 스캔하거나 해당 전시의 키링을 태그하면 접근 권한이 생깁니다.
          </p>
          <button type="button" onClick={onBack} style={{ minHeight: 44, padding: "0 20px", border: 0, borderRadius: 5, background: "var(--ink)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            전시 목록으로 돌아가기
          </button>
        </div>
      </section>
    </div>
  );
}
