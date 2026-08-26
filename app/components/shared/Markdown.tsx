import type { LucideIcon } from 'lucide-react';
import { AlertCircle, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '~/lib/utils';

export type CalloutType = 'tip' | 'note' | 'important' | 'warning';

interface MarkdownProps {
  /** Сырой markdown-текст. */
  source: string;
  /** Поисковый запрос — совпадения оборачиваются в <mark>. */
  highlight?: string;
  /** Локализованные подписи для callout-блоков (Совет/Важно/…). */
  calloutLabels?: Partial<Record<CalloutType, string>>;
  className?: string;
}

const CALLOUTS: Record<CalloutType, { icon: LucideIcon; box: string; accent: string }> = {
  tip: { icon: Lightbulb, box: 'border-success/30 bg-success/10', accent: 'text-success' },
  note: { icon: Info, box: 'border-primary/30 bg-primary/10', accent: 'text-primary' },
  important: { icon: AlertCircle, box: 'border-warning/40 bg-warning/10', accent: 'text-warning' },
  warning: { icon: AlertTriangle, box: 'border-destructive/30 bg-destructive/10', accent: 'text-destructive' },
};

/**
 * Лёгкий markdown-рендерер без внешних зависимостей. Поддерживает намеренно
 * ограниченный набор синтаксиса (заголовки, абзацы, жирный/курсив, инлайн- и
 * блочный код, списки, callout-блоки `> [!TIP]`, ссылки и простые таблицы) —
 * ровно то, что используется в справочнике. Мы одновременно и авторы контента,
 * и авторы рендерера, поэтому набор фич ограничен и предсказуем.
 */
export function Markdown({ source, highlight, calloutLabels, className }: MarkdownProps) {
  const term = highlight && highlight.trim().length >= 2 ? highlight.trim() : '';
  const blocks = renderBlocks(source, term, calloutLabels ?? {});
  return <div className={cn('text-foreground/90 text-sm', className)}>{blocks}</div>;
}

/* ------------------------------ block parser ------------------------------ */

function renderBlocks(source: string, term: string, labels: Partial<Record<CalloutType, string>>): ReactNode[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const out: ReactNode[] = [];
  let i = 0;
  let key = 0;

  const isBlank = (s: string) => s.trim() === '';
  const isHeading = (s: string) => /^#{1,4}\s+/.test(s);
  const isHr = (s: string) => /^(-{3,}|\*{3,})\s*$/.test(s);
  const isQuote = (s: string) => /^>\s?/.test(s);
  const isUl = (s: string) => /^\s*[-*]\s+/.test(s);
  const isOl = (s: string) => /^\s*\d+\.\s+/.test(s);
  const isFence = (s: string) => /^```/.test(s);
  const isTableSep = (s: string) => /^\s*\|?[\s:|-]*-[-\s:|]*\|?\s*$/.test(s) && s.includes('-');

  while (i < lines.length) {
    const line = lines[i];

    if (isBlank(line)) {
      i++;
      continue;
    }

    // Fenced code block
    if (isFence(line)) {
      const code: string[] = [];
      i++;
      while (i < lines.length && !isFence(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // closing fence
      out.push(
        <pre
          key={`b${key++}`}
          className="bg-muted my-3 overflow-x-auto rounded-lg p-3 font-mono text-xs leading-relaxed">
          <code>{code.join('\n')}</code>
        </pre>
      );
      continue;
    }

    // Heading
    if (isHeading(line)) {
      const m = line.match(/^(#{1,4})\s+(.*)$/)!;
      const level = m[1].length;
      const content = parseInline(m[2].trim(), `b${key}`, term);
      out.push(headingNode(level, content, `b${key++}`));
      i++;
      continue;
    }

    // Horizontal rule
    if (isHr(line)) {
      out.push(<hr key={`b${key++}`} className="border-border my-5" />);
      i++;
      continue;
    }

    // Table (header row + separator)
    if (line.includes('|') && i + 1 < lines.length && isTableSep(lines[i + 1])) {
      const header = splitRow(line);
      i += 2; // skip header + separator
      const rows: string[][] = [];
      while (i < lines.length && lines[i].includes('|') && !isBlank(lines[i])) {
        rows.push(splitRow(lines[i]));
        i++;
      }
      out.push(tableNode(header, rows, term, `b${key++}`));
      continue;
    }

    // Blockquote / callout
    if (isQuote(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && isQuote(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      out.push(quoteNode(quoteLines, term, labels, `b${key++}`));
      continue;
    }

    // Unordered list
    if (isUl(line)) {
      const items: string[] = [];
      while (i < lines.length && isUl(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ''));
        i++;
      }
      out.push(
        <ul key={`b${key++}`} className="my-2 list-disc space-y-1 pl-5 leading-relaxed">
          {items.map((it, idx) => (
            <li key={idx}>{parseInline(it, `b${key}-li${idx}`, term)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // Ordered list
    if (isOl(line)) {
      const items: string[] = [];
      while (i < lines.length && isOl(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+\.\s+/, ''));
        i++;
      }
      out.push(
        <ol key={`b${key++}`} className="my-2 list-decimal space-y-1 pl-5 leading-relaxed">
          {items.map((it, idx) => (
            <li key={idx}>{parseInline(it, `b${key}-oli${idx}`, term)}</li>
          ))}
        </ol>
      );
      continue;
    }

    // Paragraph — collect consecutive plain lines
    const para: string[] = [];
    while (
      i < lines.length &&
      !isBlank(lines[i]) &&
      !isHeading(lines[i]) &&
      !isHr(lines[i]) &&
      !isQuote(lines[i]) &&
      !isUl(lines[i]) &&
      !isOl(lines[i]) &&
      !isFence(lines[i])
    ) {
      para.push(lines[i]);
      i++;
    }
    out.push(
      <p key={`b${key++}`} className="my-2 leading-relaxed">
        {parseInline(para.join(' '), `b${key}-p`, term)}
      </p>
    );
  }

  return out;
}

function headingNode(level: number, content: ReactNode, key: string): ReactNode {
  if (level === 1)
    return (
      <h2 key={key} className="text-foreground mt-1 mb-3 text-xl font-semibold tracking-tight sm:text-2xl">
        {content}
      </h2>
    );
  if (level === 2)
    return (
      <h3 key={key} className="text-foreground mt-7 mb-2 text-lg font-semibold tracking-tight">
        {content}
      </h3>
    );
  if (level === 3)
    return (
      <h4 key={key} className="text-foreground mt-5 mb-1.5 text-base font-semibold">
        {content}
      </h4>
    );
  return (
    <h5 key={key} className="text-foreground mt-4 mb-1 text-sm font-semibold">
      {content}
    </h5>
  );
}

function tableNode(header: string[], rows: string[][], term: string, key: string): ReactNode {
  return (
    <div key={key} className="border-border my-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            {header.map((cell, idx) => (
              <th key={idx} className="border-border border-b px-3 py-2 text-left font-semibold">
                {parseInline(cell, `${key}-h${idx}`, term)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-border/60 border-b last:border-0">
              {row.map((cell, c) => (
                <td key={c} className="px-3 py-2 align-top">
                  {parseInline(cell, `${key}-r${r}c${c}`, term)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function quoteNode(
  rawLines: string[],
  term: string,
  labels: Partial<Record<CalloutType, string>>,
  key: string
): ReactNode {
  const first = rawLines[0] ?? '';
  const calloutMatch = first.match(/^\[!(TIP|NOTE|IMPORTANT|WARNING)\]\s*$/i);

  if (calloutMatch) {
    const type = calloutMatch[1].toLowerCase() as CalloutType;
    const cfg = CALLOUTS[type];
    const Icon = cfg.icon;
    const label = labels[type] ?? type.charAt(0).toUpperCase() + type.slice(1);
    const body = rawLines.slice(1).join(' ').trim();
    return (
      <div key={key} className={cn('my-3 flex gap-2.5 rounded-lg border p-3', cfg.box)}>
        <Icon className={cn('mt-0.5 size-4 shrink-0', cfg.accent)} />
        <div className="min-w-0 leading-relaxed">
          <span className={cn('mr-1.5 font-semibold', cfg.accent)}>{label}.</span>
          {parseInline(body, `${key}-c`, term)}
        </div>
      </div>
    );
  }

  const body = rawLines.join(' ').trim();
  return (
    <blockquote key={key} className="border-border text-muted-foreground my-3 border-l-2 pl-3 italic">
      {parseInline(body, `${key}-q`, term)}
    </blockquote>
  );
}

function splitRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
}

/* ------------------------------ inline parser ----------------------------- */

function parseInline(text: string, keyBase: string, term: string): ReactNode[] {
  // ВАЖНО: регэксп создаётся ЛОКАЛЬНО на каждый вызов, а не в области модуля.
  // parseInline рекурсивна (жирный/курсив разбираются вложенно), а у /g-регэкспа
  // курсор (lastIndex) — общее состояние объекта. С одним общим INLINE_RE
  // вложенный вызов сбрасывал бы lastIndex внешнего цикла в 0, и внешний while
  // бесконечно матчил бы один и тот же токен (**...**) → зависание вкладки,
  // выглядит как «вечная загрузка». Свой объект на вызов = независимый курсор.
  const re = /(`[^`]+`)|(\*\*[\s\S]+?\*\*)|(\*[\s\S]+?\*)|(\[[^\]]+\]\([^)]+\))/g;
  const nodes: ReactNode[] = [];
  let last = 0;
  let k = 0;
  let m: RegExpExecArray | null;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(...highlightNodes(text.slice(last, m.index), term, `${keyBase}-t${k}`));
    const tok = m[0];

    if (m[1]) {
      nodes.push(
        <code key={`${keyBase}-c${k}`} className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    } else if (m[2]) {
      nodes.push(
        <strong key={`${keyBase}-b${k}`} className="text-foreground font-semibold">
          {parseInline(tok.slice(2, -2), `${keyBase}-b${k}`, term)}
        </strong>
      );
    } else if (m[3]) {
      nodes.push(
        <em key={`${keyBase}-i${k}`}>{parseInline(tok.slice(1, -1), `${keyBase}-i${k}`, term)}</em>
      );
    } else if (m[4]) {
      const lm = tok.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) {
        const label = highlightNodes(lm[1], term, `${keyBase}-l${k}`);
        const href = lm[2];
        if (/^https?:\/\//.test(href)) {
          nodes.push(
            <a
              key={`${keyBase}-a${k}`}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary font-medium underline underline-offset-2">
              {label}
            </a>
          );
        } else {
          nodes.push(
            <Link
              key={`${keyBase}-ln${k}`}
              to={href}
              className="text-primary font-medium underline underline-offset-2">
              {label}
            </Link>
          );
        }
      }
    }

    last = re.lastIndex;
    k++;
  }

  if (last < text.length) nodes.push(...highlightNodes(text.slice(last), term, `${keyBase}-tEnd`));
  return nodes;
}

function highlightNodes(text: string, term: string, keyBase: string): ReactNode[] {
  if (!term) return [text];
  const lcText = text.toLowerCase();
  const lcTerm = term.toLowerCase();
  const out: ReactNode[] = [];
  let i = 0;
  let idx: number;
  let k = 0;

  while ((idx = lcText.indexOf(lcTerm, i)) !== -1) {
    if (idx > i) out.push(text.slice(i, idx));
    out.push(
      <mark key={`${keyBase}-m${k}`} className="bg-warning/40 text-foreground rounded-xs px-0.5">
        {text.slice(idx, idx + lcTerm.length)}
      </mark>
    );
    i = idx + lcTerm.length;
    k++;
  }
  if (i < text.length) out.push(text.slice(i));
  return out.length ? out : [text];
}

/* ------------------------------ plain-text util --------------------------- */

/** Грубо снимает markdown-разметку — для поиска и подсчёта совпадений. */
export function markdownToPlainText(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,4}\s+/gm, '')
    .replace(/^>\s?/gm, '')
    .replace(/\[!(TIP|NOTE|IMPORTANT|WARNING)\]/gi, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*`_#>]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}
