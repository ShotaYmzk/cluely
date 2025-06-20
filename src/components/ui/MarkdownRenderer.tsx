import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`markdown-content max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 見出しのスタイリング
          h1: ({ children }) => (
            <h1 className="text-lg font-bold text-white mb-3 mt-4 first:mt-0 border-b border-gray-700 pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium text-white mb-2 mt-2 first:mt-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-medium text-white mb-1 mt-2 first:mt-0">
              {children}
            </h4>
          ),
          // 段落のスタイリング
          p: ({ children }) => (
            <p className="text-gray-100 leading-relaxed mb-2 last:mb-0 text-[13px]">
              {children}
            </p>
          ),
          // リストのスタイリング
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-gray-100 mb-2 space-y-0.5 ml-3">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-gray-100 mb-2 space-y-0.5 ml-3">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-gray-100 leading-relaxed text-[13px]">
              {children}
            </li>
          ),
          // コードブロックのスタイリング
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="bg-gray-800 text-green-400 px-1 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              )
            }
            return (
              <code className={className}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre className="bg-gray-900 border border-gray-700 rounded-md p-3 mb-3 overflow-x-auto">
              {children}
            </pre>
          ),
          // ブロッククォートのスタイリング
          blockquote: ({ children }) => (
            <blockquote className="border-l-3 border-blue-500 pl-3 py-1 mb-3 bg-blue-500/10 rounded-r-md">
              <div className="text-gray-200 italic text-[13px]">
                {children}
              </div>
            </blockquote>
          ),
          // テーブルのスタイリング
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3">
              <table className="min-w-full border-collapse border border-gray-700 text-[12px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-gray-800">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="bg-gray-900">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-gray-700">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="border border-gray-700 px-2 py-1 text-left text-white font-medium text-[12px]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-gray-700 px-2 py-1 text-gray-100 text-[12px]">
              {children}
            </td>
          ),
          // リンクのスタイリング
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-blue-400 hover:text-blue-300 underline transition-colors text-[13px]"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          // 強調のスタイリング
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-gray-200">
              {children}
            </em>
          ),
          // 水平線のスタイリング
          hr: () => (
            <hr className="border-gray-700 my-4" />
          ),
          // チェックボックスリストのスタイリング
          input: ({ type, checked }) => {
            if (type === 'checkbox') {
              return (
                <input 
                  type="checkbox" 
                  checked={checked} 
                  readOnly 
                  className="mr-2 w-3 h-3 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-1"
                />
              )
            }
            return null
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer 