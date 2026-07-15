import * as XLSX from 'xlsx';

/**
 * Reusable export helpers used by the shared ExportDialog across every list page.
 *
 * Two output formats are supported:
 *   - Excel (.xlsx) via SheetJS — full Unicode, so Hebrew/Yiddish content is safe.
 *   - PDF via a styled print window — the browser renders Hebrew + RTL natively and
 *     the user can "Save as PDF" or send to a printer. This avoids embedding heavy
 *     Hebrew fonts into jsPDF (which otherwise renders Hebrew as blank boxes).
 *
 * Both take the ALREADY-FILTERED rows from the page, a set of selected columns,
 * and optional grouping — so exports always match what the user currently sees.
 */

const cell = (v) => {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toLocaleDateString();
  return String(v);
};

const escapeHtml = (s) =>
  cell(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Sort rows by a resolved sort option { accessor } (optional).
 */
export function sortRows(rows, sortOption) {
  if (!sortOption) return [...rows];
  const acc = sortOption.accessor;
  return [...rows].sort((a, b) => {
    const av = cell(acc ? acc(a) : a[sortOption.key]);
    const bv = cell(acc ? acc(b) : b[sortOption.key]);
    return av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Break rows into ordered groups using a resolved group option { label, accessor }.
 * Returns [{ label, rows }]. When no group option, returns a single unnamed group.
 */
function groupRows(rows, groupOption) {
  if (!groupOption) return [{ label: null, rows }];
  const map = new Map();
  rows.forEach((r) => {
    const key = cell(groupOption.accessor ? groupOption.accessor(r) : r[groupOption.key]) || '—';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  });
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true, sensitivity: 'base' }))
    .map(([label, groupedRows]) => ({ label, rows: groupedRows }));
}

/**
 * Export to a real .xlsx workbook.
 * @param {Object} opts
 * @param {string} opts.title      Document / sheet title.
 * @param {Array}  opts.columns    Selected columns [{ label, accessor }].
 * @param {Array}  opts.rows       Already-sorted, already-filtered rows.
 * @param {Object} [opts.groupBy]  Resolved group option { label, accessor }.
 * @param {string} opts.filename   File name without extension.
 */
export function exportExcel({ title, columns, rows, groupBy = null, filename = 'export' }) {
  const headers = columns.map((c) => c.label);
  const aoa = [];
  if (title) aoa.push([title]);
  aoa.push([`Generated: ${new Date().toLocaleString()}`]);
  aoa.push([]);

  const groups = groupRows(rows, groupBy);
  groups.forEach((g) => {
    if (g.label !== null) aoa.push([`${groupBy?.label || ''}: ${g.label}`.trim()]);
    aoa.push(headers);
    g.rows.forEach((row) => {
      aoa.push(columns.map((c) => cell(c.accessor ? c.accessor(row) : row[c.key])));
    });
    aoa.push([]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Reasonable column widths based on header length.
  ws['!cols'] = columns.map((c) => ({ wch: Math.max(12, Math.min(40, c.label.length + 6)) }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Export');
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Open a styled, printable HTML report in a new window and trigger the print
 * dialog. The user can print on paper or "Save as PDF". Handles Hebrew + RTL.
 * @param {Object} opts
 * @param {string} opts.title      Document title.
 * @param {Array}  opts.columns    Selected columns [{ label, accessor }].
 * @param {Array}  opts.rows       Already-sorted, already-filtered rows.
 * @param {Object} [opts.groupBy]  Resolved group option { label, accessor }.
 * @param {boolean} [opts.isRTL]   Right-to-left layout for Hebrew.
 * @param {string} [opts.subtitle] Optional line under the title (e.g. filter summary).
 */
export function printPDF({ title, columns, rows, groupBy = null, isRTL = false, subtitle = '' }) {
  const dir = isRTL ? 'rtl' : 'ltr';
  const headerCells = columns.map((c) => `<th>${escapeHtml(c.label)}</th>`).join('');

  const renderBody = (list) =>
    list
      .map(
        (row) =>
          `<tr>${columns
            .map((c) => `<td>${escapeHtml(c.accessor ? c.accessor(row) : row[c.key])}</td>`)
            .join('')}</tr>`
      )
      .join('');

  const groups = groupRows(rows, groupBy);
  const tables = groups
    .map((g) => {
      const groupHeading =
        g.label !== null
          ? `<h2 class="group">${escapeHtml(groupBy?.label || '')}: ${escapeHtml(g.label)} <span class="count">(${g.rows.length})</span></h2>`
          : '';
      return `${groupHeading}<table><thead><tr>${headerCells}</tr></thead><tbody>${renderBody(g.rows)}</tbody></table>`;
    })
    .join('');

  const html = `<!DOCTYPE html>
<html dir="${dir}" lang="${isRTL ? 'he' : 'en'}">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  * { box-sizing: border-box; }
  body {
    font-family: 'Heebo', 'Segoe UI', -apple-system, sans-serif;
    color: #111827; margin: 32px; direction: ${dir};
  }
  .doc-header { display:flex; justify-content:space-between; align-items:flex-end;
    border-bottom: 3px solid #6d3bef; padding-bottom: 12px; margin-bottom: 20px; }
  h1 { font-size: 22px; margin: 0; color: #4c1fb3; }
  .subtitle { color:#6b7280; font-size: 12px; margin-top: 4px; }
  .meta { text-align: ${isRTL ? 'left' : 'right'}; color:#9ca3af; font-size: 11px; }
  h2.group { font-size: 15px; margin: 22px 0 8px; color:#4c1fb3;
    background:#f3f0ff; padding:6px 12px; border-radius:8px; }
  h2.group .count { color:#9ca3af; font-weight: normal; font-size: 12px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 10px; font-size: 12px; }
  thead th { background:#6d3bef; color:#fff; text-align:${isRTL ? 'right' : 'left'};
    padding: 8px 10px; font-weight: 600; }
  tbody td { padding: 7px 10px; border-bottom: 1px solid #e5e7eb; }
  tbody tr:nth-child(even) { background:#faf9ff; }
  .total { margin-top: 14px; color:#6b7280; font-size: 12px; }
  @media print { body { margin: 12px; } thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>
  <div class="doc-header">
    <div>
      <h1>${escapeHtml(title)}</h1>
      ${subtitle ? `<div class="subtitle">${escapeHtml(subtitle)}</div>` : ''}
    </div>
    <div class="meta">${new Date().toLocaleString()}</div>
  </div>
  ${tables}
  <div class="total">${rows.length} ${isRTL ? 'רשומות' : 'records'}</div>
  <script>
    window.onload = function () { window.focus(); window.print(); };
  </script>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow pop-ups to export/print.');
    return;
  }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
