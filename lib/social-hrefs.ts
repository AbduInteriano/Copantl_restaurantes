export type SocialUrlsInput = {
  phone: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  whatsappUrl?: string | null;
};

export type ResolvedSocialHrefs = {
  instagramHref: string | null;
  facebookHref: string | null;
  tiktokHref: string | null;
  whatsappHref: string | null;
};

function normalizeUrl(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function resolveSocialHrefs(input: SocialUrlsInput): ResolvedSocialHrefs {
  const whatsappFromConfig = normalizeUrl(input.whatsappUrl);
  const whatsappNumber = input.phone.replace(/[^\d]/g, "");

  return {
    instagramHref: normalizeUrl(input.instagramUrl),
    facebookHref: normalizeUrl(input.facebookUrl),
    tiktokHref: normalizeUrl(input.tiktokUrl),
    whatsappHref: whatsappFromConfig ?? (whatsappNumber ? `https://wa.me/${whatsappNumber}` : null),
  };
}
