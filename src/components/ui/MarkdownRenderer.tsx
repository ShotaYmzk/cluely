import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface MarkdownRendererProps {
  content: string
  className?: string
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className = '' 
}) => {
  return (
    <div className={`markdown-content ${className}`} style={{ cursor: 'default' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 見出し
          h1: ({ children }) => (
            <h1 className="text-lg font-semibold text-white mb-2 mt-3 first:mt-0" style={{ cursor: 'default' }}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold text-white mb-2 mt-3 first:mt-0" style={{ cursor: 'default' }}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-medium text-white mb-1 mt-2 first:mt-0" style={{ cursor: 'default' }}>
              {children}
            </h3>
          ),
          
          // 段落
          p: ({ children }) => (
            <p className="text-white/90 leading-relaxed mb-2 last:mb-0" style={{ cursor: 'default' }}>
              {children}
            </p>
          ),
          
          // リスト
          ul: ({ children }) => (
            <ul className="list-disc list-inside text-white/90 mb-2 space-y-1 ml-3" style={{ cursor: 'default' }}>
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside text-white/90 mb-2 space-y-1 ml-3" style={{ cursor: 'default' }}>
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-white/90" style={{ cursor: 'default' }}>
              {children}
            </li>
          ),
          
          // コード
          code: ({ children, className }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code 
                  className="bg-white/20 text-green-300 px-1.5 py-0.5 rounded text-sm font-mono"
                  style={{ cursor: 'default' }}
                >
                  {children}
                </code>
              )
            }
            return (
              <code className={className} style={{ cursor: 'default' }}>
                {children}
              </code>
            )
          },
          pre: ({ children }) => (
            <pre 
              className="bg-black/40 border border-white/20 rounded-lg p-3 mb-3 overflow-x-auto text-sm"
              style={{ cursor: 'default' }}
            >
              {children}
            </pre>
          ),
          
          // ブロッククオート
          blockquote: ({ children }) => (
            <blockquote 
              className="border-l-4 border-blue-400 pl-4 py-2 mb-3 bg-blue-500/10 rounded-r-lg"
              style={{ cursor: 'default' }}
            >
              <div className="text-white/80 italic">
                {children}
              </div>
            </blockquote>
          ),
          
          // 強調
          strong: ({ children }) => (
            <strong className="font-semibold text-white" style={{ cursor: 'default' }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-white/80" style={{ cursor: 'default' }}>
              {children}
            </em>
          ),
          
          // リンク
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-blue-300 underline hover:text-blue-200 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              style={{ cursor: 'default' }}
            >
              {children}
            </a>
          ),
          
          // 水平線
          hr: () => (
            <hr className="border-white/20 my-4" style={{ cursor: 'default' }} />
          ),
          
          // テーブル（シンプル版）
          table: ({ children }) => (
            <div className="overflow-x-auto mb-3" style={{ cursor: 'default' }}>
              <table className="min-w-full border-collapse border border-white/20 text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-white/10" style={{ cursor: 'default' }}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody style={{ cursor: 'default' }}>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="border-b border-white/10" style={{ cursor: 'default' }}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th 
              className="border border-white/20 px-2 py-1 text-left text-white font-medium"
              style={{ cursor: 'default' }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td 
              className="border border-white/20 px-2 py-1 text-white/90"
              style={{ cursor: 'default' }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

export default MarkdownRenderer