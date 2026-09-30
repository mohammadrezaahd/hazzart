import { unstable_cache } from "next/cache";
import { getPublicPortfolio } from "@/lib/public-portfolio";

export const PUBLIC_PORTFOLIO_CACHE_TAG = "public-portfolio";
export const PUBLIC_PORTFOLIO_REVALIDATE_SECONDS = 300;

export const getCachedPublicPortfolio = unstable_cache(
  async () => getPublicPortfolio(),
  [PUBLIC_PORTFOLIO_CACHE_TAG],
  {
    revalidate: PUBLIC_PORTFOLIO_REVALIDATE_SECONDS,
    tags: [PUBLIC_PORTFOLIO_CACHE_TAG],
  },
);
