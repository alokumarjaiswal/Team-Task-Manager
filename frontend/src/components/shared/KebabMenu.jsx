import React, { useEffect, useRef, useState } from 'react';

export default function KebabMenu({ items = [], ariaLabel = 'Actions' }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      if (btnRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector('button')?.focus();
  }, [open]);

  return (
    <div className="kebab-menu">
      <button
        ref={btnRef}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={ariaLabel}
        className="kebab-menu__button"
        onClick={() => setOpen((s) => !s)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
          }
        }}
        type="button"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="5" r="1.5" fill="currentColor" />
          <circle cx="12" cy="12" r="1.5" fill="currentColor" />
          <circle cx="12" cy="19" r="1.5" fill="currentColor" />
        </svg>
      </button>
      <div
        ref={listRef}
        role="menu"
        aria-hidden={!open}
        className="kebab-menu__list"
      >
        {items.map((it, idx) => (
          <button
            key={idx}
            role="menuitem"
            className={it.danger ? 'kebab-menu__item kebab-menu__item--danger' : 'kebab-menu__item'}
            onClick={() => { setOpen(false); it.onClick?.(); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                listRef.current?.children[(idx + 1) % items.length]?.focus();
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                listRef.current?.children[(idx - 1 + items.length) % items.length]?.focus();
              }
            }}
            type="button"
          >
            {it.label}
          </button>
        ))}
      </div>
    </div>
  );
}
