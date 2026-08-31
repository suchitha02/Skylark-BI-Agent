// Copy / download / print actions for an assistant answer. All client-side —
// no backend round-trip needed since the full answer text is already in hand.

import { useState } from 'react';
import { CopyIcon, DownloadIcon, PrintIcon, CheckIcon } from './icons';

function downloadMarkdown(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printAsPdf(content: string, title: string) {
  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;

  const escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
<title>${title}</title>
<style>
  body { font-family: -apple-system, "Segoe UI", sans-serif; padding: 32px; color: #12232f; line-height: 1.6; }
  h1 { font-size: 18px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #6b7280; margin-bottom: 20px; }
  .content { white-space: pre-wrap; font-size: 14px; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  <div class="content">${escaped}</div>
</body>
</html>`);
  printWindow.document.close();
  printWindow.focus();
  // Give the new document a moment to finish painting before invoking print.
  setTimeout(() => printWindow.print(), 300);
}

export default function MessageActions({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (older browser, insecure context) — the
      // other two actions still work, so fail silently here.
    }
  };

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handleCopy}
        title="Copy response"
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-sand-100/50 hover:text-accent-300 hover:bg-ink-700/60 transition-colors"
      >
        {copied ? <CheckIcon width={12} height={12} /> : <CopyIcon width={12} height={12} />}
        {copied ? 'Copied' : 'Copy'}
      </button>
      <button
        type="button"
        onClick={() => downloadMarkdown(content, 'skylark-bi-response.md')}
        title="Download as Markdown"
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-sand-100/50 hover:text-accent-300 hover:bg-ink-700/60 transition-colors"
      >
        <DownloadIcon width={12} height={12} />
        Markdown
      </button>
      <button
        type="button"
        onClick={() => printAsPdf(content, 'Skylark Drones — BI Agent Response')}
        title="Save as PDF"
        className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-sand-100/50 hover:text-accent-300 hover:bg-ink-700/60 transition-colors"
      >
        <PrintIcon width={12} height={12} />
        PDF
      </button>
    </div>
  );
}
