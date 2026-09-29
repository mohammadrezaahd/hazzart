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

export async function getPublicPortfolio() {
  const response = await apiClient.get<PublicPortfolioResponse>("/api/public/portfolio", {
    params: { _: Date.now() },
  });
  return response.data;
}
