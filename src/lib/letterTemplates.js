/**
 * Letter & email templates (Yiddish-first).
 * Pure functions that return HTML strings — caller handles printing or emailing.
 */

import { SCHOOL_NAME_YI, SCHOOL_SUBTITLE_YI, SCHOOL_LOGO_URL } from './schoolConfig';

const escapeHtml = (s) => {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const formatHebrewDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  // Use a simple readable date; Yiddish/Hebrew months not standard yet
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const studentDisplayName = (student) => {
  if (!student) return '';
  return student.hebrew_name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
};

// Default school identity — overrideable via app_settings/opts.
const DEFAULT_SCHOOL_NAME = SCHOOL_NAME_YI;
const DEFAULT_SCHOOL_SUBTITLE = SCHOOL_SUBTITLE_YI;
const DEFAULT_LOGO_URL = SCHOOL_LOGO_URL;

/**
 * Build a single Yiddish late-arrival slip (receipt / 80mm thermal format).
 * Returns the inner HTML for one slip (no <html>/<body> wrapper).
 */
export function buildLateLetterPage(late, opts = {}) {
  const schoolName = opts.schoolName || DEFAULT_SCHOOL_NAME;
  const schoolSubtitle = opts.schoolSubtitle || DEFAULT_SCHOOL_SUBTITLE;
  const logoUrl = opts.logoUrl || DEFAULT_LOGO_URL;
  const student = late.student || {};
  const className = student.class?.name || '';
  const dateStr = formatHebrewDate(late.date);
  const arrivalTime = late.arrival_time || '';
  const reason = late.reason || '';
  const repeatCount = opts.repeatCount;
  const signatureName = opts.signatureName || '';
  const signatureRole = opts.signatureRole || '';
  // signatureStyle is a CSS object; if provided, render it inline so the
  // chosen font/size/rotation/color appears on the printed slip.
  const sigStyle = opts.signatureStyle || null;
  const sigStyleAttr = sigStyle
    ? `style="font-family:${sigStyle.fontFamily};font-size:${sigStyle.fontSize};font-weight:${sigStyle.fontWeight};font-style:${sigStyle.fontStyle};color:${sigStyle.color};letter-spacing:${sigStyle.letterSpacing};transform:rotate(${sigStyle.rotate});display:inline-block;"`
    : '';

  return `
    <div class="slip">
      <div class="head">
        <img class="logo" src="${escapeHtml(logoUrl)}" alt="" onerror="this.style.display='none'"/>
        <div class="school-name">${escapeHtml(schoolName)}</div>
        <div class="school-sub">${escapeHtml(schoolSubtitle)}</div>
        <div class="rule"></div>
        <div class="title">בריוו פאר א קינד וואס איז שפעט געקומען</div>
      </div>

      <div class="row"><span class="lbl">דאטום:</span><span>${escapeHtml(dateStr)}</span></div>

      <p class="greet">לכבוד הרב המלמד שליט"א,</p>

      <p class="body">
        דער קינד <strong>${escapeHtml(studentDisplayName(student))}</strong>${className ? ` פון כיתה <strong>${escapeHtml(className)}</strong>` : ''} איז היינט אנגעקומען שפעט צום חדר.
      </p>

      <div class="row"><span class="lbl">צייט פון אנקומען:</span><span><strong>${escapeHtml(arrivalTime || '—')}</strong></span></div>
      ${reason ? `<div class="row"><span class="lbl">סיבה:</span><span>${escapeHtml(reason)}</span></div>` : ''}
      ${repeatCount && repeatCount > 1 ? `<div class="row warn"><span class="lbl">שפעט דעם חודש:</span><span><strong>${repeatCount} מאל</strong></span></div>` : ''}

      <p class="note">ביטע איבערגעבן דעם בריוו צום מלמד ביים אריינקומען אין כיתה.</p>

      <div class="sign">
        ${signatureName ? `<div class="sig-name" ${sigStyleAttr}>${escapeHtml(signatureName)}</div>` : ''}
        <div class="sig-line"></div>
        <div class="sig-label">${escapeHtml(signatureRole || 'סגן המנהל')}</div>
      </div>
    </div>
  `;
}

// Default print settings for the late-arrival letter (thermal / narrow roll).
export const DEFAULT_LETTER_PRINT = {
  paperWidth: 80,          // mm — physical paper width
  margin: 3,               // mm — @page margin on all sides
  fontFamily: 'Frank Ruhl Libre',
  fontSize: 11,            // pt — base body font size
};

// Receipt / thermal format — narrow, continuous roll, large readable text.
// Sizes are relative (em) to the configurable base font-size so the whole
// letter scales when the principal changes the font size.
function buildLetterStyles(print = {}) {
  const p = { ...DEFAULT_LETTER_PRINT, ...print };
  const paperWidth = Number(p.paperWidth) || DEFAULT_LETTER_PRINT.paperWidth;
  const margin = Number(p.margin);
  const marginMm = Number.isFinite(margin) ? margin : DEFAULT_LETTER_PRINT.margin;
  const contentWidth = Math.max(10, paperWidth - marginMm * 2);
  const fontFamily = (p.fontFamily || DEFAULT_LETTER_PRINT.fontFamily).trim();
  const fontSize = Number(p.fontSize) || DEFAULT_LETTER_PRINT.fontSize;
  const sigLineWidth = Math.min(50, contentWidth * 0.7);
  return `
  @import url('https://fonts.googleapis.com/css2?family=Bellefair&family=Frank+Ruhl+Libre:wght@500;700&family=Heebo:wght@400;700;900&family=Suez+One&family=David+Libre:wght@400;700&family=Noto+Serif+Hebrew:wght@400;700&family=Noto+Rashi+Hebrew&family=Miriam+Libre:wght@400;700&display=swap');
  @page { size: ${paperWidth}mm auto; margin: ${marginMm}mm; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: '${fontFamily}', 'David Libre', 'David', 'Narkisim', 'Times New Roman', serif;
    color: #000;
    width: ${contentWidth}mm;
    font-size: ${fontSize}pt;
    line-height: 1.45;
  }
  .slip {
    page-break-after: always;
    padding: 2mm 0 6mm 0;
  }
  .slip:last-child { page-break-after: auto; }
  .head { text-align: center; margin-bottom: 4mm; }
  .head .logo {
    max-width: 22mm;
    max-height: 22mm;
    display: block;
    margin: 0 auto 2mm auto;
  }
  .school-name {
    font-size: 1.1em;
    font-weight: bold;
    line-height: 1.25;
  }
  .school-sub {
    font-size: 0.77em;
    margin-top: 1mm;
    color: #000;
  }
  .rule {
    border-top: 1px solid #000;
    margin: 2mm 0;
  }
  .title {
    font-size: 0.91em;
    font-weight: bold;
  }
  .row {
    display: flex;
    justify-content: space-between;
    gap: 4mm;
    font-size: 0.95em;
    margin: 1mm 0;
    border-bottom: 1px dotted #999;
    padding-bottom: 1mm;
  }
  .row .lbl { font-weight: bold; }
  .row.warn { color: #000; background: #000; color: #fff; padding: 1mm 2mm; border-radius: 1mm; }
  .greet { margin: 3mm 0 2mm 0; font-weight: bold; font-size: 1em; }
  .body { margin: 0 0 2mm 0; font-size: 1em; }
  .note {
    margin-top: 3mm;
    padding: 2mm;
    border: 1px dashed #000;
    font-size: 0.86em;
    text-align: center;
  }
  .sign { margin-top: 8mm; text-align: center; }
  .sig-name {
    font-family: 'Suez One', 'Frank Ruhl Libre', 'David', cursive;
    font-size: 1.64em;
    font-weight: 500;
    font-style: italic;
    color: #1e3a8a;
    margin-bottom: 1mm;
    transform: rotate(-2deg);
    display: inline-block;
    letter-spacing: 0.5px;
  }
  .sig-line { width: ${sigLineWidth}mm; border-top: 1px solid #000; margin: 0 auto; }
  .sig-label { font-size: 0.82em; margin-top: 1mm; }
  @media print { body { background: white; } }
`;
}

/**
 * Wrap one or more letter pages in a printable HTML document (Yiddish RTL).
 */
export function buildLateLetterDocument(lates, opts = {}) {
  const arr = Array.isArray(lates) ? lates : [lates];
  const pages = arr.map((l) => buildLateLetterPage(l, {
    ...opts,
    repeatCount: opts.repeatCounts?.[l.id]
  })).join('\n');

  return `<!DOCTYPE html>
<html lang="yi" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>בריוו פאר א שפעטן קינד</title>
  <style>${buildLetterStyles(opts.print)}</style>
</head>
<body onload="window.focus(); window.print(); setTimeout(function(){ try { window.close(); } catch(e){} }, 500);">
  ${pages}
</body>
</html>`;
}

/**
 * Build a parent-notification email body (HTML) for repeat lateness.
 * Returns plain HTML — wrap with the standard email envelope server-side.
 */
export function buildParentEscalationEmail(late, opts = {}) {
  const student = late.student || {};
  const repeatCount = opts.repeatCount || 1;
  const monthName = new Date(late.date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.7; color: #111;" dir="rtl">
      <p>טייערע עלטערן שיחיו,</p>
      <p>
        מיר ווילן אייך געבן צו וויסן אז אייער זון
        <strong>${escapeHtml(studentDisplayName(student))}</strong>
        איז היינט (${escapeHtml(formatHebrewDate(late.date))}) ווידעראמאל אנגעקומען שפעט אין חדר.
      </p>
      <p>
        דאס איז שוין <strong>${repeatCount} מאל</strong> דעם חודש (${escapeHtml(monthName)}).
      </p>
      <p>
        מיר בעטן אייך הארציג זיך אנצושטרענגען צו זען אז דער קינד זאל אנקומען צו זמן, אזוי ער זאל נישט פארפאסן דעם אנהויב פון די לימודים און נישט שטערן די אנדערע תלמידים.
      </p>
      <p style="margin-top: 18px;">
        אויב עס איז דא ספעציעלע אומשטענדן, ביטע פארבינדט אייך מיט דעם חדר און מיר וועלן בעז"ה ארבעטן צוזאמען אויף א לעזונג.
      </p>
      <p style="margin-top: 24px;">
        בכבוד רב ובברכת התורה,<br>
        <strong>סגן המנהל</strong>
      </p>
    </div>
  `;
}

/**
 * Build a daily summary HTML email for the Principal.
 */
export function buildDailySummaryEmail(date, lates, opts = {}) {
  const dateStr = formatHebrewDate(date);
  const total = lates.length;

  // Group by class
  const byClass = {};
  for (const l of lates) {
    const cn = l.student?.class?.name || '—';
    if (!byClass[cn]) byClass[cn] = [];
    byClass[cn].push(l);
  }

  const classBlocks = Object.entries(byClass).map(([cn, list]) => {
    const rows = list.map((l) => {
      const repeat = opts.repeatCounts?.[l.id];
      return `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">
            ${escapeHtml(studentDisplayName(l.student))}
            ${repeat && repeat >= 3 ? ` <span style="color:#b91c1c;font-weight:bold;">(${repeat} this month)</span>` : ''}
          </td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(l.arrival_time || '—')}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(l.reason || '')}</td>
        </tr>
      `;
    }).join('');
    return `
      <h3 style="margin:18px 0 6px 0;color:#1e3a8a;">${escapeHtml(cn)} <span style="color:#64748b;font-weight:normal;">(${list.length})</span></h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="text-align:left;padding:6px 8px;">Student</th>
            <th style="text-align:left;padding:6px 8px;">Time</th>
            <th style="text-align:left;padding:6px 8px;">Reason</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }).join('');

  return `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2 style="color:#1e3a8a;margin:0 0 8px 0;">Daily Late Arrivals — ${escapeHtml(dateStr)}</h2>
      <p style="color:#475569;margin:0 0 16px 0;">Total: <strong>${total}</strong> students late across <strong>${Object.keys(byClass).length}</strong> classes.</p>
      ${total === 0 ? '<p>No late arrivals recorded.</p>' : classBlocks}
    </div>
  `;
}
