import type { SVGProps } from "react";

/**
 * Small inline icon set. Deliberately generic (no third-party brand marks)
 * — nothing here may resemble the YouTube or Insta360 logos.
 */

export type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return { width: 16, height: 16, viewBox: "0 0 16 16", fill: "none", "aria-hidden": true, ...props };
}

export function IconPersonCircle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="8" cy="6.3" r="1.9" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M3.6 12.6c.9-1.7 2.6-2.7 4.4-2.7s3.5 1 4.4 2.7"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconFolderPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M2 4.5c0-.55.45-1 1-1h3l1.2 1.5H13c.55 0 1 .45 1 1V11c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1V4.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 7v3.2M6.4 8.6h3.2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconSdCard(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M5 2h4.2L12 4.8V13c0 .55-.45 1-1 1H5c-.55 0-1-.45-1-1V3c0-.55.45-1 1-1Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M6 2v3M8 2v3M10 4v1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function IconWarningTriangle(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path
        d="M8 2.2 14.3 13H1.7L8 2.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M8 6.5v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="8" cy="11.3" r="0.75" fill="currentColor" />
    </svg>
  );
}

export function IconClose(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function IconChevronDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M8 2.5 13.5 5.5 8 8.5 2.5 5.5 8 2.5Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M2.5 8.5 8 11.5l5.5-3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M2.5 11.3 8 14.3l5.5-3" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 8h12M8 2c1.8 1.7 2.8 3.8 2.8 6s-1 4.3-2.8 6c-1.8-1.7-2.8-3.8-2.8-6s1-4.3 2.8-6Z" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}
