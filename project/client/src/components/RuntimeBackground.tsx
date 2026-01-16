export function RuntimeBackground() {
  return (
    <>
      <div className="runtime-bg" aria-hidden="true" style={{ background: 'radial-gradient(circle at 15% 50%, rgba(255, 87, 34, 0.15), transparent 40%), radial-gradient(circle at 85% 30%, rgba(6, 182, 212, 0.15), transparent 40%)' }} />
      <div className="starfield" aria-hidden="true" />
    </>
  );
}
