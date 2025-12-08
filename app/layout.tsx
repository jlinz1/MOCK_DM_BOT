import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mock DM Chat",
  description: "Chat application with OpenAI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

