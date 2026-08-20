import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function IconBase({ size = 24, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return <IconBase {...props}><path d="M18 8a6 6 0 0 0-12 0c0 6.6-2.8 7-2.8 9h17.6c0-2-2.8-2.4-2.8-9" /><path d="M9.8 21h4.4" /></IconBase>;
}

export function UserIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="8" r="4" fill="currentColor" stroke="none" /><path d="M4 21a8 8 0 0 1 16 0Z" fill="currentColor" stroke="none" /></IconBase>;
}

export function ChevronRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="m9 18 6-6-6-6" /></IconBase>;
}

export function ArrowRightIcon(props: IconProps) {
  return <IconBase {...props}><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></IconBase>;
}

export function ArrowLeftIcon(props: IconProps) {
  return <IconBase {...props}><path d="M19 12H5" /><path d="m11 6-6 6 6 6" /></IconBase>;
}

export function LandmarkIcon(props: IconProps) {
  return <IconBase {...props}><path d="m3 10 9-6 9 6" /><path d="M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" /></IconBase>;
}

export function BookmarkIcon(props: IconProps) {
  return <IconBase {...props}><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21Z" /></IconBase>;
}

export function PencilIcon(props: IconProps) {
  return <IconBase {...props}><path d="m4 20 4.2-1 10.6-10.6a2.1 2.1 0 0 0-3-3L5.2 16Z" /><path d="m14.5 6.7 2.8 2.8" /></IconBase>;
}

export function HomeIcon(props: IconProps) {
  return <IconBase {...props}><path d="m3 10 9-7 9 7" /><path d="M5 9v12h14V9M9 21v-7h6v7" /></IconBase>;
}

export function GalleryIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="4" width="16" height="16" rx="2.5" /><circle cx="8" cy="9" r="1.5" /><path d="m5 18 4.5-4.5 3.2 3.2 2.2-2.2 4.1 3.8" /><path d="M19.5 2v4M17.5 4h4" /></IconBase>;
}

export function SparkleIcon(props: IconProps) {
  return <IconBase {...props}><path d="m12 2 1.5 5.1L18 9l-4.5 1.9L12 16l-1.5-5.1L6 9l4.5-1.9Z" /><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7Z" /></IconBase>;
}

export function SmileIcon(props: IconProps) {
  return <IconBase {...props}><circle cx="12" cy="12" r="9" /><path d="M8.5 10h.01M15.5 10h.01M8.5 14.5c1.8 2 5.2 2 7 0" /></IconBase>;
}

export function ReportIcon(props: IconProps) {
  return <IconBase {...props}><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6M9 16h4" /></IconBase>;
}

export function MailIcon(props: IconProps) {
  return <IconBase {...props}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7 8 6 8-6" /></IconBase>;
}

export function ScanQrIcon(props: IconProps) {
  return <IconBase {...props}><path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" /><rect x="7" y="8" width="10" height="8" rx="2" /><path d="M7 11h10M7 14h10" /></IconBase>;
}

export function TimedContentIcon(props: IconProps) {
  return <IconBase {...props}><path d="m12 3 1.2 3.3L16.5 7.5l-3.3 1.2L12 12l-1.2-3.3-3.3-1.2 3.3-1.2Z" /><path d="m17 12 .9 2.1L20 15l-2.1.9L17 18l-.9-2.1L14 15l2.1-.9Z" /><path d="M6 15.5 6.7 17l1.5.7-1.5.7L6 20l-.7-1.6-1.5-.7 1.5-.7Z" /></IconBase>;
}

export function ProductIcon(props: IconProps) {
  return <IconBase {...props}><path d="M12 20.5 5.2 14C1.3 10.2 3.7 4 8.2 4c1.7 0 3.1.8 3.8 2.1C12.7 4.8 14.1 4 15.8 4c4.5 0 6.9 6.2 3 10L12 20.5Z" /><path d="m19 16 .7 1.7 1.8.8-1.8.7L19 21l-.8-1.8-1.7-.7 1.7-.8Z" /></IconBase>;
}
