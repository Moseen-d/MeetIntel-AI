import type { Metadata } from "next";
import { Inter, Space_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MeetIntel AI — Walk Into Every Meeting Prepared",
  description: "Transform the latest company developments into actionable meeting intelligence with your AI-powered research assistant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${sourceSerif.variable} scroll-smooth antialiased`}
    >
      <body className="min-h-screen bg-[#FFFFFF] text-[#111111] selection:bg-[#FDF2FA] selection:text-[#E83FCB]">
        {children}
      </body>
    </html>
  );
}
