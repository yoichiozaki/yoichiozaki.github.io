import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Notes from Yoichi Ozaki",
    template: "%s | Notes from Yoichi Ozaki",
  },
  description:
    "Yoichi Ozaki's personal blog and portfolio — technology, learnings, and daily reflections.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
