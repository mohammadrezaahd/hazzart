"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminCategory } from "@/interfaces/Category";
import type { AdminPainting } from "@/interfaces/Painting";
import { getAdminCategories } from "@/components/api/categories";
import { createAdminPainting, deleteAdminPainting, getAdminPaintings, updateAdminPainting } from "@/components/api/paintings";
import { getApiErrorMessage } from "@/components/api/client";

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
    return <span className="admin-nav-icon admin-nav-icon--grid" aria-hidden="true"><i /><i /><i /><i /></span>;
  }

  const paths: Record<Exclude<typeof type, "grid">, string> = {
    layers: "M12 3 3 8l9 5 9-5-9-5Zm-7.5 8L12 15l7.5-4M4.5 14 12 18l7.5-4M4.5 17 12 21l7.5-4",
    image: "M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13ZM7.5 16l3-3 2 2 2.5-3 2.5 4H7.5ZM15.5 8.5h.01",
    folder: "M3.5 6.5h6l2 2h9v9.5a2 2 0 0 1-2 2h-15v-13.5Z",
    user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    chart: "M4 19V9m6 10V5m6 14v-7m4 7V3",
  };

  return <span className="admin-nav-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d={paths[type]} /></svg></span>;
}

interface PaintingFormState {
  name: string;
  description: string;
  completedDate: string;
  categoryIds: string[];
  image1: File | null;
  image2: File | null;
}

const emptyForm: PaintingFormState = { name: "", description: "", completedDate: "", categoryIds: [], image1: null, image2: null };

function ImagePicker({ label, file, existingUrl, onChange }: {
  label: string;
  file: File | null;
  existingUrl?: string;
  onChange: (file: File | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div className="admin-painting-image-field">
      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onChange(event.target.files?.[0] ?? null)} />
      <button type="button" className="admin-painting-image-picker" onClick={() => inputRef.current?.click()}>
        {preview ? <img src={preview} alt="" /> : existingUrl ? <img src={existingUrl} alt="" /> : <span className="admin-painting-image-placeholder">+</span>}
        <span><strong>{label}</strong><small>{file?.name ?? (existingUrl ? "Keep current image" : "JPG · PNG · WebP · max 10 MB")}</small></span>
      </button>
    </div>
  );
}

