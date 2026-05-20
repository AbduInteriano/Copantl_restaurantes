import type { Metadata } from "next";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://reservaciones.copantl.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Copantl Reservaciones",
  description:
    "Reserva tu mesa en los restaurantes del Hotel Copantl en San Pedro Sula, Honduras.",
  openGraph: {
    title: "Copantl Reservaciones",
    description: "Reserva tu mesa en los restaurantes del Hotel Copantl en San Pedro Sula, Honduras.",
    url: siteUrl,
    siteName: "Copantl Reservaciones",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Copantl Reservaciones",
        type: "image/png",
      },
    ],
    locale: "es_HN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Copantl Reservaciones",
    description: "Reserva tu mesa en los restaurantes del Hotel Copantl en San Pedro Sula, Honduras.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
