// Colossal Web Services logo. Two variants are provided; we show the one
// suited to the active theme using Tailwind's dark: variant so the mark
// stays legible on both dark and light backgrounds. Both <img> tags are
// always in the DOM (for SSR determinism); visibility is toggled via CSS.
import { cn } from "../../lib/utils";

const LOGO_DARK =
  "https://assets.cdn.filesafe.space/t0v85dVxP6g97UxOonyR/media/67171d76a3b2c4a7bfab603f.png";
const LOGO_LIGHT =
  "https://assets.cdn.filesafe.space/t0v85dVxP6g97UxOonyR/media/67171d763a21fb235048fb2d.png";

export function CwsLogo({
  className,
  height = 28,
  alt = "Colossal Web Services",
}: {
  className?: string;
  height?: number;
  alt?: string;
}) {
  return (
    <span className={cn("inline-flex items-center", className)}>
      {/* Shown on light backgrounds (light theme) */}
      <img
        src={LOGO_LIGHT}
        alt={alt}
        height={height}
        loading="lazy"
        className="h-auto w-auto dark:hidden"
        style={{ height }}
      />
      {/* Shown on dark backgrounds (dark theme) */}
      <img
        src={LOGO_DARK}
        alt={alt}
        height={height}
        loading="lazy"
        className="hidden h-auto w-auto dark:inline-block"
        style={{ height }}
      />
    </span>
  );
}
