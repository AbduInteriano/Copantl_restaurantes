export type SocialUrlsInput = {
  phone: string;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  whatsappUrl?: string | null;
};

export type ResolvedSocialHrefs = {
  instagramHref: string;
  facebookHref: string;
  tiktokHref: string;
  whatsappHref: string;
};

export function resolveSocialHrefs(input: SocialUrlsInput): ResolvedSocialHrefs {
  const whatsappNumber = input.phone.replace(/[^\d]/g, "");
  return {
    whatsappHref: input.whatsappUrl || `https://wa.me/${whatsappNumber}`,
    instagramHref: input.instagramUrl || "https://www.instagram.com/cava.honduras/",
    facebookHref: input.facebookUrl || "https://www.facebook.com/Cavahonduras",
    tiktokHref: input.tiktokUrl || "https://www.tiktok.com/@cavadrinks",
  };
}
