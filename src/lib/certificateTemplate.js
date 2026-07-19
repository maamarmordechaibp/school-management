/**
 * Certificate template — a printable gold-framed certificate for a student,
 * built from the school identity and (optionally) an evaluation.
 * Pure HTML + window.print(), matching the approach in letterTemplates.js.
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

const studentDisplayName = (student) => {
  if (!student) return '';
  return student.hebrew_name || `${student.first_name || ''} ${student.last_name || ''}`.trim();
};

/**
 * Build a full printable certificate document.
 * opts: {
 *   schoolName, schoolSubtitle, logoUrl,
 *   title,            // main heading, e.g. "תעודת הצטיינות"
 *   bodyText,         // free paragraph shown under the name
 *   ratingLabel,      // optional overall-rating chip
 *   dateStr,
 *   signatureName, signatureRole
 * }
 */
export function buildCertificateDocument(student, opts = {}) {
  const schoolName = opts.schoolName || SCHOOL_NAME_YI;
  const schoolSubtitle = opts.schoolSubtitle || SCHOOL_SUBTITLE_YI;
  const logoUrl = opts.logoUrl || SCHOOL_LOGO_URL;
  const title = opts.title || 'תעודת הצטיינות';
  const name = studentDisplayName(student);
  const className = student?.class?.name || '';
  const bodyText = opts.bodyText || 'מיט גרויס פרייד גיבן מיר איבער די דאזיגע תעודה פאר די העכסטע הצלחה אין לימוד און מידות טובות.';
  const dateStr = opts.dateStr || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const signatureName = opts.signatureName || '';
  const signatureRole = opts.signatureRole || 'מנהל';
  const ratingLabel = opts.ratingLabel || '';

  return `<!DOCTYPE html>
<html lang="yi" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} — ${escapeHtml(name)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500;700;900&family=Suez+One&family=David+Libre:wght@400;700&display=swap');
    @page { size: A4 landscape; margin: 0; }
    html, body { margin: 0; padding: 0; }
    body {
      font-family: 'Frank Ruhl Libre', 'David Libre', 'David', serif;
      color: #3a2e12;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .sheet {
      width: 297mm; height: 210mm;
      box-sizing: border-box;
      padding: 12mm;
      background: #fffdf7;
    }
    .frame {
      height: 100%;
      box-sizing: border-box;
      border: 3px solid #c9a227;
      outline: 1px solid #c9a227;
      outline-offset: 4px;
      border-radius: 4mm;
      padding: 12mm 16mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      background:
        radial-gradient(circle at top, rgba(201,162,39,0.06), transparent 60%),
        #fffdf7;
    }
    .logo { max-height: 26mm; max-width: 26mm; margin-bottom: 3mm; }
    .school-name { font-size: 16pt; font-weight: 700; }
    .school-sub { font-size: 10pt; color: #7a6a3a; margin-top: 1mm; }
    .divider { width: 60%; height: 2px; background: linear-gradient(90deg, transparent, #c9a227, transparent); margin: 6mm 0; }
    .title { font-family: 'Suez One', 'Frank Ruhl Libre', serif; font-size: 34pt; color: #b8860b; letter-spacing: 1px; }
    .subtitle { font-size: 12pt; color: #7a6a3a; margin-top: 2mm; }
    .name { font-size: 30pt; font-weight: 900; margin: 8mm 0 2mm 0; color: #2a2208; }
    .class { font-size: 12pt; color: #7a6a3a; }
    .body { font-size: 13pt; line-height: 1.7; max-width: 200mm; margin: 6mm auto 0 auto; }
    .rating { display: inline-block; margin-top: 5mm; padding: 2mm 6mm; border: 1.5px solid #c9a227; border-radius: 20mm; font-size: 12pt; color: #8a6d12; }
    .footer { margin-top: auto; width: 100%; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 8mm; }
    .foot-block { flex: 1; text-align: center; }
    .sig-name { font-family: 'Suez One', cursive; font-size: 18pt; color: #1e3a8a; transform: rotate(-2deg); display: inline-block; }
    .sig-line { width: 55mm; border-top: 1px solid #3a2e12; margin: 1mm auto; }
    .sig-label { font-size: 10pt; color: #7a6a3a; }
    .date { font-size: 11pt; color: #3a2e12; }
    @media print { body { background: white; } }
  </style>
</head>
<body onload="window.focus(); window.print(); setTimeout(function(){ try { window.close(); } catch(e){} }, 500);">
  <div class="sheet">
    <div class="frame">
      <img class="logo" src="${escapeHtml(logoUrl)}" alt="" onerror="this.style.display='none'"/>
      <div class="school-name">${escapeHtml(schoolName)}</div>
      <div class="school-sub">${escapeHtml(schoolSubtitle)}</div>
      <div class="divider"></div>
      <div class="title">${escapeHtml(title)}</div>
      <div class="subtitle">מוגש בזה לתלמיד היקר</div>
      <div class="name">${escapeHtml(name)}</div>
      ${className ? `<div class="class">כיתה ${escapeHtml(className)}</div>` : ''}
      <div class="body">${escapeHtml(bodyText)}</div>
      ${ratingLabel ? `<div class="rating">${escapeHtml(ratingLabel)}</div>` : ''}
      <div class="footer">
        <div class="foot-block">
          <div class="date">${escapeHtml(dateStr)}</div>
          <div class="sig-line"></div>
          <div class="sig-label">תאריך</div>
        </div>
        <div class="foot-block">
          ${signatureName ? `<div class="sig-name">${escapeHtml(signatureName)}</div>` : '<div style="height:18pt"></div>'}
          <div class="sig-line"></div>
          <div class="sig-label">${escapeHtml(signatureRole)}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

/** Open a certificate in a new window (which auto-prints). */
export function printCertificate(student, opts = {}) {
  const doc = buildCertificateDocument(student, opts);
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(doc);
  w.document.close();
  return true;
}
