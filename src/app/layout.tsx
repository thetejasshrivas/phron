import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

// Required root layout: https://nextjs.org/docs/app/getting-started/installation#create-the-app-directory
export const metadata: Metadata = {
  title: "PHRON — Money, in perspective",
  description: "A calmer way to think about everyday money. Coming soon.",
};
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="en-IN"><body>{children}</body></html>;
}
