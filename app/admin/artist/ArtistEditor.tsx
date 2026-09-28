"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
type ArtistTab = "cv" | "contact" | "social";

import type {
  ArtistAdminPayload,
  ArtistContactSocial,
  ArtistSocialPlatform,
} from "@/interfaces/Artist";

const navigation = [
  { label: "Overview", href: "/admin", icon: "grid" },
  { label: "Categories", href: "/admin/categories", icon: "layers" },
  { label: "Paintings", href: "/admin/paintings", icon: "image" },
  { label: "Projects", href: null, icon: "folder" },
  { label: "Artist", href: "/admin/artist", icon: "user" },
  { label: "Statistics", href: null, icon: "chart" },
] as const;

function NavIcon({ type }: { type: (typeof navigation)[number]["icon"] }) {
  if (type === "grid") {
    return (
      <span className="admin-nav-icon admin-nav-icon--grid" aria-hidden="true">
        <i /><i /><i /><i />
      </span>
    );
  }

  const paths: Record<Exclude<typeof type, "grid">, string> = {
    layers: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8L12 15l7.5-4M4.5 14 12 18l7.5-4M4.5 17 12 21l7.5-4",
    image: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM7.5 16l3-3 2 2 2.5-3 2.5 4H7.5ZM15.5 8.5h.01",
    folder: "M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-15v-13.5Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    chart: "M4 19V9m6 10V5m6 14v-7m4 7V3",
  };

  return (
    <span className="admin-nav-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d={paths[type]} />
      </svg>
    </span>
  );
}

function IconImage({ platform, className = "" }: { platform: ArtistSocialPlatform; className?: string }) {
  return (
    <span
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: platform.iconSvg }}
    />
  );
}

