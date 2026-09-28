export interface ArtistSocialPlatform {
  id: string;
  name: string;
  iconSvg: string;
  defaultUrl: string;
  createdAt: string;
}

export interface ArtistContactSocial {
  platformId: string;
  url: string;
  order: number;
}

export interface ArtistContent {
  cvText: string;
  contactText: string;
  socials: ArtistContactSocial[];
}

export interface ArtistAdminPayload {
  content: ArtistContent;
  socialPlatforms: ArtistSocialPlatform[];
}
