import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = { value: string };

export const MarkdownView = memo(function MarkdownView({ value }: Props) {
  if (!value.trim()) {
    return <span className="text-muted-foreground">Nothing to preview</span>;
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
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline"
          />
        ),
        code: ({ node, ...props }) => (
          <code
            className="rounded bg-muted px-1 py-0.5 text-xs"
            {...props}
          />
        ),
      }}
    >
      {value}
    </ReactMarkdown>
  );
});
