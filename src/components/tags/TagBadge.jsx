import React from 'react';
import { X } from 'lucide-react';

/**
 * Hex helpers so a tag's chosen color drives a soft, readable pill.
 */
function hexToRgb(hex) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
  if (!m) return { r: 100, g: 116, b: 139 }; // slate-500 fallback
  return { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) };
}

/**
 * A single tag pill. Optionally shows a remove (x) button.
 */
const TagBadge = ({ tag, onRemove, size = 'sm', className = '' }) => {
  if (!tag) return null;
  const { r, g, b } = hexToRgb(tag.color);
  const style = {
    backgroundColor: `rgba(${r}, ${g}, ${b}, 0.12)`,
    color: `rgb(${Math.round(r * 0.7)}, ${Math.round(g * 0.7)}, ${Math.round(b * 0.7)})`,
    borderColor: `rgba(${r}, ${g}, ${b}, 0.35)`,
  };
  const pad = size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold whitespace-nowrap ${pad} ${className}`}
      style={style}
      title={tag.description || tag.name}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tag.color || '#64748B' }} />
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(tag); }}
          className="ms-0.5 rounded-full hover:bg-black/10 p-0.5 focus:outline-none"
          aria-label={`Remove ${tag.name}`}
        >
          <X size={11} />
        </button>
      )}
    </span>
  );
};

export default TagBadge;
