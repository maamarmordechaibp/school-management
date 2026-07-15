import React, { useState, useMemo } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * FilterBar — a reusable, non-technical-friendly filtering panel used across
 * every data list in the app. Features required by the spec:
 *   - Always-visible "Filter" button (no hidden menus).
 *   - Collapsible panel of checkbox / toggle / select style controls.
 *   - Active filters shown as removable colored chips + a "Clear All" button.
 *   - Instant results (no submit) — parent updates on every onChange.
 *   - Result count line: "Showing X of Y".
 *
 * Config-driven so it can wrap ANY existing page's filter state without
 * touching that page's data logic. A filter is considered "active" when its
 * value differs from its `allValue` (default 'all').
 *
 * filters: Array<{
 *   key, label, type: 'select' | 'toggle',
 *   options?: Array<{ value, label }>,  // for select
 *   allValue?: any,                     // value meaning "no filter" (default 'all')
 * }>
 */
const FilterBar = ({
  filters = [],
  values = {},
  onChange,
  onClear,
  searchKey,
  searchPlaceholder,
  resultCount,
  totalCount,
  resultNoun = '',
  rightSlot = null,
}) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const isActive = (f) => {
    const allValue = f.allValue ?? 'all';
    if (f.type === 'daterange') {
      return (values[f.fromKey] ?? '') !== '' || (values[f.toKey] ?? '') !== '';
    }
    const v = values[f.key];
    return v !== undefined && v !== null && v !== '' && v !== allValue;
  };

  const activeChips = useMemo(() => {
    return filters
      .filter(isActive)
      .map((f) => {
        if (f.type === 'daterange') {
          const from = values[f.fromKey];
          const to = values[f.toKey];
          const display = [from, to].filter(Boolean).join(' → ');
          return { key: f.fromKey + f.toKey, label: f.label, display, filter: f };
        }
        let display = values[f.key];
        if (f.type === 'select' && f.options) {
          const opt = f.options.find((o) => String(o.value) === String(values[f.key]));
          display = opt ? opt.label : display;
        } else if (f.type === 'toggle') {
          display = f.label;
        }
        return { key: f.key, label: f.label, display, filter: f };
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, values]);

  const hasActiveFilters = activeChips.length > 0;

  const removeChip = (f) => {
    if (f.type === 'daterange') {
      onChange?.(f.fromKey, '');
      onChange?.(f.toKey, '');
      return;
    }
    const allValue = f.allValue ?? 'all';
    onChange?.(f.key, allValue);
  };

  return (
    <div className="glass-card rounded-2xl shadow-card border border-white/60 p-4 space-y-3">
      {/* Top row: search + filter button + result count */}
      <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2 min-w-0">
          {searchKey && (
            <div className="relative flex-1 min-w-[180px] max-w-md">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 h-4 w-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={values[searchKey] ?? ''}
                onChange={(e) => onChange?.(searchKey, e.target.value)}
                placeholder={searchPlaceholder || t('common.search')}
                className="w-full h-12 ps-9 pe-4 border border-white/60 rounded-xl bg-white/60 backdrop-blur-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60 focus:bg-white/80 text-sm"
              />
            </div>
          )}

          {filters.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className={`inline-flex items-center gap-2 h-12 px-4 rounded-xl border text-sm font-semibold transition-colors ${
                open || hasActiveFilters
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-white/60 bg-white/60 backdrop-blur-md text-slate-700 hover:bg-white/80'
              }`}
            >
              <SlidersHorizontal size={18} />
              <span>{t('common.filter')}</span>
              {hasActiveFilters && (
                <span className="min-w-[20px] h-5 px-1 rounded-full bg-primary text-white text-xs font-bold inline-flex items-center justify-center">
                  {activeChips.length}
                </span>
              )}
            </button>
          )}

          {rightSlot}
        </div>

        {(resultCount !== undefined && totalCount !== undefined) && (
          <p className="text-sm text-slate-500 font-medium whitespace-nowrap">
            {t('common.showing')}{' '}
            <span className="font-bold text-slate-800 tabular-nums">{resultCount}</span>{' '}
            {t('common.of')}{' '}
            <span className="font-bold text-slate-800 tabular-nums">{totalCount}</span>{' '}
            {resultNoun}
          </p>
        )}
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {t('common.activeFilters')}:
          </span>
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 h-8 ps-3 pe-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20"
            >
              <span className="text-slate-500 font-normal">{chip.label}:</span>
              <span>{String(chip.display)}</span>
              <button
                type="button"
                onClick={() => removeChip(chip.filter)}
                className="ms-0.5 h-5 w-5 rounded-full inline-flex items-center justify-center hover:bg-primary/20"
                aria-label="Remove filter"
              >
                <X size={13} />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 border border-red-200"
          >
            <X size={14} />
            {t('common.clearAll')}
          </button>
        </div>
      )}

      {/* Collapsible filter panel */}
      {open && filters.length > 0 && (
        <div className="pt-3 border-t border-white/50">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((f) => {
              const allValue = f.allValue ?? 'all';
              if (f.type === 'toggle') {
                const checked = values[f.key] === (f.onValue ?? 'yes');
                return (
                  <label
                    key={f.key}
                    className="flex items-center gap-3 h-12 px-3 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md cursor-pointer hover:bg-white/80"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) =>
                        onChange?.(f.key, e.target.checked ? (f.onValue ?? 'yes') : allValue)
                      }
                      className="h-5 w-5 rounded accent-[#4F46E5]"
                    />
                    <span className="text-sm font-medium text-slate-700">{f.label}</span>
                  </label>
                );
              }
              if (f.type === 'daterange') {
                return (
                  <div key={f.fromKey + f.toKey} className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-slate-500">{f.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={values[f.fromKey] ?? ''}
                        onChange={(e) => onChange?.(f.fromKey, e.target.value)}
                        className="flex-1 h-12 px-3 border border-white/60 rounded-xl bg-white/60 backdrop-blur-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
                        aria-label={t('common.from')}
                      />
                      <span className="text-slate-400 text-sm">→</span>
                      <input
                        type="date"
                        value={values[f.toKey] ?? ''}
                        onChange={(e) => onChange?.(f.toKey, e.target.value)}
                        className="flex-1 h-12 px-3 border border-white/60 rounded-xl bg-white/60 backdrop-blur-md text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
                        aria-label={t('common.to')}
                      />
                    </div>
                  </div>
                );
              }
              // select
              return (
                <div key={f.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-500">{f.label}</label>
                  <select
                    value={values[f.key] ?? allValue}
                    onChange={(e) => onChange?.(f.key, e.target.value)}
                    className="w-full h-12 px-3 border border-white/60 rounded-xl bg-white/60 backdrop-blur-md text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/60"
                  >
                    <option value={allValue}>{f.allLabel || t('common.all')}</option>
                    {(f.options || []).map((o) => (
                      <option key={String(o.value)} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;
