import type { Metadata } from "next";
import { Geist, Geist_Mono, DM_Serif_Display } from "next/font/google";
import { NoiseTexture } from "@/components/NoiseTexture";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const dmSerifDisplay = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TOY - Thinking Of You",
  description: "Video greeting cards that bring people together. Create and share heartfelt video messages with friends and family.",
  openGraph: {
    title: "TOY - Thinking Of You",
    description: "Video greeting cards that bring people together",
    siteName: "TOY",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${dmSerifDisplay.variable} antialiased`}
      >
        <NoiseTexture />
        {children}
      </body>
    </html>
  );
}
