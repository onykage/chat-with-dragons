export const metadata = { title: "Discord Dungeon - Viewer" };

import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
// and add style tag like the zip’s layout, optional

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground">
        <div className="max-w-[1200px] mx-auto p-4">{children}</div>
      </body>
    </html>
  );
}
