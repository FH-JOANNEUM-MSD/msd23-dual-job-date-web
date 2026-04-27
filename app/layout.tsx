import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const brandSans = localFont({
  src: [
    { path: "./fonts/Parka_Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/Parka_Medium.otf", weight: "500", style: "normal" },
    { path: "./fonts/Parka_Bold.otf", weight: "700", style: "normal" },
  ],
  display: "swap",
});

export const metadata: Metadata = {
  icons: {
    icon: [
      { url: "/IIT_RGB.png", type: "image/png" },
      { url: "/Informatik_Green.svg", type: "image/svg+xml" },
    ],
    apple: "/IIT_RGB.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className={brandSans.className}>{children}</body>
    </html>
  );
}