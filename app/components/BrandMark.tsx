export function BrandMark({ inverse = false }: { inverse?: boolean }) {
  return (
    <div className={`brand-mark${inverse ? " inverse" : ""}`} aria-label="MCM Momente">
      <span className="brand-word">MCM</span>
      <span className="brand-divider" aria-hidden="true" />
      <span className="brand-sub">MOMENTE</span>
    </div>
  );
}
