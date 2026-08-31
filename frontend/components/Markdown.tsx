// Renders the agent's markdown answers (bold, headings, lists, and — for
// leadership updates especially — tables) as real formatted output instead
// of literal '**', '|', and '<br>' characters showing up as plain text.
//
// rehype-raw lets embedded '<br>' inside table cells (a common LLM habit,
// since GFM table cells can't contain literal newlines) actually render as
// line breaks; rehype-sanitize runs after it to strip anything unsafe while
// still allowing the small set of tags/attrs markdown produces.

import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames || []), 'br'],
};

const components: Components = {
  p: ({ node: _node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
  strong: ({ node: _node, ...props }) => <strong className="font-semibold text-white" {...props} />,
  em: ({ node: _node, ...props }) => <em className="italic" {...props} />,
  h1: ({ node: _node, ...props }) => <h3 className="text-base font-semibold text-white mt-3 mb-1.5 first:mt-0" {...props} />,
  h2: ({ node: _node, ...props }) => <h3 className="text-base font-semibold text-white mt-3 mb-1.5 first:mt-0" {...props} />,
  h3: ({ node: _node, ...props }) => <h4 className="text-sm font-semibold text-accent-300 mt-3 mb-1 first:mt-0" {...props} />,
  ul: ({ node: _node, ...props }) => <ul className="list-disc pl-5 space-y-1 mb-2 marker:text-accent-400" {...props} />,
  ol: ({ node: _node, ...props }) => <ol className="list-decimal pl-5 space-y-1 mb-2 marker:text-accent-400" {...props} />,
  li: ({ node: _node, ...props }) => <li {...props} />,
  hr: () => <hr className="border-ink-700 my-3" />,
  a: ({ node: _node, ...props }) => (
    <a className="text-accent-300 underline underline-offset-2 hover:text-accent-400" target="_blank" rel="noreferrer" {...props} />
  ),
  code: ({ node: _node, ...props }) => (
    <code className="px-1 py-0.5 rounded bg-ink-700 text-accent-300 text-[0.8em]" {...props} />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="overflow-x-auto my-2 rounded-xl border border-ink-700">
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  thead: ({ node: _node, ...props }) => <thead className="bg-ink-700/60" {...props} />,
  th: ({ node: _node, ...props }) => (
    <th className="text-left font-semibold text-sand-200 px-3 py-2 border-b border-ink-700 whitespace-nowrap" {...props} />
  ),
  td: ({ node: _node, ...props }) => <td className="px-3 py-2 border-b border-ink-700/60 align-top" {...props} />,
  tr: ({ node: _node, ...props }) => <tr className="even:bg-ink-800/40" {...props} />,
};

export default function Markdown({ children }: { children: string }) {
  return (
    <div className="text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