export default function AdminPaintingsPage() {
  const [paintings, setPaintings] = useState<AdminPainting[]>([]);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: "", categoryId: "", from: "", to: "" });
  const [form, setForm] = useState<PaintingFormState>(emptyForm);
  const [editing, setEditing] = useState<AdminPainting | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.id, category.name])), [categories]);
  const parents = useMemo(() => categories.filter((category) => category.parentId === null), [categories]);
  const childrenByParent = useMemo(() => {
    const map = new Map<string, AdminCategory[]>();
    categories.filter((category) => category.parentId).forEach((category) => {
      const current = map.get(category.parentId!) ?? [];
      current.push(category);
      map.set(category.parentId!, current);
    });
    return map;
  }, [categories]);

  async function loadData(nextFilters = filters) {
    setLoading(true);
    try {
      const [paintingPayload, categoryData] = await Promise.all([
        getAdminPaintings({
          search: nextFilters.search || undefined,
          categoryId: nextFilters.categoryId || undefined,
          from: nextFilters.from || undefined,
          to: nextFilters.to || undefined,
        }),
        categories.length ? Promise.resolve(categories) : getAdminCategories(),
      ]);
      setPaintings(paintingPayload.paintings);
      if (!categories.length) setCategories(categoryData);
    } catch (error) {
      setToast({ type: "error", text: getApiErrorMessage(error, "Could not load paintings.") });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(filters); }, 300);
    return () => window.clearTimeout(timer);
  }, [filters.search, filters.categoryId, filters.from, filters.to]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function resetForm() {
    setEditing(null);
    setForm(emptyForm);
  }

  function startEdit(painting: AdminPainting) {
    setEditing(painting);
    setForm({ name: painting.name, description: painting.description, completedDate: painting.completedDate, categoryIds: painting.categoryIds, image1: null, image2: null });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCategory(id: string) {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id) ? current.categoryIds.filter((categoryId) => categoryId !== id) : [...current.categoryIds, id],
    }));
  }

  async function submitPainting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name.trim() || !form.completedDate.trim() || !form.categoryIds.length) {
      setToast({ type: "error", text: "Name, date and at least one category are required." });
      return;
    }
    if (!editing && (!form.image1 || !form.image2)) {
      setToast({ type: "error", text: "Choose both painting images." });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateAdminPainting(editing.id, form);
        setPaintings((current) => current.map((painting) => painting.id === updated.id ? updated : painting));
        setToast({ type: "success", text: "Painting updated successfully." });
      } else {
        const created = await createAdminPainting({
          name: form.name,
          description: form.description,
          completedDate: form.completedDate,
          categoryIds: form.categoryIds,
          image1: form.image1!,
          image2: form.image2!,
        });
        setPaintings((current) => [created, ...current]);
        setToast({ type: "success", text: "Painting added successfully." });
      }
      resetForm();
    } catch (error) {
      setToast({ type: "error", text: getApiErrorMessage(error, "Could not save painting.") });
    } finally {
      setSaving(false);
    }
  }

  async function removePainting(id: string) {
    if (!window.confirm("Delete this painting?")) return;
    setSaving(true);
    try {
      await deleteAdminPainting(id);
      setPaintings((current) => current.filter((painting) => painting.id !== id));
      if (editing?.id === id) resetForm();
      setToast({ type: "success", text: "Painting deleted." });
    } catch (error) {
      setToast({ type: "error", text: getApiErrorMessage(error, "Could not delete painting.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div>
          <Link href="/" className="admin-sidebar-brand" aria-label="Back to Hazzart website"><span>HAZZART</span><small>ARTIST PORTFOLIO</small></Link>
          <div className="admin-sidebar-divider" />
          <p className="admin-sidebar-label">WORKSPACE</p>
          <nav className="admin-nav" aria-label="Admin navigation">
            {navigation.map((item) => item.href ? (
              <Link key={item.label} href={item.href} className={`admin-nav-item ${item.label === "Paintings" ? "is-active" : ""}`}><NavIcon type={item.icon} /><span>{item.label}</span></Link>
            ) : (
              <span key={item.label} className="admin-nav-item is-disabled" aria-disabled="true"><NavIcon type={item.icon} /><span>{item.label}</span><small>SOON</small></span>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip"><span className="admin-user-avatar">A</span><span><strong>Administrator</strong><small>Administrator</small></span></div>
          <form action="/api/admin/auth/logout" method="post"><button type="submit" className="admin-logout">Log out <span>↗</span></button></form>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar"><Link href="/" className="admin-mobile-brand">HAZZART</Link><span className="admin-topbar-context">ADMIN / PAINTINGS</span><Link href="/" className="admin-view-site">View website <span>↗</span></Link></header>

        <div className="admin-main admin-paintings-main">
          <div className="admin-welcome">
            <div><p className="admin-eyebrow">PAINTINGS</p><h1>Build the collection.</h1><p>Add two images, assign as many categories as needed, and keep the completed date in YYYY/MM/DD format.</p></div>
            <button className="admin-round-link" type="button" onClick={() => void loadData()} aria-label="Reload paintings">↻</button>
          </div>

          <form className="admin-painting-form" onSubmit={submitPainting}>
            <div className="admin-painting-form-heading"><div><p className="admin-card-kicker">{editing ? "EDIT PAINTING" : "NEW PAINTING"}</p><h2>{editing ? editing.name : "Add a painting"}</h2></div>{editing && <button type="button" className="admin-painting-cancel" onClick={resetForm}>Cancel edit</button>}</div>

            <div className="admin-painting-form-grid">
              <label className="admin-field"><span>Name</span><input value={form.name} maxLength={150} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Painting name" /></label>
              <label className="admin-field"><span>Completed date</span><input value={form.completedDate} maxLength={10} onChange={(event) => setForm({ ...form, completedDate: event.target.value })} placeholder="YYYY/MM/DD" inputMode="numeric" /></label>
              <label className="admin-field admin-painting-description"><span>Description</span><textarea value={form.description} maxLength={5000} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the work…" /></label>
            </div>

            <div className="admin-painting-images">
              <div className="admin-painting-section-title"><p className="admin-card-kicker">IMAGES</p><span>2 images required</span></div>
              <div className="admin-painting-image-grid">
                <ImagePicker label="Image 01" file={form.image1} existingUrl={editing?.images[0].url} onChange={(file) => setForm({ ...form, image1: file })} />
                <ImagePicker label="Image 02" file={form.image2} existingUrl={editing?.images[1].url} onChange={(file) => setForm({ ...form, image2: file })} />
              </div>
            </div>

            <div className="admin-painting-categories">
              <div className="admin-painting-section-title"><p className="admin-card-kicker">CATEGORIES</p><span>{form.categoryIds.length} selected</span></div>
              {!parents.length ? <p className="admin-artist-empty">Create categories first.</p> : (
                <div className="admin-painting-category-grid">
                  {parents.map((parent) => (
                    <div className="admin-painting-category-group" key={parent.id}>
                      <label><input type="checkbox" checked={form.categoryIds.includes(parent.id)} onChange={() => toggleCategory(parent.id)} /><span>{parent.name}</span></label>
                      {(childrenByParent.get(parent.id) ?? []).map((child) => <label key={child.id} className="is-child"><input type="checkbox" checked={form.categoryIds.includes(child.id)} onChange={() => toggleCategory(child.id)} /><span>{child.name}</span></label>)}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="admin-painting-form-actions"><button className="admin-submit" type="submit" disabled={saving || !categories.length}>{saving ? "Saving…" : editing ? "Save painting" : "Add painting"} <span>↗</span></button></div>
          </form>

          <section className="admin-painting-library">
            <div className="admin-painting-library-heading"><div><p className="admin-card-kicker">COLLECTION</p><h2>Paintings</h2></div><span>{paintings.length} results</span></div>

            <div className="admin-painting-filters">
              <label className="admin-painting-search"><span>SEARCH</span><input value={filters.search} onChange={(event) => setFilters({ ...filters, search: event.target.value })} placeholder="Search by name…" /></label>
              <label><span>CATEGORY</span><select value={filters.categoryId} onChange={(event) => setFilters({ ...filters, categoryId: event.target.value })}><option value="">All categories</option>{parents.map((parent) => <optgroup label={parent.name} key={parent.id}><option value={parent.id}>{parent.name}</option>{(childrenByParent.get(parent.id) ?? []).map((child) => <option value={child.id} key={child.id}>{child.name}</option>)}</optgroup>)}</select></label>
              <label><span>FROM</span><input value={filters.from} maxLength={10} onChange={(event) => setFilters({ ...filters, from: event.target.value })} placeholder="YYYY/MM/DD" inputMode="numeric" /></label>
              <label><span>TO</span><input value={filters.to} maxLength={10} onChange={(event) => setFilters({ ...filters, to: event.target.value })} placeholder="YYYY/MM/DD" inputMode="numeric" /></label>
            </div>

            {loading ? <div className="admin-painting-skeleton"><span /><span /><span /></div> : !paintings.length ? <div className="admin-category-empty">No paintings match the current filters.</div> : (
              <div className="admin-painting-grid">
                {paintings.map((painting) => (
                  <article className="admin-painting-card" key={painting.id}>
                    <div className="admin-painting-card-images"><img src={painting.images[0].url} alt="" /><img src={painting.images[1].url} alt="" /></div>
                    <div className="admin-painting-card-body">
                      <div className="admin-painting-card-top"><div><h3>{painting.name}</h3><span>{painting.completedDate}</span></div><span>{painting.categoryIds.length} cat.</span></div>
                      {painting.description && <p>{painting.description}</p>}
                      <div className="admin-painting-tags">{painting.categoryIds.map((id) => <span key={id}>{categoryMap.get(id) ?? "Unknown"}</span>)}</div>
                      <div className="admin-painting-card-actions"><button type="button" onClick={() => startEdit(painting)}>Edit</button><button type="button" onClick={() => void removePainting(painting.id)} disabled={saving}>Delete</button></div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {toast && <div className={`admin-category-toast admin-category-toast--${toast.type}`} role="status"><span>{toast.type === "success" ? "✓" : "!"}</span><p>{toast.text}</p><button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button></div>}
        </div>
      </section>
    </main>
  );
}
