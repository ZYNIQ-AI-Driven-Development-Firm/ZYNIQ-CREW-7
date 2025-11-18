import React, { useEffect, useRef, useState } from 'react';

type ChatInputProps = {
  onSendMessage: (message: string) => void;
  isSending?: boolean;
  prefilledPrompt?: string;
  onPrefillConsumed?: () => void;
  maxLength?: number;
  advancedMode?: boolean;
  onToggleAdvancedMode?: () => void;
};

const DEFAULT_MAX_LENGTH = 1000;

const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isSending = false,
  prefilledPrompt,
  onPrefillConsumed,
  maxLength = DEFAULT_MAX_LENGTH,
  advancedMode = false,
  onToggleAdvancedMode,
}) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (prefilledPrompt !== undefined && prefilledPrompt !== null) {
      const truncatedPrompt = prefilledPrompt.slice(0, maxLength);
      setMessage(truncatedPrompt);
      window.requestAnimationFrame(() => {
        textareaRef.current?.focus();
      });
      onPrefillConsumed?.();
    }
  }, [prefilledPrompt, maxLength, onPrefillConsumed]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  }, [message]);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = event.target.value.slice(0, maxLength);
    setMessage(nextValue);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed || isSending) return;
    onSendMessage(trimmed);
    setMessage('');
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      const trimmed = message.trim();
      if (!trimmed || isSending) return;
      onSendMessage(trimmed);
      setMessage('');
    }
  };

  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const [file] = event.target.files ?? [];
    if (file) {
      console.info('Attachment selected:', file.name);
    }
  };

  const characterCount = message.length;
  const isOverLimit = characterCount >= maxLength;

  return (
    <form onSubmit={handleSubmit} className="space-y-2" noValidate>
      <div className="relative rounded-3xl border border-[#253045] bg-[#121a28] shadow-[0_18px_48px_rgba(4,6,10,0.45)]">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          className="w-full resize-none overflow-hidden rounded-3xl bg-transparent px-5 pb-16 pt-5 text-sm md:text-base text-[#f4f6fb] placeholder:text-[#76809a] focus:outline-none"
          placeholder="Ask whatever you want..."
          maxLength={maxLength}
          aria-label="Message input"
          disabled={isSending}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-4 right-4 w-1 rounded-full bg-gradient-to-b from-[#ea2323] via-[#b61d1d] to-[#7f1616]"
        />
        <div className="absolute inset-x-5 bottom-3 flex flex-col items-start gap-2 text-[0.75rem] md:flex-row md:items-center md:justify-between md:text-sm">
          <div className="flex flex-wrap items-center gap-3 text-[#8e96ad]">
            <button
              type="button"
              onClick={handleAttachmentClick}
              className="inline-flex items-center gap-2 font-medium transition hover:text-[#ea2323]"
            >
              <PaperclipIcon className="w-4 h-4" />
              Add Attachment
            </button>
            <button
              type="button"
              onClick={() => console.info('Use Image clicked')}
              className="inline-flex items-center gap-2 font-medium transition hover:text-[#ea2323]"
            >
              <CameraIcon className="w-4 h-4" />
              Use Image
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {onToggleAdvancedMode && (
              <button
                type="button"
                onClick={onToggleAdvancedMode}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition ${
                  advancedMode
                    ? 'bg-[#2f1c1c] text-[#ff6b6b] border border-[#E5484D]/60'
                    : 'bg-[#161d2b] text-[#8e96ad] border border-transparent'
                }`}
                aria-pressed={advancedMode}
                aria-label="Toggle Advanced Mode"
              >
                <GridIcon className="w-3 h-3" />
                <span>Advanced</span>
              </button>
            )}
            <span className={`text-xs md:text-sm ${isOverLimit ? 'text-[#ff6b6b]' : 'text-[#8e96ad]'}`}>
              {characterCount}/{maxLength}
            </span>
            <button
              type="submit"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#ea2323] text-white transition hover:bg-[#c81f1f] disabled:cursor-not-allowed disabled:bg-[#5a1a1a]"
              disabled={isSending || !message.trim()}
              aria-label="Send message"
            >
              <SendIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        hidden
      />
    </form>
  );
};

type IconProps = {
  className?: string;
};

const SendIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M3.476 2.405a.75.75 0 0 0-.962.945l2.706 8.432H14.5a.75.75 0 0 1 0 1.5H5.22l-2.706 8.432a.75.75 0 0 0 .962.945 64.205 64.205 0 0 0 18.762-9.238.75.75 0 0 0 0-1.278A64.205 64.205 0 0 0 3.476 2.405Z" />
  </svg>
);

const PaperclipIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m18.375 12.739-7.693 7.693a4.5 4.5 0 1 1-6.364-6.364l10.94-10.94A3 3 0 1 1 19.5 7.372L8.552 18.32" />
    <path d="m8.561 18.31-.01.01" />
  </svg>
);

const CameraIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 8.25A2.25 2.25 0 0 1 5.25 6h1.086a2.25 2.25 0 0 0 1.8-.9l.6-.8A2.25 2.25 0 0 1 9.536 3h4.928a2.25 2.25 0 0 1 1.8.9l.6.8a2.25 2.25 0 0 0 1.8.9h1.086A2.25 2.25 0 0 1 21 8.25v9.5A2.25 2.25 0 0 1 18.75 20H5.25A2.25 2.25 0 0 1 3 17.75Z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

const GridIcon: React.FC<IconProps> = ({ className }) => (
  <svg viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 0 0 2 4.25v2.5A2.25 2.25 0 0 0 4.25 9h2.5A2.25 2.25 0 0 0 9 6.75v-2.5A2.25 2.25 0 0 0 6.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 2 13.25v2.5A2.25 2.25 0 0 0 4.25 18h2.5A2.25 2.25 0 0 0 9 15.75v-2.5A2.25 2.25 0 0 0 6.75 11h-2.5Zm9-9A2.25 2.25 0 0 0 11 4.25v2.5A2.25 2.25 0 0 0 13.25 9h2.5A2.25 2.25 0 0 0 18 6.75v-2.5A2.25 2.25 0 0 0 15.75 2h-2.5Zm0 9A2.25 2.25 0 0 0 11 13.25v2.5A2.25 2.25 0 0 0 13.25 18h2.5A2.25 2.25 0 0 0 18 15.75v-2.5A2.25 2.25 0 0 0 15.75 11h-2.5Z" clipRule="evenodd" />
  </svg>
);

export default ChatInput;
