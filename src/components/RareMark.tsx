interface RareMarkProps {
  size?: number;
  className?: string;
  withDitherBox?: boolean;
}

export default function RareMark({ size = 32, className = '', withDitherBox = false }: RareMarkProps) {
  const pixelIcon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      shapeRendering="crispEdges"
      className="pixelated block select-none"
    >
      {/* Black Square Background */}
      <rect width="24" height="24" fill="#0c0d0e" />

      {/* White Pixel Character Body */}
      {/* Cap Top & Slope */}
      <path d="M8,2h8v1h-8z M7,3h10v2h-10z M5,5h14v1h-14z" fill="#ffffff" />
      {/* Ears & Forehead */}
      <path d="M5,6h1v2h-1z M18,6h1v2h-1z M7,7h10v1h-10z" fill="#ffffff" />
      {/* Face & Eye bridge */}
      <path d="M7,8h2v2h-2z M11,8h4v2h-4z M17,8h2v2h-2z" fill="#ffffff" />
      {/* Jaw & Neck */}
      <path d="M7,10h12v1h-12z M9,11h8v1h-8z M11,12h4v2h-4z" fill="#ffffff" />
      {/* Collar & Shoulders */}
      <path d="M9,14h8v1h-8z M7,15h12v1h-12z M5,16h14v1h-14z" fill="#ffffff" />
      {/* Arms & Torso */}
      <path d="M5,17h2v4h-2z M8,17h8v4h-8z M17,17h2v4h-2z" fill="#ffffff" />

      {/* Black Facial & Body Features */}
      {/* Brow / Visor Line */}
      <path d="M6,6h12v1h-12z M6,7h1v1h-1z M17,7h1v1h-1z" fill="#0c0d0e" />
      {/* Two Square Eyes */}
      <path d="M9,8h2v2h-2z M15,8h2v2h-2z" fill="#0c0d0e" />
      {/* Arm Slits */}
      <path d="M7,17h1v4h-1z M16,17h1v4h-1z" fill="#0c0d0e" />
    </svg>
  );

  if (!withDitherBox) {
    return (
      <span className={`inline-flex shrink-0 items-center justify-center border border-[#111] shadow-[1px_1px_0_#111] ${className}`}>
        {pixelIcon}
      </span>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center ${className}`}
      style={{
        width: 140,
        height: 100,
        border: '1px solid var(--ink)',
        backgroundImage: 'var(--dither-25)',
      }}
    >
      <div className="bg-[#111] p-1.5 border-2 border-black shadow-[3px_3px_0_#111]">
        {pixelIcon}
      </div>
    </div>
  );
}
