import React, { useState, useCallback, createContext, useContext } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const InCodeBlockContext = createContext(false);

interface Props {
  content: string;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`shrink-0 px-2 py-1 rounded-md text-[11px] font-medium transition-all duration-200 flex items-center gap-1 active:scale-95 ${
        copied
          ? 'anim-pop bg-emerald-500 text-white'
          : 'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600/40'
      }`}
      title="复制代码"
    >
      {copied ? (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L6.75 6.774a2.75 2.75 0 0 0-.596.892l-.848 2.047a.75.75 0 0 0 .98.98l2.047-.848a2.75 2.75 0 0 0 .892-.596l4.261-4.262a1.75 1.75 0 0 0 0-2.474Z"/><path d="M4.75 3.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h6.5c.69 0 1.25-.56 1.25-1.25V9A.75.75 0 0 1 14 9v2.25A2.75 2.75 0 0 1 11.25 14h-6.5A2.75 2.75 0 0 1 2 11.25v-6.5A2.75 2.75 0 0 1 4.75 2H7a.75.75 0 0 1 0 1.5H4.75Z"/></svg>
          已复制
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"><path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/><path d="m7.585 7.585.146.146a.25.25 0 0 0 .177.074h6.68a.25.25 0 0 0 .25-.25V2.25a.25.25 0 0 0-.25-.25H7.908a.25.25 0 0 0-.177.073l-.146.147a.25.25 0 0 1-.177.073H6.75a.75.75 0 0 1 0-1.5h.634a1.75 1.75 0 0 1 1.237-.513h6.679C15.216 0 16 .784 16 1.75v6.5c0 .966-.784 1.75-1.75 1.75h-6.679a1.75 1.75 0 0 1-1.237-.513l-.146-.146a.25.25 0 0 0-.177-.074H6.75a.75.75 0 0 1 0-1.5h.658a.25.25 0 0 0 .177-.073Z"/></svg>
          复制
        </>
      )}
    </button>
  );
}

export default function MarkdownRenderer({ content, className = '' }: Props) {
  if (!content?.trim()) {
    return <p className="text-sm text-gray-400 italic">（题面为空，请在编辑模式填写）</p>;
  }

  return (
    <div className={`markdown-body text-[14px] leading-7 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mt-6 mb-4 text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 pb-2">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mt-6 mb-3 text-gray-900 dark:text-gray-100">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold mt-5 mb-2 text-gray-800 dark:text-gray-200">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">{children}</h4>
          ),
          p: ({ children }) => <p className="my-3 text-gray-700 dark:text-gray-300">{children}</p>,
          ul: ({ children }) => <ul className="list-disc pl-7 my-3 space-y-1 text-gray-700 dark:text-gray-300">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-7 my-3 space-y-1 text-gray-700 dark:text-gray-300">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          pre: ({ children }: any) => {
            let codeText = '';
            React.Children.forEach(children, (child) => {
              if (React.isValidElement(child)) {
                const childChildren = (child.props as any).children;
                if (typeof childChildren === 'string') {
                  codeText += childChildren;
                } else if (Array.isArray(childChildren)) {
                  codeText += childChildren.map((c: any) => (typeof c === 'string' ? c : '')).join('');
                } else if (childChildren !== undefined && childChildren !== null) {
                  codeText += String(childChildren);
                }
              }
            });
            return (
              <InCodeBlockContext.Provider value={true}>
                <div className="group/code relative w-full my-4">
                  <pre className="w-full p-4 pr-16 rounded-xl bg-gray-50 dark:bg-slate-900 overflow-x-auto shadow-inner border border-gray-200 dark:border-gray-700/60">
                    {children}
                  </pre>
                  <div className="absolute top-3 right-3">
                    <CopyButton text={codeText} />
                  </div>
                </div>
              </InCodeBlockContext.Provider>
            );
          },
          code: ({ className: cls, children }: any) => {
            const inBlock = useContext(InCodeBlockContext);
            if (inBlock) {
              return (
                <code
                  className={`block text-[13px] font-mono text-gray-800 dark:text-gray-100 leading-6 ${cls || ''}`}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`inline mx-0.5 px-1.5 py-0.5 rounded text-[13px] font-mono bg-gray-100 dark:bg-gray-700/80 text-rose-600 dark:text-rose-300 border border-gray-200 dark:border-gray-600/50 ${cls || ''}`}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-4 pl-5 border-l-4 border-indigo-400 dark:border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20 py-2 pr-4 rounded-r-lg text-gray-700 dark:text-gray-300">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="min-w-full border-collapse text-[13px]">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-50 dark:bg-gray-800/80">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 text-left font-semibold text-gray-700 dark:text-gray-200">{children}</th>
          ),
          td: ({ children }) => (
            <td className="border-b border-gray-100 dark:border-gray-800 px-4 py-2 text-gray-700 dark:text-gray-300">{children}</td>
          ),
          tr: ({ children }) => <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">{children}</tr>,
          a: ({ children, href }) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">{children}</a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-gray-900 dark:text-gray-100">{children}</strong>,
          hr: () => <hr className="my-6 border-gray-200 dark:border-gray-700" />,
          img: ({ src, alt }) => <img src={src} alt={alt} className="max-w-full my-3 rounded-lg shadow-sm" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
