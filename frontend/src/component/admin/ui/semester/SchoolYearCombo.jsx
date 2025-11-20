import React, { useState, useEffect } from "react";
import { IconChevronDown } from "@tabler/icons-react";

export function SchoolYearCombo({
  id,
  value,
  onChange,
  options,
  placeholder = "e.g., 2025-2026",
  required,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [active, setActive] = useState(-1);

  // Keep local input in sync if parent changes (e.g., when opening Edit)
  useEffect(() => {
    if ((value || "") !== query) setQuery(value || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes((query || "").toLowerCase())
  );

  const commit = (val) => {
    setQuery(val);
    onChange(val);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % Math.max(filtered.length, 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive(
        (i) =>
          (i - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1)
      );
    } else if (e.key === "Enter") {
      if (active >= 0 && filtered[active]) {
        e.preventDefault();
        commit(filtered[active]);
      } else {
        // Enter commits whatever is typed
        commit(query);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div
      className="relative"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <div className="flex">
        <input
          id={id}
          type="text"
          value={query}
          onChange={(e) => {
            const v = e.target.value;
            setQuery(v);
            onChange(v); // keep parent in sync so submit has latest value
            if (v.length >= 2) setOpen(true); // only open when user has typed a bit
          }}
          onKeyDown={onKeyDown}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          placeholder={placeholder}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          className="w-full px-3 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:outline-none"
          required={required}
        />
        <button
          type="button"
          aria-label="Toggle suggestions"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setOpen((o) => !o)}
          className="px-3 border border-l-0 border-gray-300 rounded-r-lg hover:bg-gray-50 cursor-pointer"
        >
          <IconChevronDown size={18} className="text-gray-600" />
        </button>
      </div>
      {open && (
        <ul
          id={`${id}-list`}
          role="listbox"
          className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto"
        >
          {filtered.length ? (
            filtered.map((opt, idx) => (
              <li key={opt} role="option" aria-selected={idx === active}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commit(opt)}
                  className={`block w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer ${
                    idx === active ? "bg-blue-50" : ""
                  }`}
                >
                  {opt}
                </button>
              </li>
            ))
          ) : (
            <li className="px-3 py-2 text-gray-500">No matches</li>
          )}
        </ul>
      )}
    </div>
  );
}
