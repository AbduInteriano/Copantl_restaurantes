/**
 * Logos del hero: coloca los archivos en web/public/logos/
 * Nombres esperados (PNG, JPG o WebP):
 *   - la-churrasqueria.*
 *   - la-posada.*
 *   - cbari.*
 */
export const RESTAURANT_LOGO_FILES = [
  { baseName: "la-churrasqueria", alt: "La Churrasqueria" },
  { baseName: "la-posada", alt: "La Posada" },
  { baseName: "cbari", alt: "Cbari" },
] as const;

const EXTENSIONS = [".png", ".webp", ".jpg", ".jpeg", ".svg"] as const;

export function getRestaurantLogoPaths() {
  return RESTAURANT_LOGO_FILES.map(({ baseName, alt }) => {
    const src = EXTENSIONS.map((ext) => `/logos/${baseName}${ext}`).join("|");
    return {
      alt,
      /** Rutas a probar en el cliente; el componente usa la primera existente vía img onError o lista fija */
      candidates: EXTENSIONS.map((ext) => `/logos/${baseName}${ext}`),
      defaultSrc: `/logos/${baseName}.png`,
    };
  });
}
