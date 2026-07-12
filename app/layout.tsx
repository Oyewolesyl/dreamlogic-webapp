import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./styles.css";

export const metadata: Metadata = {
  title: "dream logic",
  description: "dream logic astrology workspace"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
