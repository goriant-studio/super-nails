import type { ReactNode, SVGProps } from "react";

function createIcon(path: ReactNode, props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {path}
    </svg>
  );
}

export function ArrowLeftIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M19 12H5" />
      <path d="m12 19-7-7 7-7" />
    </>,
    props
  );
}

export function HomeIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </>,
    props
  );
}

export function SearchIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </>,
    props
  );
}

export function MapPinIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M12 21s-6-4.8-6-10a6 6 0 1 1 12 0c0 5.2-6 10-6 10Z" />
      <circle cx="12" cy="11" r="2.2" />
    </>,
    props
  );
}

export function CarIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M5 16h14l-1.2-5.2A2 2 0 0 0 15.8 9H8.2a2 2 0 0 0-1.95 1.55L5 16Z" />
      <path d="M4 16v2.5A1.5 1.5 0 0 0 5.5 20H7" />
      <path d="M20 16v2.5A1.5 1.5 0 0 1 18.5 20H17" />
      <circle cx="7.5" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </>,
    props
  );
}

export function StarIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <path d="m12 3 2.8 5.6 6.2.9-4.5 4.4 1 6.1L12 17.2 6.5 20l1-6.1L3 9.5l6.2-.9L12 3Z" />,
    props
  );
}

export function BookmarkIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    props
  );
}

export function CalendarIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M4 6h16v14H4z" />
      <path d="M8 3v6" />
      <path d="M16 3v6" />
      <path d="M4 10h16" />
    </>,
    props
  );
}

export function ScissorsIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.5 15.5" />
      <path d="M20 20 8.5 8.5" />
    </>,
    props
  );
}

export function LightbulbIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M9 18h6" />
      <path d="M10 22h4" />
      <path d="M12 2a6 6 0 0 0-3.8 10.6A4.5 4.5 0 0 1 10 16h4a4.5 4.5 0 0 1 1.8-3.4A6 6 0 0 0 12 2Z" />
    </>,
    props
  );
}

export function UserIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c1.8-4 5-6 8-6s6.2 2 8 6" />
    </>,
    props
  );
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(<path d="m9 18 6-6-6-6" />, props);
}

export function GridIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <rect x="3" y="3" width="8" height="8" rx="1.4" />
      <rect x="13" y="3" width="8" height="8" rx="1.4" />
      <rect x="3" y="13" width="8" height="8" rx="1.4" />
      <rect x="13" y="13" width="8" height="8" rx="1.4" />
    </>,
    props
  );
}

export function CheckIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(<path d="m5 13 4 4L19 7" />, props);
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>,
    props
  );
}

export function ClockIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </>,
    props
  );
}

export function BellIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </>,
    props
  );
}

export function ShoppingBagIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M6 8h12l-1 12H7L6 8Z" />
      <path d="M9 8a3 3 0 1 1 6 0" />
    </>,
    props
  );
}

export function EyeIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>,
    props
  );
}

export function ShieldCheckIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M12 3 5 6v5c0 4.7 2.9 8 7 10 4.1-2 7-5.3 7-10V6l-7-3Z" />
      <path d="m9.3 11.8 1.9 1.9 3.8-4.1" />
    </>,
    props
  );
}

export function GlobeIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a15 15 0 0 1 0 18" />
      <path d="M12 3a15 15 0 0 0 0 18" />
    </>,
    props
  );
}

export function TicketIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M4 8a2 2 0 0 0 0 4v4h16v-4a2 2 0 0 0 0-4V4H4v4Z" />
      <path d="M9 4v12" />
      <path d="M9 8h0" />
      <path d="M9 12h0" />
    </>,
    props
  );
}

export function PhoneIcon(props: SVGProps<SVGSVGElement>) {
  return createIcon(
    <>
      <path d="M6.5 4.5c.8-.8 2.1-.8 2.9 0l1.6 1.6c.7.7.8 1.8.2 2.6l-1.1 1.5a14 14 0 0 0 3.9 3.9l1.5-1.1c.8-.6 1.9-.5 2.6.2l1.6 1.6c.8.8.8 2.1 0 2.9l-1 1c-.9.9-2.2 1.2-3.4.7-2.4-1-4.7-2.7-6.8-4.8S6.8 10 5.8 7.6c-.5-1.2-.2-2.5.7-3.4l1-1Z" />
    </>,
    props
  );
}

export function SignalIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 28 16" aria-hidden="true" {...props}>
      <rect x="1" y="9" width="4" height="6" rx="1.2" fill="currentColor" />
      <rect x="8" y="6" width="4" height="9" rx="1.2" fill="currentColor" />
      <rect x="15" y="3" width="4" height="12" rx="1.2" fill="currentColor" />
      <rect x="22" y="0" width="4" height="15" rx="1.2" fill="currentColor" />
    </svg>
  );
}

export function BatteryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 34 16" aria-hidden="true" {...props}>
      <rect
        x="1"
        y="1"
        width="28"
        height="14"
        rx="4"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <rect x="30.5" y="5" width="2.5" height="6" rx="1" fill="currentColor" />
      <rect x="3.5" y="3.5" width="18" height="9" rx="2.8" fill="currentColor" />
    </svg>
  );
}
