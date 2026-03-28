import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Yoichi Ozaki",
    template: "%s | Yoichi Ozaki",
  },
  description:
    "Yoichi Ozaki's personal blog and portfolio — technology, learnings, and daily reflections.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
