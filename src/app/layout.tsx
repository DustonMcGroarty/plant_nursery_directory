import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Find Plant Nurseries — US Plant Nursery Directory",
    template: "%s | Find Plant Nurseries",
  },
  description:
    "Find plant nurseries and garden centers near you. Search by location and specialty across the United States.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <div className="h-1 w-full bg-gradient-to-r from-primary-dark via-primary to-[#86e6b0]" />
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
