import { describe, it, expect } from 'vitest';
import { renderTemplate } from '@/lib/emailService';

describe('renderTemplate', () => {
  const tpl = { subject: 'Hi {{name}}', body_html: '<p>{{name}} — {{count}} items</p>' };

  it('substitutes provided variables', () => {
    const out = renderTemplate(tpl, { name: 'Moshe', count: 3 });
    expect(out.subject).toBe('Hi Moshe');
    expect(out.body_html).toBe('<p>Moshe — 3 items</p>');
    expect(out.missing).toEqual([]);
  });

  it('reports and preserves missing variables', () => {
    const out = renderTemplate(tpl, { name: 'Moshe' });
    expect(out.body_html).toContain('{{count}}');
    expect(out.missing).toContain('count');
  });

  it('handles a null template safely', () => {
    const out = renderTemplate(null, {});
    expect(out).toEqual({ subject: '', body_html: '', missing: [] });
  });
});
