import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Git Exposed — Your commits. Our judgement.",
  description: "A playful Hall of Shame for your Git history, ready for your README.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className="dark" data-scroll-behavior="smooth" suppressHydrationWarning><body>{children}</body></html>;
}