export default function ArtistEditor({ username }: { username: string }) {
  const [payload, setPayload] = useState<ArtistAdminPayload | null>(null);
  const [cvText, setCvText] = useState("");
  const [contactText, setContactText] = useState("");
  const [selected, setSelected] = useState<ArtistContactSocial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ArtistTab>("cv");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [socialName, setSocialName] = useState("");
  const [socialUrl, setSocialUrl] = useState("");
  const [socialFile, setSocialFile] = useState<File | null>(null);
  const [addingSocial, setAddingSocial] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function loadArtist() {
    setLoading(true);
    setError("");

    try {
      const data = await getAdminArtist();
      setPayload(data);
      setCvText(data.content.cvText);
      setContactText(data.content.contactText);
      setSelected(data.content.socials);
    } catch (err) {
      const text = getApiErrorMessage(err, "Could not load artist content.");
      setError(text);
      setToast({ type: "error", text });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadArtist();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.platformId)),
    [selected],
  );

  const selectedPlatforms = useMemo(() => {
    if (!payload) return [];

    return selected
      .map((item) => ({
        item,
        platform: payload.socialPlatforms.find((platform) => platform.id === item.platformId),
      }))
      .filter(
        (item): item is { item: ArtistContactSocial; platform: ArtistSocialPlatform } =>
          Boolean(item.platform),
      );
  }, [payload, selected]);

  function togglePlatform(platform: ArtistSocialPlatform) {
    setMessage("");
    setError("");

    if (selectedIds.has(platform.id)) {
      setSelected((current) => current.filter((item) => item.platformId !== platform.id));
      return;
    }

    setSelected((current) => [
      ...current,
      {
        platformId: platform.id,
        url: platform.defaultUrl,
        order: current.length,
      },
    ]);
  }

  function updateSelectedUrl(platformId: string, url: string) {
    setSelected((current) =>
      current.map((item) =>
        item.platformId === platformId ? { ...item, url } : item,
      ),
    );
  }

  function moveSelected(index: number, direction: -1 | 1) {
    const target = index + direction;

    if (target < 0 || target >= selected.length) return;

    setSelected((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((item, order) => ({ ...item, order }));
    });
  }

  async function saveArtist() {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const content = await updateAdminArtist(
        cvText,
        contactText,
        selected.map((item, order) => ({
          platformId: item.platformId,
          url: item.url,
          order,
        })),
      );

      setSelected(content.socials);
      setMessage("Artist content saved.");
      setToast({ type: "success", text: "Artist content saved successfully." });
    } catch (err) {
      const text = getApiErrorMessage(err, "Could not save artist content.");
      setError(text);
      setToast({ type: "error", text });
    } finally {
      setSaving(false);
    }
  }

  async function addSocialPlatform(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!socialFile) {
      const text = "Choose an SVG icon first.";
      setError(text);
      setToast({ type: "error", text });
      return;
    }

    setAddingSocial(true);
    setMessage("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", socialName);
      formData.append("defaultUrl", socialUrl);
      formData.append("icon", socialFile);

      const platform = await createArtistSocialPlatform(formData);

      setPayload((current) =>
        current
          ? { ...current, socialPlatforms: [...current.socialPlatforms, platform] }
          : current,
      );
      setSocialName("");
      setSocialUrl("");
      setSocialFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setMessage("Social media added to the list.");
      setToast({ type: "success", text: "Social media added successfully." });
    } catch (err) {
      const text = getApiErrorMessage(err, "Could not add social media.");
      setError(text);
      setToast({ type: "error", text });
    } finally {
      setAddingSocial(false);
    }
  }

  async function deleteSocialPlatform(id: string) {
    if (!window.confirm("Delete this social media from the platform list?")) return;

    setMessage("");
    setError("");

    try {
      await deleteArtistSocialPlatform(id);

      setPayload((current) =>
        current
          ? {
              ...current,
              socialPlatforms: current.socialPlatforms.filter((platform) => platform.id !== id),
            }
          : current,
      );
      setSelected((current) => current.filter((item) => item.platformId !== id));
      setMessage("Social media removed.");
      setToast({ type: "success", text: "Social media removed." });
    } catch (err) {
      const text = getApiErrorMessage(err, "Could not delete social media.");
      setError(text);
      setToast({ type: "error", text });
    }
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div>
          <Link href="/" className="admin-sidebar-brand" aria-label="Back to Hazzart website">
            <span>HAZZART</span>
            <small>ARTIST PORTFOLIO</small>
          </Link>

          <div className="admin-sidebar-divider" />
          <p className="admin-sidebar-label">WORKSPACE</p>

          <nav className="admin-nav" aria-label="Admin navigation">
            {navigation.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`admin-nav-item ${item.label === "Artist" ? "is-active" : ""}`}
                >
                  <NavIcon type={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <span key={item.label} className="admin-nav-item is-disabled" aria-disabled="true">
                  <NavIcon type={item.icon} />
                  <span>{item.label}</span>
                  <small>SOON</small>
                </span>
              ),
            )}
          </nav>
        </div>

        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip">
            <span className="admin-user-avatar">{username.slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{username}</strong>
              <small>Administrator</small>
            </span>
          </div>
          <form action="/api/admin/auth/logout" method="post">
            <button type="submit" className="admin-logout">
              Log out <span aria-hidden="true">↗</span>
            </button>
          </form>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <Link href="/" className="admin-mobile-brand" aria-label="Back to Hazzart website">
            HAZZART
          </Link>
          <span className="admin-topbar-context">ADMIN / ARTIST</span>
          <Link href="/" className="admin-view-site">
            View website <span aria-hidden="true">↗</span>
          </Link>
        </header>

        <div className="admin-main admin-artist-main">
          <div className="admin-welcome">
            <div>
              <p className="admin-eyebrow">ARTIST</p>
              <h1>Artist content.</h1>
              <p>
                Manage the CV and contact information shown by the portfolio. Public pages stay static
                for now; this screen only prepares and stores the real content.
              </p>
            </div>
            <button className="admin-round-link" type="button" onClick={() => void loadArtist()} aria-label="Reload artist content">
              ↻
            </button>
          </div>

          {loading ? (
            <div className="admin-artist-skeleton" aria-label="Loading artist content">
              <div className="admin-skeleton-tabs"><span /><span /><span /></div>
              <div className="admin-skeleton-heading"><span /><span /></div>
              <div className="admin-skeleton-lines">
                <span /><span /><span /><span /><span /><span />
              </div>
            </div>
          ) : (
            <>
              <div className="admin-artist-tabs" role="tablist" aria-label="Artist sections">
                <button type="button" role="tab" aria-selected={activeTab === "cv"} className={activeTab === "cv" ? "is-active" : ""} onClick={() => setActiveTab("cv")}>
                  <span>01</span> CV
                </button>
                <button type="button" role="tab" aria-selected={activeTab === "contact"} className={activeTab === "contact" ? "is-active" : ""} onClick={() => setActiveTab("contact")}>
                  <span>02</span> Contact
                </button>
                <button type="button" role="tab" aria-selected={activeTab === "social"} className={activeTab === "social" ? "is-active" : ""} onClick={() => setActiveTab("social")}>
                  <span>03</span> Social Media
                </button>
              </div>

              {activeTab === "cv" && (
                <section className="admin-artist-section admin-artist-tab-panel">
                  <div className="admin-artist-section-heading">
                    <div>
                      <p className="admin-card-kicker">01 / CV</p>
                      <h2>Artist CV</h2>
                    </div>
                    <span>Plain text · ready for rich content later</span>
                  </div>
                  <textarea
                    className="admin-artist-textarea"
                    value={cvText}
                    onChange={(event) => setCvText(event.target.value)}
                    placeholder="Write the artist CV here…"
                  />
                </section>
              )}

              {activeTab === "contact" && (
                <section className="admin-artist-section admin-artist-tab-panel">
                  <div className="admin-artist-section-heading">
                    <div>
                      <p className="admin-card-kicker">02 / CONTACT</p>
                      <h2>Contact text</h2>
                    </div>
                    <span>The copy for the Contact page</span>
                  </div>
                  <textarea
                    className="admin-artist-textarea admin-artist-textarea--contact"
                    value={contactText}
                    onChange={(event) => setContactText(event.target.value)}
                    placeholder="Write the contact text here…"
                  />
                </section>
              )}

              {activeTab === "social" && (
                <>
                  <section className="admin-artist-section admin-artist-tab-panel">
                    <div className="admin-artist-section-heading">
                      <div>
                        <p className="admin-card-kicker">03 / SOCIAL MEDIA</p>
                        <h2>Choose what appears on Contact</h2>
                      </div>
                      <span>{selected.length} selected</span>
                    </div>

                    <div className="admin-social-platforms">
                      {(payload?.socialPlatforms ?? []).map((platform) => {
                        const active = selectedIds.has(platform.id);
                        return (
                          <button type="button" key={platform.id} className={`admin-social-platform ${active ? "is-selected" : ""}`} onClick={() => togglePlatform(platform)} aria-pressed={active}>
                            <IconImage platform={platform} className="admin-social-platform__icon" />
                            <span>{platform.name}</span>
                            <i>{active ? "SELECTED" : "SELECT"}</i>
                          </button>
                        );
                      })}
                      {!payload?.socialPlatforms.length && (
                        <p className="admin-artist-empty">No social media platforms have been added yet.</p>
                      )}
                    </div>

                    <div className="admin-selected-socials">
                      <div className="admin-selected-socials__heading">
                        <strong>Selected order</strong>
                        <span>These are the items that will be published.</span>
                      </div>
                      {selectedPlatforms.map(({ item, platform }, index) => (
                        <div className="admin-selected-social" key={platform.id}>
                          <div className="admin-selected-social__identity">
                            <span className="admin-selected-social__order">{String(index + 1).padStart(2, "0")}</span>
                            <IconImage platform={platform} className="admin-selected-social__icon" />
                            <strong>{platform.name}</strong>
                          </div>
                          <input className="admin-artist-input" value={item.url} onChange={(event) => updateSelectedUrl(platform.id, event.target.value)} placeholder="https://…" aria-label={`${platform.name} URL`} />
                          <div className="admin-selected-social__actions">
                            <button type="button" onClick={() => moveSelected(index, -1)} disabled={index === 0} aria-label={`Move ${platform.name} up`}>↑</button>
                            <button type="button" onClick={() => moveSelected(index, 1)} disabled={index === selectedPlatforms.length - 1} aria-label={`Move ${platform.name} down`}>↓</button>
                            <button type="button" onClick={() => togglePlatform(platform)} aria-label={`Remove ${platform.name}`}>×</button>
                          </div>
                        </div>
                      ))}
                      {!selectedPlatforms.length && (
                        <p className="admin-artist-empty">Select a platform above to add it to the Contact page.</p>
                      )}
                    </div>
                  </section>

                  <section className="admin-artist-section admin-artist-section--add">
                    <div className="admin-artist-section-heading">
                      <div>
                        <p className="admin-card-kicker">04 / PLATFORM LIST</p>
                        <h2>Add a social media</h2>
                      </div>
                      <span>SVG icons only · max 100 KB</span>
                    </div>

                    <form className="admin-social-add-form" onSubmit={addSocialPlatform}>
                      <label className="admin-field">
                        <span>App name</span>
                        <input className="admin-artist-input" value={socialName} onChange={(event) => setSocialName(event.target.value)} placeholder="Instagram" maxLength={80} required />
                      </label>
                      <label className="admin-field">
                        <span>Default profile URL</span>
                        <input className="admin-artist-input" value={socialUrl} onChange={(event) => setSocialUrl(event.target.value)} placeholder="https://instagram.com/…" type="url" required />
                      </label>
                      <label className="admin-svg-upload">
                        <input ref={fileInputRef} type="file" accept=".svg,image/svg+xml" onChange={(event) => setSocialFile(event.target.files?.[0] ?? null)} required />
                        <strong>{socialFile ? socialFile.name : "Choose SVG icon"}</strong>
                        <span>{socialFile ? "Ready to upload" : "Only .svg files are accepted"}</span>
                      </label>
                      <button className="admin-artist-add-button" type="submit" disabled={addingSocial}>
                        {addingSocial ? "Adding…" : "Add to list"} <span>+</span>
                      </button>
                    </form>

                    {!!payload?.socialPlatforms.length && (
                      <div className="admin-platform-list">
                        {payload.socialPlatforms.map((platform) => (
                          <div className="admin-platform-row" key={platform.id}>
                            <IconImage platform={platform} className="admin-platform-row__icon" />
                            <strong>{platform.name}</strong>
                            <span>{platform.defaultUrl}</span>
                            <button type="button" onClick={() => void deleteSocialPlatform(platform.id)}>Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}

              <div className="admin-artist-savebar">
                <div>
                  {error && <p className="admin-server-error">{error}</p>}
                  {!error && message && <p className="admin-artist-success">{message}</p>}
                </div>
                <button className="admin-submit admin-artist-save" type="button" onClick={() => void saveArtist()} disabled={saving}>
                  {saving ? "Saving…" : "Save artist content"} <span>↗</span>
                </button>
              </div>
            </>
          )}

          {toast && (
            <div className={`admin-artist-toast admin-artist-toast--${toast.type}`} role="status">
              <span>{toast.type === "success" ? "✓" : "!"}</span>
              <p>{toast.text}</p>
              <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
