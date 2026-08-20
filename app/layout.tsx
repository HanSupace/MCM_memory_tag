import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "MCM Momente — 나의 전시 기억",
    description: "전시의 순간을 기록하고 취향을 발견하는 디지털 아카이브",
    openGraph: {
      title: "MCM Momente",
      description: "전시의 순간을 기록하고 취향을 발견하는 디지털 아카이브",
      type: "website",
      images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: "MCM Momente" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "MCM Momente",
      description: "전시의 순간을 기록하고 취향을 발견하는 디지털 아카이브",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
