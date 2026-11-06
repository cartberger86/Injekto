/** Lokales Vektorsymbol: weich gerundetes Vial mit Verschluss und Tropfen. */
export function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={className}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="16" y="4" width="16" height="6" rx="1.6" />
        <path d="M19 10v5m10-5v5" />
        <path d="M19 15c0 4-8 5-8 12 0 9 4.5 15 13 15s13-6 13-15c0-7-8-8-8-12Z" />
      </g>
      <path
        d="M24 22c-2 3.6-5.5 6.2-5.5 9.5a5.5 5.5 0 0 0 11 0C29.5 28.2 26 25.6 24 22Z"
        fill="currentColor"
        fillOpacity=".9"
      />
      <path
        d="M21 7h6"
        stroke="#d9bb8c"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
