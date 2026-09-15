// Professional Markdown renderer supporting GFM tables, headings, callouts, and code styling.
import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { InteractiveChart } from "@/components/InteractiveChart";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none text-xs leading-relaxed space-y-3 font-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="font-display font-extrabold text-base tracking-tight text-white border-b border-zinc-800 pb-2 mt-3 mb-2 flex items-center gap-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="font-display font-bold text-sm tracking-tight text-white border-b border-zinc-800/80 pb-1.5 mt-4 mb-2 flex items-center gap-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => {
            const isAlert = String(children).includes("🚨") || String(children).includes("⚠️") || String(children).toLowerCase().includes("risk");
            return (
              <h3
                className={`font-semibold text-xs tracking-wide mt-3 mb-1.5 flex items-center gap-1.5 ${
                  isAlert ? "text-amber-400" : "text-zinc-200"
                }`}
              >
                {children}
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="font-medium text-xs text-zinc-300 mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="text-zinc-300 text-xs leading-relaxed mb-2 font-normal">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-4 space-y-1 mb-2 text-zinc-300 text-xs">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-4 space-y-1 mb-2 text-zinc-300 text-xs">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-zinc-300 text-xs leading-relaxed">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          hr: () => (
            <hr className="border-zinc-800/80 my-3" />
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 border border-zinc-800 rounded-lg bg-black">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase tracking-wider">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-zinc-900 font-mono text-[11px] text-zinc-300">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-zinc-900/40 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="py-2 px-3 font-semibold text-zinc-300">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="py-2 px-3 text-zinc-300">
              {children}
            </td>
          ),
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const isChart = Boolean(className && className.includes("chart"));
            if (isChart) {
              try {
                const rawText = String(children).replace(/\n$/, "").trim();
                const parsed = JSON.parse(rawText);
                if (parsed && Array.isArray(parsed.data)) {
                  return <InteractiveChart spec={parsed} />;
                }
              } catch (e) {
                // If parsing fails, fall back to code display
              }
            }

            const isInline = !className;
            if (isInline) {
              return (
                <code className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-zinc-900 text-cyan-300 border border-zinc-800">
                  {children}
                </code>
              );
            }

            return (
              <pre className="p-3 rounded-lg bg-black border border-zinc-800 font-mono text-[11px] overflow-x-auto my-2 text-zinc-300">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-amber-500/80 pl-3 py-1 my-2 bg-amber-950/20 text-amber-200 text-xs rounded-r">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
