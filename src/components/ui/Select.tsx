import React, { useEffect, useMemo, useRef, useState } from 'react';

export type Option = { label: string; value: string };

interface SelectProps {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

const Select: React.FC<SelectProps> = ({ label, value, onChange, options, placeholder = 'Select…', className = '' }) => {
  const [open, setOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number>(() => Math.max(0, options.findIndex(o => o.value === value)));
  const rootRef = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);

  const selected = useMemo(() => options.find(o => o.value === value) || null, [options, value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  useEffect(() => {
    if (open) {
      // Ensure hovered item is visible
      const li = listRef.current?.querySelector<HTMLLIElement>(`li[data-idx='${hoverIdx}']`);
      li?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, hoverIdx]);

  const commit = (idx: number) => {
    const opt = options[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    btnRef.current?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
      btnRef.current?.focus();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHoverIdx(i => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHoverIdx(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit(hoverIdx);
    }
  };

  return (
    <div ref={rootRef} className={`text-sm ${className}`}>
      {label && <span className="block mb-1 text-slate-600">{label}</span>}
      <div className="relative">
        <button
          ref={btnRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen(o => !o)}
          onKeyDown={onKeyDown}
          className="w-full text-left pr-9 px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent hover:border-primary-300 transition-colors"
        >
          <span className={`${selected ? 'text-slate-800' : 'text-slate-400'}`}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z" clipRule="evenodd" />
            </svg>
          </span>
        </button>

        {open && (
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="absolute z-20 mt-2 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 focus:outline-none"
          >
            {options.map((o, idx) => {
              const active = o.value === value;
              const hovered = idx === hoverIdx;
              return (
                <li
                  key={o.value}
                  data-idx={idx}
                  role="option"
                  aria-selected={active}
                  className={`px-3 py-2 cursor-pointer text-slate-800 transition-colors ${
                    active ? 'bg-primary-50 text-primary-700' : hovered ? 'bg-slate-50' : ''
                  }`}
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseDown={(e) => { e.preventDefault(); commit(idx); }}
                >
                  {o.label}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default Select;
