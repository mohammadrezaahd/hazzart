"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { AdminStorage } from "@/interfaces/Storage";
import { getAdminStorage } from "@/components/api/storage";
import { getApiErrorMessage } from "@/components/api/client";

const REFRESH_INTERVAL = 30_000;

function formatBytes(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(0, bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function useAdminStorage() {
  const [storage, setStorage] = useState<AdminStorage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const next = await getAdminStorage();
      setStorage(next);
      return next;
    } catch (cause) {
      setError(getApiErrorMessage(cause, "Could not load storage usage."));
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => void refresh(), REFRESH_INTERVAL);
    return () => window.clearInterval(interval);
  }, [refresh]);

  const result = useMemo(() => {
    const checkMongo = (bytes: number) => Boolean(storage && bytes <= storage.mongodb.availableBytes);
    const checkBlob = (bytes: number) => Boolean(storage && bytes <= storage.blob.availableBytes);

    return {
      storage,
      loading,
      error,
      refresh,
      checkMongo,
      checkBlob,
      mongoAvailableBytes: storage?.mongodb.availableBytes ?? 0,
      blobAvailableBytes: storage?.blob.availableBytes ?? 0,
      formatBytes,
    };
  }, [storage, loading, error, refresh]);

  return result;
}
