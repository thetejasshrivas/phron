/** Visual lockup only: the product's accessible and textual brand remains PHRON. */
export function PhronLogo({ tone = 'light' }: { tone?: 'light' | 'dark' } = {}) {
  const letters = <>
    <text x="3" y="42" fontSize="42">फ़</text>
    <text x="42" y="42" fontSize="40">₹</text>
    <text x="64" y="42" fontSize="48" letterSpacing="-2">on</text>
  </>;
  return <span role="img" aria-label="PHRON" className="phron-logo" data-tone={tone}>
    <svg viewBox="-3 -14 132 76" width="132" height="76" aria-hidden="true" focusable="false">
      <g fontFamily="'Nirmala UI', 'Noto Sans Devanagari', sans-serif" fontWeight="700" strokeLinejoin="round" paintOrder="stroke fill">
        <g className="phron-logo-shadow" transform="translate(2.5 3.5)">{letters}</g>
        <g className="phron-logo-face">{letters}</g>
      </g>
    </svg>
  </span>;
}
