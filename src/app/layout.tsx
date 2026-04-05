import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Permit Tracer — Building Permit Leads for Contractors",
    template: "%s | Permit Tracer",
  },
  description: "Turn building permits into sales leads. Get homeowner phone numbers, emails, and addresses the moment a permit is filed. HVAC, roofing, solar, electrical, plumbing. Free trial.",
  keywords: ["building permits", "permit leads", "contractor leads", "HVAC leads", "roofing leads", "solar leads", "electrical leads", "plumbing leads", "skip trace", "door knocking app", "permit data", "construction permits", "home improvement leads", "Permit Tracer", "permittracer"],
  authors: [{ name: "Permit Tracer" }],
  creator: "Permit Tracer",
  publisher: "Permit Tracer",
  metadataBase: new URL("https://permittracer.com"),
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://permittracer.com",
    siteName: "Permit Tracer",
    title: "Permit Tracer — Building Permit Leads for Contractors",
    description: "Every new permit is a door you should knock. Get homeowner names, phone numbers, and emails from building permit data. HVAC, roofing, solar, electrical, plumbing.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Permit Tracer - Building Permit Leads" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Permit Tracer — Building Permit Leads for Contractors",
    description: "Turn building permits into sales leads. Get homeowner phone numbers the moment a permit is filed.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 },
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico", sizes: "32x32" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: { capable: true, title: "Permit Tracer", statusBarStyle: "default" },
  other: { "mobile-web-app-capable": "yes" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F7F6F2] text-[#1D1D1F]">{children}</body>
    </html>
  );
}
