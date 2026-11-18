/** Direction E brand mark: one square per Build / Apply / Lead plus ink. */
export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`e-mark ${className}`}>
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
