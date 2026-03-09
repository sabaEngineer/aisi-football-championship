import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { getSession } from "@/lib/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "AISI ფეხბურთის ჩემპიონატი",
  description: "ფეხბურთის ჩემპიონატის მართვა — გუნდები, მატჩები, მოთამაშეები და სხვა.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="ka">
      <body className={`${inter.variable} font-sans antialiased`}>
        <Navbar user={session} />
        <main className="mx-auto max-w-7xl px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
