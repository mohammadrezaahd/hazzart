"use client";

import { useEffect, useRef, useState } from "react";

type Status = "draft" | "published" | "archived";

const labels: Record<Status, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};

export default function StatusSelect({
  value,
  onChange,
}: {
  value: Status;
  onChange: (value: Status) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <div className="admin-status-select" ref={rootRef}>
      <button
        type="button"
        className="admin-status-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className={"admin-status-dot admin-status-dot--" + value} />
        <span>{labels[value]}</span>
        <span className={"admin-status-chevron" + (open ? " is-open" : "")} aria-hidden="true">⌄</span>
      </button>

      {open && (
        <div className="admin-status-select__menu" role="listbox" aria-label="Project status">
          {(Object.keys(labels) as Status[]).map((status) => (
            <button
              key={status}
              type="button"
              role="option"
              aria-selected={value === status}
              className={"admin-status-option" + (value === status ? " is-selected" : "")}
              onClick={() => {
                onChange(status);
                setOpen(false);
              }}
            >
              <span className={"admin-status-dot admin-status-dot--" + status} />
              <span>{labels[status]}</span>
              {value === status && <span className="admin-status-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
