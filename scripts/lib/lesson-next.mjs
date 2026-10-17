/* A lesson's Connections list and its "What comes next" button must send the
   student to the same place (docs/polish-2026-10-17.md, D4): the next lesson.

   Authored and generated Connections lists end with "Next: ..." linking the
   next topic's notes page, while "What comes next" links its lesson. Here:
     - a Next entry naming the topic the button opens keeps its label and
       links that lesson (lessons sit side by side, so "<id>.html");
     - a Next entry naming a different topic (a skills lesson or an unbuilt
       topic sits in between) is relabelled "Later: ...", so "Next" never
       means two places on one page.
   Used by every course builder whose lessons have Connections. */
const slug = href => (String(href).match(/([^/]+)\.html$/) || [])[1] || '';

export function connectionsWithNext(list, next) {
  return (list || []).map(c => {
    if (!/^next\b/i.test(c.label || '')) return c;
    if (next && slug(c.href) === next.id) return { ...c, href: `${next.id}.html` };
    return { ...c, label: c.label.replace(/^next\b/i, 'Later') };
  });
}
