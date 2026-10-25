export function BrandWatermark() {
  return <div className="brand-watermark" aria-hidden="true">{Array.from({ length: 6 }, (_, index) => <span key={index}>BRANDHUB · CREATE TOGETHER · BRANDHUB</span>)}</div>;
}
