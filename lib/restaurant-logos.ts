/**
 * Imagen unica del hero (rectangular, logos ya compuestos).
 * Coloca el archivo en web/public/logos/ con uno de estos nombres:
 *   restaurantes.png | logos-banner.png | hero-logos.png | logos.png
 * (tambien .jpg, .webp, .svg)
 */
const BANNER_BASE_NAMES = ["restaurantes", "logos-banner", "hero-logos", "logos"] as const;
const EXTENSIONS = [".png", ".webp", ".jpg", ".jpeg", ".svg"] as const;

export function getHeroBannerCandidates(): string[] {
  return BANNER_BASE_NAMES.flatMap((name) => EXTENSIONS.map((ext) => `/logos/${name}${ext}`));
}
