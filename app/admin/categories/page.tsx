"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AdminCategory } from "@/interfaces/Category";
import { createAdminCategory, deleteAdminCategory, getAdminCategories, updateAdminCategory } from "@/components/api/categories";
import { getApiErrorMessage } from "@/components/api/client";
import { useAdminStorage } from "@/components/hooks/useAdminStorage";

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

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCategory, setNewCategory] = useState("");
  const [search, setSearch] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [subParentId, setSubParentId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const { loading: storageLoading, checkMongo, refresh: refreshStorage } = useAdminStorage();

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

  const filteredParents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return parents;

    return parents.filter((parent) => {
      if (parent.name.toLowerCase().includes(query)) return true;
      return (childrenByParent.get(parent.id) ?? []).some((child) => child.name.toLowerCase().includes(query));
    });
  }, [parents, childrenByParent, search]);

  const childrenForParent = (parentId: string) => {
    const children = childrenByParent.get(parentId) ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return children;
    const parent = parents.find((item) => item.id === parentId);
    if (parent?.name.toLowerCase().includes(query)) return children;
    return children.filter((child) => child.name.toLowerCase().includes(query));
  };

  async function loadCategories() {
    setLoading(true);
    try {
      setCategories(await getAdminCategories());
    } catch (error) {
      showToast("error", getApiErrorMessage(error, "Could not load categories."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCategories(); }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  function showToast(type: "success" | "error", text: string) {
    setToast({ type, text });
  }

  async function create(name: string, parentId: string | null) {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("error", parentId ? "Enter a subcategory name." : "Enter a category name.");
      return;
    }

    if (storageLoading) { showToast("error", "Checking available storage. Please try again in a moment."); return; }
    const estimate = new TextEncoder().encode(JSON.stringify({ name: trimmed, parentId })).length + 8 * 1024;
    if (!checkMongo(estimate)) { showToast("error", "There is not enough MongoDB space. The safety reserve is kept available to protect the site."); return; }

    setSaving(true);
    try {
      const category = await createAdminCategory(trimmed, parentId);
      setCategories((current) => [...current, category]);
      if (parentId) {
        setSubCategory("");
        setSubParentId(null);
      } else {
        setNewCategory("");
      }
      showToast("success", parentId ? "Subcategory added." : "Category added.");
      void refreshStorage();
    } catch (error) {
      showToast("error", getApiErrorMessage(error, "Could not create category."));
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      showToast("error", "Category name cannot be empty.");
      return;
    }

    if (storageLoading) { showToast("error", "Checking available storage. Please try again in a moment."); return; }
    const estimate = new TextEncoder().encode(JSON.stringify({ name: trimmed, id })).length + 8 * 1024;
    if (!checkMongo(estimate)) { showToast("error", "There is not enough MongoDB space. The safety reserve is kept available to protect the site."); return; }

    setSaving(true);
    try {
      const category = await updateAdminCategory(id, trimmed);
      setCategories((current) => current.map((item) => item.id === id ? category : item));
      setEditingId(null);
      setEditingName("");
      showToast("success", "Category updated.");
      void refreshStorage();
    } catch (error) {
      showToast("error", getApiErrorMessage(error, "Could not update category."));
    } finally {
      setSaving(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this category?")) return;

    setSaving(true);
    try {
      await deleteAdminCategory(id);
      setCategories((current) => current.filter((item) => item.id !== id));
      showToast("success", "Category deleted.");
    } catch (error) {
      showToast("error", getApiErrorMessage(error, "Could not delete category."));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(category: AdminCategory) {
    setEditingId(category.id);
    setEditingName(category.name);
  }

  return (
    <main className="admin-dashboard">
      <aside className="admin-sidebar">
        <div>
          <Link href="/" className="admin-sidebar-brand" aria-label="Back to Hazzart website">
            <span>HAZZART</span><small>ARTIST PORTFOLIO</small>
          </Link>
          <div className="admin-sidebar-divider" />
          <p className="admin-sidebar-label">WORKSPACE</p>
          <nav className="admin-nav" aria-label="Admin navigation">
            {navigation.map((item) => item.href ? (
              <Link key={item.label} href={item.href} className={`admin-nav-item ${item.label === "Categories" ? "is-active" : ""}`}>
                <NavIcon type={item.icon} /><span>{item.label}</span>
              </Link>
            ) : (
              <span key={item.label} className="admin-nav-item is-disabled" aria-disabled="true">
                <NavIcon type={item.icon} /><span>{item.label}</span><small>SOON</small>
              </span>
            ))}
          </nav>
        </div>
        <div className="admin-sidebar-bottom">
          <div className="admin-user-chip"><span className="admin-user-avatar">A</span><span><strong>Administrator</strong><small>Administrator</small></span></div>
          <form action="/api/admin/auth/logout" method="post"><button type="submit" className="admin-logout">Log out <span>↗</span></button></form>
        </div>
      </aside>

      <section className="admin-content">
        <header className="admin-topbar">
          <Link href="/" className="admin-mobile-brand">HAZZART</Link>
          <span className="admin-topbar-context">ADMIN / CATEGORIES</span>
          <Link href="/" className="admin-view-site">View website <span>↗</span></Link>
        </header>

        <div className="admin-main admin-category-main">
          <div className="admin-welcome">
            <div>
              <p className="admin-eyebrow">CATEGORIES</p>
              <h1>Organize your work.</h1>
              <p>Categories can contain subcategories. Subcategories cannot contain another level.</p>
            </div>
            <button className="admin-round-link" type="button" onClick={() => void loadCategories()} aria-label="Reload categories">↻</button>
          </div>

          {loading ? (
            <div className="admin-category-skeleton">
              <div /><div /><div /><div />
            </div>
          ) : (
            <>
              <section className="admin-category-create">
                <div>
                  <p className="admin-card-kicker">NEW CATEGORY</p>
                  <h2>Add a category</h2>
                </div>
                <div className="admin-category-create-row">
                  <input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="e.g. Painting" maxLength={100} onKeyDown={(event) => { if (event.key === "Enter") void create(newCategory, null); }} />
                  <button type="button" onClick={() => void create(newCategory, null)} disabled={saving}>Add category <span>+</span></button>
                </div>
              </section>

              <section className="admin-category-list">
                <div className="admin-category-list-heading">
                  <div><p className="admin-card-kicker">COLLECTION</p><h2>Categories</h2></div>
                  <span>{parents.length} categories · {categories.length - parents.length} subcategories</span>
                </div>

                {!filteredParents.length ? (
                  <div className="admin-category-empty">No categories yet. Add your first category above.</div>
                ) : (
                  parents.map((parent, index) => {
                    const children = childrenByParent.get(parent.id) ?? [];
                    const editing = editingId === parent.id;

                    return (
                      <article className="admin-category-card" key={parent.id}>
                        <div className="admin-category-card-head">
                          <div className="admin-category-index">{String(index + 1).padStart(2, "0")}</div>
                          <div className="admin-category-name">
                            {editing ? (
                              <input value={editingName} onChange={(event) => setEditingName(event.target.value)} autoFocus onKeyDown={(event) => { if (event.key === "Enter") void update(parent.id); if (event.key === "Escape") setEditingId(null); }} />
                            ) : <h3>{parent.name}</h3>}
                            <span>{children.length} subcategor{children.length === 1 ? "y" : "ies"}</span>
                          </div>
                          <div className="admin-category-actions">
                            {editing ? (
                              <>
                                <button type="button" onClick={() => void update(parent.id)} disabled={saving}>Save</button>
                                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button type="button" onClick={() => startEdit(parent)}>Edit</button>
                                <button type="button" onClick={() => void remove(parent.id)} disabled={children.length > 0 || saving}>Delete</button>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="admin-subcategory-list">
                          {children.map((child, childIndex) => {
                            const childEditing = editingId === child.id;
                            return (
                              <div className="admin-subcategory-row" key={child.id}>
                                <span className="admin-subcategory-line">↳</span>
                                {childEditing ? (
                                  <input value={editingName} onChange={(event) => setEditingName(event.target.value)} autoFocus onKeyDown={(event) => { if (event.key === "Enter") void update(child.id); if (event.key === "Escape") setEditingId(null); }} />
                                ) : <strong>{child.name}</strong>}
                                <small>SUB {String(childIndex + 1).padStart(2, "0")}</small>
                                <div>
                                  {childEditing ? (
                                    <>
                                      <button type="button" onClick={() => void update(child.id)} disabled={saving}>Save</button>
                                      <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                                    </>
                                  ) : (
                                    <>
                                      <button type="button" onClick={() => startEdit(child)}>Edit</button>
                                      <button type="button" onClick={() => void remove(child.id)} disabled={saving}>Delete</button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}

                          {subParentId === parent.id ? (
                            <div className="admin-subcategory-add">
                              <span>↳</span>
                              <input value={subCategory} onChange={(event) => setSubCategory(event.target.value)} placeholder="Subcategory name" maxLength={100} autoFocus onKeyDown={(event) => { if (event.key === "Enter") void create(subCategory, parent.id); if (event.key === "Escape") { setSubParentId(null); setSubCategory(""); } }} />
                              <button type="button" onClick={() => void create(subCategory, parent.id)} disabled={saving}>Add</button>
                              <button type="button" onClick={() => { setSubParentId(null); setSubCategory(""); }}>Cancel</button>
                            </div>
                          ) : (
                            <button type="button" className="admin-add-subcategory" onClick={() => { setSubParentId(parent.id); setSubCategory(""); }}>
                              + Add subcategory
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                )}
              </section>
            </>
          )}

          {toast && (
            <div className={`admin-category-toast admin-category-toast--${toast.type}`} role="status">
              <span>{toast.type === "success" ? "✓" : "!"}</span><p>{toast.text}</p>
              <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification">×</button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
