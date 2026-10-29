import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tales & Tinkers Studio",
  description: "Plan, create, review and manage content for Tales & Tinkers."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
