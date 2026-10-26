import {
  type CalloutType,
  markdownToPlainText,
  renderMarkdownBlocks,
} from '~/lib/markdown';
import { cn } from '~/lib/utils';

export { type CalloutType, markdownToPlainText };

interface MarkdownProps {
  /** Сырой markdown-текст. */
  source: string;
  /** Поисковый запрос — совпадения оборачиваются в <mark>. */
  highlight?: string;
  /** Локализованные подписи для callout-блоков (Совет/Важно/…). */
  calloutLabels?: Partial<Record<CalloutType, string>>;
  className?: string;
}

/**
 * Лёгкий markdown-рендерер без внешних зависимостей. Поддерживает намеренно
 * ограниченный набор синтаксиса (заголовки, абзацы, жирный/курсив, инлайн- и
 * блочный код, списки, callout-блоки `> [!TIP]`, ссылки и простые таблицы) —
 * ровно то, что используется в справочнике.
 */
export function Markdown({ source, highlight, calloutLabels, className }: MarkdownProps) {
  const term = highlight && highlight.trim().length >= 2 ? highlight.trim() : '';
  const blocks = renderMarkdownBlocks(source, term, calloutLabels ?? {});
  return <div className={cn('text-foreground/90 text-sm', className)}>{blocks}</div>;
}
