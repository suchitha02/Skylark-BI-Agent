// Minimal stroke-based SVG icon set — no external icon library dependency.
// Kept in one file so the visual language (stroke width, line caps, size) stays
// consistent everywhere an icon replaces what used to be an emoji.

import { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function BrandIcon(props: IconProps) {
  // Abstract bar-chart mark for the app logo badge
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="12" width="4" height="8.5" rx="1.2" />
      <rect x="10" y="7.5" width="4" height="13" rx="1.2" />
      <rect x="16.5" y="3.5" width="4" height="17" rx="1.2" />
    </svg>
  );
}

export function ChatIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z" />
    </svg>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5 13.7 9.3 19.5 11 13.7 12.7 12 18.5 10.3 12.7 4.5 11 10.3 9.3 12 3.5Z" />
      <path d="M19 15.5 19.7 17.8 22 18.5 19.7 19.2 19 21.5 18.3 19.2 16 18.5 18.3 17.8 19 15.5Z" />
    </svg>
  );
}

export function WarningIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 4 21 19.5H3L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5.2" />
      <path d="M12 8v.1" />
    </svg>
  );
}

export function SendIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M20.5 3.5 3 10.2c-.7.27-.68 1.26.03 1.5l6.9 2.3 2.3 6.9c.24.71 1.23.73 1.5.03L20.5 3.5Z" />
      <path d="M10 14 20.5 3.5" />
    </svg>
  );
}

export function LinkIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M9 15 15 9" />
      <path d="M11 6.5 12.4 5.1a3.8 3.8 0 0 1 5.4 5.4L16.4 12" />
      <path d="M13 17.5 11.6 18.9a3.8 3.8 0 0 1-5.4-5.4L7.6 12" />
    </svg>
  );
}

export function CopyIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <rect x="8.5" y="8.5" width="11" height="11" rx="1.8" />
      <path d="M15.5 8.5V6.3A1.8 1.8 0 0 0 13.7 4.5H6.3A1.8 1.8 0 0 0 4.5 6.3v7.4a1.8 1.8 0 0 0 1.8 1.8h2.2" />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3.5v11.5" />
      <path d="M7.5 10.5 12 15l4.5-4.5" />
      <path d="M5 18.5h14" />
    </svg>
  );
}

export function PrintIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M7 8.5V4.5h10v4" />
      <rect x="4.5" y="8.5" width="15" height="7.5" rx="1.5" />
      <path d="M7 14.5h10v5H7Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base} {...props}>
      <path d="M4.5 12.5 9.5 17.5 19.5 6.5" />
    </svg>
  );
}
