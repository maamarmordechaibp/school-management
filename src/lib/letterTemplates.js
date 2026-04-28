/**
 * Letter & email templates (Yiddish-first).
 * Pure functions that return HTML strings — caller handles printing or emailing.
 */

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

/**
 * Build a single Yiddish late-arrival letter (one per page).
 * Returns the inner HTML for one letter (no <html>/<body> wrapper).
 */
export function buildLateLetterPage(late, opts = {}) {
  const schoolName = opts.schoolName || 'תלמוד תורה ימין מאנסי';
  const student = late.student || {};
  const className = student.class?.name || '';
  const dateStr = formatHebrewDate(late.date);
  const arrivalTime = late.arrival_time || '';
  const minutesLate = late.minutes_late ?? '';
  const reason = late.reason || '';
  const repeatCount = opts.repeatCount;

  return `
    <div class="letter-page">
      <div class="letterhead">
        <div class="school-name">${escapeHtml(schoolName)}</div>
        <div class="letter-title">בריוו פאר א שפעטן בחור</div>
      </div>

      <div class="letter-meta">
        <span><strong>דאטום:</strong> ${escapeHtml(dateStr)}</span>
      </div>

      <div class="letter-body">
        <p class="greeting">לכבוד הרב המלמד שליט"א,</p>

        <p>דער תלמיד <strong>${escapeHtml(studentDisplayName(student))}</strong>
           פון כיתה <strong>${escapeHtml(className)}</strong>
           איז היינט אנגעקומען שפעט אין ישיבה.</p>

        <table class="details">
          <tr><td class="label">צייט פון אנקומען:</td><td>${escapeHtml(arrivalTime || '—')}</td></tr>
          <tr><td class="label">מינוטן שפעט:</td><td>${escapeHtml(String(minutesLate || '—'))}</td></tr>
          ${reason ? `<tr><td class="label">סיבה:</td><td>${escapeHtml(reason)}</td></tr>` : ''}
          ${repeatCount && repeatCount > 1 ? `<tr><td class="label">שפעט דעם חודש:</td><td><strong>${repeatCount} מאל</strong></td></tr>` : ''}
        </table>

        <p class="note">דער בריוו דארף איבערגעגעבן ווערן צום מלמד ביים אריינקומען אין כיתה.</p>
      </div>

      <div class="signature">
        <div class="line"></div>
        <div class="sig-label">סגן המנהל</div>
      </div>
    </div>
  `;
}

const LETTER_STYLES = `
  @page { size: letter; margin: 0.6in; }
  body { font-family: 'David', 'Times New Roman', serif; color: #111; margin: 0; }
  .letter-page {
    page-break-after: always;
    padding: 0.4in 0.5in;
    max-width: 7in;
    margin: 0 auto;
    box-sizing: border-box;
  }
  .letter-page:last-child { page-break-after: auto; }
  .letterhead {
    text-align: center;
    border-bottom: 3px double #1e3a8a;
    padding-bottom: 14px;
    margin-bottom: 24px;
  }
  .school-name {
    font-size: 26px;
    font-weight: bold;
    color: #1e3a8a;
    letter-spacing: 1px;
  }
  .letter-title {
    font-size: 16px;
    color: #475569;
    margin-top: 6px;
  }
  .letter-meta {
    display: flex;
    justify-content: space-between;
    font-size: 14px;
    margin-bottom: 18px;
  }
  .letter-body { font-size: 16px; line-height: 1.7; }
  .greeting { margin: 0 0 14px 0; font-weight: bold; }
  table.details {
    width: 100%;
    border-collapse: collapse;
    margin: 18px 0;
    font-size: 15px;
  }
  table.details td {
    padding: 6px 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  table.details td.label {
    font-weight: bold;
    width: 40%;
    color: #334155;
  }
  .note {
    margin-top: 18px;
    padding: 10px 12px;
    background: #fef3c7;
    border-right: 4px solid #f59e0b;
    font-size: 14px;
  }
  .signature {
    margin-top: 60px;
    text-align: center;
  }
  .signature .line {
    width: 200px;
    border-top: 1px solid #111;
    margin: 0 auto;
  }
  .signature .sig-label {
    margin-top: 6px;
    font-size: 13px;
    color: #475569;
  }
  @media print {
    body { background: white; }
  }
`;

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
  <title>בריוו פאר שפעטן</title>
  <style>${LETTER_STYLES}</style>
</head>
<body>
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
      <p>טייערע עלטערן,</p>
      <p>
        מיר ווילן אייך לאזן וויסן אז אייער זון
        <strong>${escapeHtml(studentDisplayName(student))}</strong>
        איז היינט (${escapeHtml(formatHebrewDate(late.date))}) ווידער אנגעקומען שפעט אין ישיבה.
      </p>
      <p>
        דאס איז שוין <strong>${repeatCount} מאל</strong> דעם חודש (${escapeHtml(monthName)}).
      </p>
      <p>
        מיר ווילן זייער אייך בעטן צו ארבעטן מיט אונז דאס צו פאררעכטן, אז דער תלמיד זאל קענען אנקומען צו זמן און נישט פארפאסן דעם אנהויב פון די לימודים.
      </p>
      <p style="margin-top: 18px;">
        אויב עס איז דא אן ענין אדער אן ערקלערונג, ביטע פארבינדט אייך מיט די ישיבה.
      </p>
      <p style="margin-top: 24px;">
        בכבוד רב,<br>
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
          <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${escapeHtml(String(l.minutes_late || '—'))}</td>
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
            <th style="text-align:left;padding:6px 8px;">Min Late</th>
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
