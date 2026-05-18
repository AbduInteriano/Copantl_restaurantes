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
    instagramHref: input.instagramUrl || "#",
    facebookHref: input.facebookUrl || "#",
    tiktokHref: input.tiktokUrl || "#",
  };
}
