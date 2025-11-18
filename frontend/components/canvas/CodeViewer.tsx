import React from 'react';

type CodeViewerProps = {
  code: string;
  language: string;
  fileName: string;
  showPreview?: boolean;
  onTogglePreview?: () => void;
};

const LANGUAGE_MAP: Record<string, string> = {
  py: 'python',
  ts: 'typescript',
  tsx: 'typescript-react',
  js: 'javascript',
  jsx: 'javascript-react',
  json: 'json',
  css: 'css',
  html: 'html',
  sql: 'sql',
  yml: 'yaml',
  yaml: 'yaml',
  md: 'markdown',
};

const getLanguageFromFileName = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return LANGUAGE_MAP[ext] || 'plaintext';
};

const getLanguageLabel = (lang: string): string => {
  const labels: Record<string, string> = {
    python: 'Python',
    typescript: 'TypeScript',
    'typescript-react': 'TypeScript React',
    javascript: 'JavaScript',
    'javascript-react': 'JavaScript React',
    json: 'JSON',
    css: 'CSS',
    html: 'HTML',
    sql: 'SQL',
    yaml: 'YAML',
    markdown: 'Markdown',
  };
  return labels[lang] || lang.toUpperCase();
};

export const CodeViewer: React.FC<CodeViewerProps> = ({
  code,
  language: providedLanguage,
  fileName,
  showPreview = false,
  onTogglePreview,
}) => {
  const language = providedLanguage || getLanguageFromFileName(fileName);
  const canPreview = ['html', 'jsx', 'javascript-react', 'tsx', 'typescript-react'].includes(language);
  const lineCount = code.split('\n').length;
  const lines = code.split('\n');

  return (
    <div className="h-full flex flex-col bg-[#0a0f16]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d141c] px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-white font-mono">{fileName}</h3>
          <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#E5484D]/20 text-[#E5484D]">
            {getLanguageLabel(language)}
          </span>
          <span className="text-xs text-[#8d96b3]">
            {lineCount} {lineCount === 1 ? 'line' : 'lines'}
          </span>
        </div>

        {canPreview && onTogglePreview && (
          <button
            type="button"
            onClick={onTogglePreview}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              showPreview
                ? 'bg-[#1c2f1c] text-[#4cf5a1] border-[#4cf5a1]/60'
                : 'bg-[#151E28] text-[#8d96b3] border-white/10 hover:border-white/20'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
        )}
      </div>

      {/* Code Content with line numbers */}
      <div className="flex-1 overflow-auto bg-[#1e1e1e] flex">
        {/* Line Numbers */}
        <div className="select-none py-4 px-3 text-right bg-[#171717] border-r border-white/5">
          {lines.map((_, index) => (
            <div key={index} className="text-xs leading-relaxed text-[#64748b] font-mono">
              {index + 1}
            </div>
          ))}
        </div>
        
        {/* Code */}
        <pre className="flex-1 m-0 p-4 text-sm leading-relaxed overflow-x-auto">
          <code className="text-[#e4e4e7] font-mono whitespace-pre">
            {code}
          </code>
        </pre>
      </div>

      {/* Footer with stats */}
      <div className="border-t border-white/10 bg-[#0d141c] px-4 py-1.5 flex items-center justify-between text-xs text-[#8d96b3]">
        <span>{code.length} characters</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};
