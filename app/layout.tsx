import type { Metadata } from "next";
import { Cardo, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cardo = Cardo({
  variable: "--font-cardo",
  subsets: ["latin"],
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "CAVA - Drinks Experience",
  description:
    "CAVA es una experiencia premium de vino, destilados y tabaco en San Pedro Sula, Honduras.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${cardo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
