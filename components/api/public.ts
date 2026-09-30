import type { PortfolioData } from "@/interfaces/Portfolio";
import { apiClient } from "./client";

export interface PublicPortfolioResponse extends PortfolioData {
  contact: string;
  cv: string;
  socials: Array<{
    id: string;
    name: string;
    url: string;
    iconSvg: string;
  }>;
}

type PublicPortfolioCache = {
  data: PublicPortfolioResponse;
  expiresAt: number;
};

const CLIENT_CACHE_TTL = 5 * 60 * 1000;
let cache: PublicPortfolioCache | null = null;
let inFlight: Promise<PublicPortfolioResponse> | null = null;

export function getPublicPortfolioSnapshot() {
  return cache?.data ?? null;
}

async function refreshPublicPortfolio() {
  if (inFlight) return inFlight;

  inFlight = apiClient
    .get<PublicPortfolioResponse>("/api/public/portfolio")
    .then((response) => {
      cache = {
        data: response.data,
        expiresAt: Date.now() + CLIENT_CACHE_TTL,
      };
      return response.data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export async function getPublicPortfolio() {
  if (!cache) return refreshPublicPortfolio();

  if (Date.now() < cache.expiresAt) {
    return cache.data;
  }

  // Keep stale content visible while refreshing in the background.
  void refreshPublicPortfolio();
  return cache.data;
}
