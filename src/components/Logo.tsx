interface LogoProps {
  size?: number;
  className?: string;
  showBorder?: boolean;
}

export default function Logo({ size = 32, className = '', showBorder = true }: LogoProps) {
  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg transition-transform hover:scale-105 active:scale-95 ${className}`}
      style={
        showBorder
          ? {
              width: size,
              height: size,
              background: 'var(--color-cream-2)',
              border: '2px solid var(--color-ink)',
              boxShadow: '2px 2px 0 var(--color-ink)',
            }
          : {
              width: size,
              height: size,
            }
      }
    >
      <img
        src="/assets/logo.svg"
        alt="Rare People Logo"
        width={size}
        height={size}
        className="pixelated block h-full w-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
