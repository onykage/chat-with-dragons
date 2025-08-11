export const metadata = { title: "Discord Dungeon - Viewer" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: "#0b0b10", color: "#d7d7d7", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace" }}>
        <div style={{ maxWidth: 1000, margin: "20px auto", padding: 16 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
