import type { Metadata } from "next";
import "./globals.css";

/** URL pública del sitio (obligatoria para Open Graph / WhatsApp / Facebook). */
function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "https://reservaciones.copantl.com";
}

const siteUrl = getSiteUrl();
/** Ruta fija del PNG en /public — no cambiar el nombre sin actualizar metadata. */
const OG_IMAGE_PATH = "/og-image.png";
const ogImageUrl = new URL(OG_IMAGE_PATH, siteUrl).href;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Copantl Reservaciones",
  description:
    "Reserva tu mesa en los restaurantes del Hotel Copantl en San Pedro Sula, Honduras.",
  openGraph: {
    title: "Copantl Reservaciones",
    description:
      "Reserva tu mesa en los restaurantes del Hotel Copantl en San Pedro Sula, Honduras.",
    url: siteUrl,
    siteName: "Copantl Reservaciones",
    images: [
      {
        url: ogImageUrl,
        secureUrl: ogImageUrl,
        width: 1200,
        height: 630,
        alt: "Copantl Reservaciones — Hotel Copantl",
      },
    ],
    locale: "es_HN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Copantl Reservaciones",
    description:
      "Reserva tu mesa en los restaurantes del Hotel Copantl en San Pedro Sula, Honduras.",
    images: [ogImageUrl],
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
