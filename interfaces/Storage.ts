export interface StorageBucket {
  usedBytes: number;
  limitBytes: number;
  reserveBytes: number;
  availableBytes: number;
}

export interface AdminStorage {
  mongodb: StorageBucket;
  blob: StorageBucket;
  updatedAt: string;
}
