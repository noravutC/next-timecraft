import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { linkMentions, MENTION_HREF } from "@/helper/utils/mention";

type Props = {
  value: string;
  /** names of mentioned members, shown as highlighted @mentions */
  mentionNames?: string[];
};

export const MarkdownView = memo(function MarkdownView({
  value,
  mentionNames = [],
}: Props) {
  if (!value.trim()) {
    return <span className="text-ink-subtle">Nothing to preview</span>;
  }
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ node, ...props }) => (
          <p className="whitespace-pre-wrap" {...props} />
        ),
        strong: ({ node, ...props }) => (
          <strong className="font-semibold" {...props} />
        ),
        em: ({ node, ...props }) => <em className="italic" {...props} />,
        ul: ({ node, ...props }) => (
          <ul className="my-1 list-disc pl-5" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="my-1 list-decimal pl-5" {...props} />
        ),
        li: ({ node, ...props }) => <li className="my-0.5" {...props} />,
        a: ({ node, href, children, ...props }) =>
          href === MENTION_HREF ? (
            <span className="font-medium text-brand-dark">{children}</span>
          ) : (
            <a
              {...props}
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-ink underline underline-offset-3"
            >
              {children}
            </a>
          ),
        code: ({ node, ...props }) => (
          <code
            className="rounded-sm border border-line bg-surface-hover px-1.25 py-px font-mono text-xs text-ink"
            {...props}
          />
        ),
      }}
    >
      {linkMentions(value, mentionNames)}
    </ReactMarkdown>
  );
});
