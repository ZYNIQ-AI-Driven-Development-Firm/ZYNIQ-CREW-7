import React, { useEffect, useRef, useState } from 'react';

type CodePreviewProps = {
  code: string;
  language: string;
  fileName: string;
};

export const CodePreview: React.FC<CodePreviewProps> = ({ code, language, fileName }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setError(null);
    setIsLoading(true);

    if (!iframeRef.current) return;

    try {
      const iframe = iframeRef.current;
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;

      if (!iframeDoc) {
        setError('Unable to access iframe document');
        setIsLoading(false);
        return;
      }

      // Create preview content based on language
      let previewContent = '';

      if (language === 'html' || fileName.endsWith('.html')) {
        previewContent = code;
      } else if (language.includes('javascript') || language.includes('react')) {
        // Wrap JavaScript/React code in HTML
        previewContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    ${code}
  </script>
</body>
</html>`;
      } else {
        setError(`Preview not supported for ${language} files`);
        setIsLoading(false);
        return;
      }

      // Write content to iframe
      iframeDoc.open();
      iframeDoc.write(previewContent);
      iframeDoc.close();

      // Listen for errors in iframe
      iframe.contentWindow?.addEventListener('error', (e) => {
        setError(`Runtime error: ${e.message}`);
        setIsLoading(false);
      });

      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to render preview');
      setIsLoading(false);
    }
  }, [code, language, fileName]);

  if (error) {
    return (
      <div className="h-full flex items-center justify-center border-l border-white/10 bg-[#0a0f16] p-8">
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-white mb-2">Preview Error</h3>
          <p className="text-sm text-[#ff6b6b] bg-[#2f1c1c] border border-[#ff6b6b]/20 rounded-lg p-3">
            {error}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col border-l border-white/10 bg-[#0a0f16]">
      {/* Header */}
      <div className="border-b border-white/10 bg-[#0d141c] px-4 py-2">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-[#4cf5a1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <h3 className="text-sm font-semibold text-white">Live Preview</h3>
          {isLoading && (
            <span className="text-xs text-[#8d96b3]">Loading...</span>
          )}
        </div>
      </div>

      {/* Preview iframe */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
          title="Code Preview"
        />
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 bg-[#0d141c] px-4 py-1.5 flex items-center justify-between text-xs text-[#8d96b3]">
        <span>Sandboxed Preview</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-[#4cf5a1]"></span>
          Live
        </span>
      </div>
    </div>
  );
};
