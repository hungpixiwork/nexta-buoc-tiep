/**
 * Tiny, safe Markdown renderer for our own agreement texts (headings, lists,
 * tables, bold/italic, rules). No HTML passthrough.
 */
import type { ReactNode } from 'react';

function inline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|_[^_]+_)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    out.push(t.startsWith('**') ? <strong key={k++} className="font-semibold text-ink">{t.slice(2, -2)}</strong> : <em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split(/\r?\n/);
  const blocks: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    if (line.startsWith('# ')) blocks.push(<h2 key={key++} className="mt-2 text-xl font-bold text-ink">{inline(line.slice(2))}</h2>);
    else if (line.startsWith('## ')) blocks.push(<h3 key={key++} className="mt-2 text-lg font-bold text-ink">{inline(line.slice(3))}</h3>);
    else if (line.trim() === '---') blocks.push(<hr key={key++} className="my-2 border-line" />);
    else if (line.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) {
        const cells = lines[i].split('|').slice(1, -1).map((c) => c.trim());
        if (!cells.every((c) => /^-+$/.test(c))) rows.push(cells);
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={key++} className="overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead className="bg-sunken"><tr>{head.map((h, j) => <th key={j} className="px-3 py-2 font-semibold text-ink">{inline(h)}</th>)}</tr></thead>
            <tbody>{body.map((r, j) => <tr key={j} className="border-t border-line">{r.map((c, n) => <td key={n} className="px-3 py-2 align-top text-ink-2">{inline(c)}</td>)}</tr>)}</tbody>
          </table>
        </div>,
      );
      continue;
    } else if (/^(\d+\.|-)\s/.test(line)) {
      const ordered = /^\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^(\d+\.|-)\s/.test(lines[i])) {
        items.push(lines[i].replace(/^(\d+\.|-)\s/, ''));
        i++;
      }
      const cls = 'space-y-1.5 pl-5 text-[15px] leading-relaxed text-ink-2';
      blocks.push(ordered ? <ol key={key++} className={`list-decimal ${cls}`}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ol> : <ul key={key++} className={`list-disc ${cls}`}>{items.map((t, j) => <li key={j}>{inline(t)}</li>)}</ul>);
      continue;
    } else blocks.push(<p key={key++} className="text-[15px] leading-relaxed text-ink-2">{inline(line)}</p>);
    i++;
  }
  return <div className="space-y-3">{blocks}</div>;
}
