"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminProjectStatus } from "@/interfaces/ProjectStatus";

export default function ProjectStatusSelect({ value, statuses, onChange }: {
  value: string;
  statuses: AdminProjectStatus[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selected = statuses.find((status) => status.id === value);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="admin-status-select" ref={rootRef}>
      <button type="button" className="admin-status-select__trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        <span className="admin-status-dot admin-status-dot--project" />
        <span>{selected?.name ?? "Select project status"}</span>
        <span className={"admin-status-chevron" + (open ? " is-open" : "")} aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="admin-status-select__menu" role="listbox" aria-label="Project workflow status">
          {statuses.map((status) => (
            <button key={status.id} type="button" role="option" aria-selected={value === status.id} className={"admin-status-option" + (value === status.id ? " is-selected" : "")} onClick={() => { onChange(status.id); setOpen(false); }}>
              <span className="admin-status-dot admin-status-dot--project" />
              <span>{status.name}</span>
              {value === status.id && <span className="admin-status-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
