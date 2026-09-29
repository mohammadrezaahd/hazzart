"use client";

import { useAdminStorage } from "@/components/hooks/useAdminStorage";

function percent(used: number, limit: number) {
  if (!limit) return 0;
  return Math.min((used / limit) * 100, 100);
}

function StorageBar({ label, usedBytes, limitBytes, reserveBytes, formatBytes }: {
  label: string; usedBytes: number; limitBytes: number; reserveBytes: number; formatBytes: (bytes: number) => string;
}) {
  const used = percent(usedBytes, limitBytes);
  const reserve = percent(reserveBytes, limitBytes);
  const isWarning = usedBytes >= limitBytes - reserveBytes;
  return (
    <article className="admin-storage-card">
      <div className="admin-storage-card-head">
        <div><span className="admin-card-kicker">{label}</span><strong>{formatBytes(usedBytes)} <small>/ {formatBytes(limitBytes)}</small></strong></div>
        <span className={isWarning ? "admin-storage-status is-warning" : "admin-storage-status"}>{isWarning ? "NEAR LIMIT" : `${Math.round(used)}% USED`}</span>
      </div>
      <div className="admin-storage-bar" aria-label={`${label}: ${Math.round(used)} percent used`}>
        <span className="admin-storage-used" style={{ width: `${used}%` }} />
        {reserveBytes > 0 && <span className="admin-storage-reserve" style={{ left: `${Math.max(used, 100 - reserve)}%`, width: `${reserve}%` }} />}
      </div>
      <div className="admin-storage-meta">
        <span>{formatBytes(Math.max(limitBytes - reserveBytes - usedBytes, 0))} available</span>
        {reserveBytes > 0 && <span className="admin-storage-reserve-label">15 MB safety reserve</span>}
      </div>
    </article>
  );
}

export default function AdminStorageOverview() {
  const { storage, loading, error, formatBytes } = useAdminStorage();
  if (loading && !storage) return <div className="admin-storage-grid"><div className="admin-storage-card admin-storage-card--loading" /><div className="admin-storage-card admin-storage-card--loading" /></div>;
  if (error || !storage) return <div className="admin-storage-error">Storage usage could not be loaded. {error}</div>;
  return (
    <section className="admin-storage-section">
      <div className="admin-storage-heading"><div><p className="admin-card-kicker">STORAGE</p><h2>Space at a glance.</h2></div><span>Updated automatically</span></div>
      <div className="admin-storage-grid">
        <StorageBar label="MONGODB" {...storage.mongodb} formatBytes={formatBytes} />
        <StorageBar label="VERCEL BLOB" {...storage.blob} formatBytes={formatBytes} />
      </div>
    </section>
  );
}
