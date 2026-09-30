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

let cache: PublicPortfolioResponse | null = null;
let inFlight: Promise<PublicPortfolioResponse> | null = null;

export function getPublicPortfolioSnapshot() {
  return cache;
}

async function refreshPublicPortfolio() {
  if (inFlight) return inFlight;

  inFlight = apiClient
    .get<PublicPortfolioResponse>("/api/public/portfolio")
    .then((response) => {
      cache = response.data;
      return response.data;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export async function getPublicPortfolio() {
  if (!cache) return refreshPublicPortfolio();

  return refreshPublicPortfolio();
}
