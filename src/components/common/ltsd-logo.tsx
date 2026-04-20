interface LtsdLogoProps {
  size?: number;
  className?: string;
}

export function LtsdLogo({ size = 64, className }: LtsdLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="LTSD — Limited Time Super Deals"
      role="img"
    >
      {/* Outer circle */}
      <circle cx="40" cy="40" r="39" fill="#C82750" />
      <circle cx="40" cy="40" r="34" fill="#000A1E" />

      {/* Center starburst */}
      <circle cx="40" cy="40" r="24" fill="#C82750" />

      {/* Lightning bolt — deal energy */}
      <path
        d="M43 22 L32 41 H40 L37 58 L52 35 H43 L43 22Z"
        fill="#FFC700"
      />

      {/* Circular text path (approximated with arc segments) */}
      <path id="top-arc" d="M 12,40 A 28,28 0 0,1 68,40" fill="none" />
      <path id="bot-arc" d="M 68,40 A 28,28 0 0,1 12,40" fill="none" />

      <text
        fontSize="7"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fill="white"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        <textPath href="#top-arc" startOffset="50%">LIMITED TIME</textPath>
      </text>
      <text
        fontSize="7"
        fontFamily="system-ui, sans-serif"
        fontWeight="700"
        fill="white"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        <textPath href="#bot-arc" startOffset="50%">SUPER DEALS</textPath>
      </text>
    </svg>
  );
}
